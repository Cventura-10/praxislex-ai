-- ========================================
-- CRITICAL SECURITY FIXES - Phase 1 FINAL
-- ========================================

-- Fix 1: AI Actions Log - Prevent Forgery
DROP POLICY IF EXISTS "System can insert AI actions" ON ai_actions_log;
DROP POLICY IF EXISTS "Users can insert their own AI actions" ON ai_actions_log;
DROP POLICY IF EXISTS "Service role can insert any AI actions" ON ai_actions_log;

CREATE POLICY "Users can insert their own AI actions"
ON ai_actions_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert any AI actions"
ON ai_actions_log FOR INSERT
TO service_role
WITH CHECK (true);


-- Fix 2: Add PII Access to Immutable Audit Log
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
  
  SELECT COALESCE(SUM(access_count), 0) INTO v_access_count
  FROM pii_access_rate_limit
  WHERE user_id = p_user_id
    AND window_start >= v_window_start;
  
  IF v_access_count >= p_max_accesses THEN
    RETURN false;
  END IF;
  
  INSERT INTO pii_access_rate_limit (user_id, window_start, access_count)
  VALUES (p_user_id, now(), 1)
  ON CONFLICT (user_id, window_start) DO UPDATE
    SET access_count = pii_access_rate_limit.access_count + 1;
  
  INSERT INTO data_access_audit(user_id, record_id, table_name, action)
  VALUES (p_user_id, p_client_id, 'clients', 'reveal_pii');
  
  -- Log to immutable audit trail with hash verification
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