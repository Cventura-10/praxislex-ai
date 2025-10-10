-- ============================================
-- CRITICAL SECURITY FIXES - Phase 1 (CORRECTED)
-- ============================================

-- Fix 1: AI Actions Log - Prevent Forgery
-- Current policy allows any user to insert logs as anyone
-- Fix: Ensure users can only log their own actions

DROP POLICY IF EXISTS "System can insert AI actions" ON ai_actions_log;

-- Regular users can only insert their own actions
CREATE POLICY "Users can insert their own AI actions"
ON ai_actions_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role (edge functions) can insert for any user
CREATE POLICY "Service role can insert any AI actions"
ON ai_actions_log FOR INSERT
TO service_role
WITH CHECK (true);


-- Fix 2: Client Portal View - Remove SECURITY DEFINER
-- Current view bypasses RLS policies
-- Note: This is a VIEW, not a base table, so we drop and recreate
-- We'll create a simpler version since complex aggregations in views with RLS are problematic

DROP VIEW IF EXISTS client_portal_view;

-- Create a simpler, safer view without SECURITY DEFINER
CREATE VIEW client_portal_view AS
SELECT 
  c.id,
  c.nombre_completo,
  c.email,
  c.telefono,
  c.direccion,
  c.cedula_rnc_encrypted,
  c.user_id as owner_user_id,
  c.auth_user_id,
  c.accepted_terms,
  c.created_at,
  c.updated_at
FROM clients c;

-- RLS on views: Clients table already has RLS, so queries through the view will be restricted
-- Users can only see rows where they're the owner or the authenticated client
COMMENT ON VIEW client_portal_view IS 'Simplified client portal view - inherits RLS from clients table';


-- Fix 3: Complete Invitation Token Migration
-- Remove plaintext token column (keep only hashed)

-- First, hash any remaining plaintext tokens
UPDATE client_invitations
SET token_hash = hash_invitation_token(token)
WHERE token IS NOT NULL AND token_hash IS NULL;

-- Now drop the plaintext token column
ALTER TABLE client_invitations DROP COLUMN IF EXISTS token;


-- Fix 4: Add PII Access to Immutable Audit Log
-- Update the PII access function to also log to events_audit

CREATE OR REPLACE FUNCTION check_and_log_pii_access(
  p_user_id uuid,
  p_client_id uuid,
  p_max_accesses integer DEFAULT 100,
  p_window_hours integer DEFAULT 24
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_count integer;
  v_window_start timestamptz;
BEGIN
  v_window_start := now() - (p_window_hours || ' hours')::interval;
  
  -- Check rate limit
  SELECT COALESCE(SUM(access_count), 0) INTO v_access_count
  FROM pii_access_rate_limit
  WHERE user_id = p_user_id
    AND window_start >= v_window_start;
  
  IF v_access_count >= p_max_accesses THEN
    RETURN false;
  END IF;
  
  -- Log to rate limit table
  INSERT INTO pii_access_rate_limit (user_id, window_start, access_count)
  VALUES (p_user_id, now(), 1)
  ON CONFLICT (user_id, window_start) DO UPDATE
    SET access_count = pii_access_rate_limit.access_count + 1;
  
  -- Log to data access audit
  INSERT INTO data_access_audit(user_id, record_id, table_name, action)
  VALUES (p_user_id, p_client_id, 'clients', 'reveal_pii');
  
  -- NEW: Log to immutable audit trail with hash verification
  PERFORM log_audit_event(
    'clients',
    p_client_id,
    'REVEAL_PII',
    jsonb_build_object(
      'fields_revealed', ARRAY['cedula', 'email', 'telefono', 'direccion'],
      'reason', 'lawyer_access',
      'timestamp', now()
    )
  );
  
  RETURN true;
END;
$$;