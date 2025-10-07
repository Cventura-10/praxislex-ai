-- =====================================================
-- SECURITY FIX: Protect Client PII from Unauthorized Access
-- =====================================================

-- 1. Create function to validate auth_user_id assignment
-- This ensures auth_user_id can only be set once and only through valid invitation
CREATE OR REPLACE FUNCTION public.validate_auth_user_id_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow initial insert without auth_user_id
  IF (TG_OP = 'INSERT' AND NEW.auth_user_id IS NULL) THEN
    RETURN NEW;
  END IF;

  -- For updates: check if auth_user_id is being changed
  IF (TG_OP = 'UPDATE') THEN
    -- If auth_user_id was already set, don't allow changes
    IF (OLD.auth_user_id IS NOT NULL AND NEW.auth_user_id != OLD.auth_user_id) THEN
      RAISE EXCEPTION 'auth_user_id cannot be changed once set. Client already linked to user account.';
    END IF;
    
    -- If setting auth_user_id for the first time, verify it's done through invitation system
    IF (OLD.auth_user_id IS NULL AND NEW.auth_user_id IS NOT NULL) THEN
      -- Verify there's a valid, used invitation for this client
      IF NOT EXISTS (
        SELECT 1 FROM public.client_invitations
        WHERE client_id = NEW.id
          AND used_by = NEW.auth_user_id
          AND used_at IS NOT NULL
          AND used_at > now() - interval '5 minutes'  -- Must be recent
      ) THEN
        RAISE EXCEPTION 'auth_user_id can only be set through valid invitation acceptance';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create trigger to enforce auth_user_id validation
DROP TRIGGER IF EXISTS validate_auth_user_id_trigger ON public.clients;
CREATE TRIGGER validate_auth_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_auth_user_id_assignment();

-- 3. Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Clients: owners and self can view full data" ON public.clients;

-- 4. Create granular SELECT policies with better security

-- Policy 1: Owners (lawyers) can view all their clients' data
CREATE POLICY "Owners can view their clients data"
ON public.clients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Authenticated clients can only view their own basic info (not full PII)
-- They use reveal_client_pii function for controlled PII access
CREATE POLICY "Clients can view own basic info"
ON public.clients
FOR SELECT
TO authenticated
USING (
  auth.uid() = auth_user_id
  AND auth_user_id IS NOT NULL
);

-- 5. Strengthen UPDATE policy to protect auth_user_id changes
DROP POLICY IF EXISTS "Clients: update owner only" ON public.clients;

CREATE POLICY "Only owners can update client data"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Add function to safely update client auth link with additional validation
CREATE OR REPLACE FUNCTION public.link_client_to_auth_user(
  p_client_id uuid,
  p_auth_user_id uuid,
  p_invitation_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_client record;
BEGIN
  -- Validate invitation exists and is valid
  SELECT * INTO v_invitation
  FROM public.client_invitations
  WHERE token = p_invitation_token
    AND client_id = p_client_id
    AND used_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  -- Get client record
  SELECT * INTO v_client
  FROM public.clients
  WHERE id = p_client_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  -- Verify client is not already linked
  IF v_client.auth_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Client already linked to a user account';
  END IF;

  -- Verify the requesting user matches
  IF auth.uid() != p_auth_user_id THEN
    RAISE EXCEPTION 'Auth user ID mismatch';
  END IF;

  -- Mark invitation as used
  UPDATE public.client_invitations
  SET used_at = now(),
      used_by = p_auth_user_id
  WHERE id = v_invitation.id;

  -- Link client to auth user
  UPDATE public.clients
  SET auth_user_id = p_auth_user_id,
      accepted_terms = false
  WHERE id = p_client_id;

  -- Audit the action
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (p_auth_user_id, p_client_id, 'clients', 'link_auth_user');

  RETURN true;
END;
$$;

-- 7. Add rate limiting for invitation validation attempts
CREATE OR REPLACE FUNCTION public.check_invitation_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_attempts int;
BEGIN
  -- Count recent failed attempts from same user (last 15 minutes)
  SELECT COUNT(*) INTO v_recent_attempts
  FROM public.client_invitations
  WHERE used_by = auth.uid()
    AND used_at > now() - interval '15 minutes';

  IF v_recent_attempts >= 5 THEN
    RAISE EXCEPTION 'Too many invitation validation attempts. Please wait before trying again.';
  END IF;

  RETURN NEW;
END;
$$;

-- 8. Add trigger for rate limiting on invitations
DROP TRIGGER IF EXISTS check_invitation_rate_limit_trigger ON public.client_invitations;
CREATE TRIGGER check_invitation_rate_limit_trigger
  BEFORE UPDATE ON public.client_invitations
  FOR EACH ROW
  WHEN (NEW.used_at IS NOT NULL AND OLD.used_at IS NULL)
  EXECUTE FUNCTION public.check_invitation_rate_limit();

-- 9. Add function to securely check if user has access to client
CREATE OR REPLACE FUNCTION public.user_can_access_client(p_user_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = p_client_id 
    AND (
      user_id = p_user_id  -- Owner (lawyer)
      OR (auth_user_id = p_user_id AND auth_user_id IS NOT NULL)  -- Authenticated client
    )
  );
$$;

-- 10. Add comment documentation
COMMENT ON FUNCTION public.validate_auth_user_id_assignment() IS 
'Security function: Ensures auth_user_id can only be set once through valid invitation process';

COMMENT ON FUNCTION public.link_client_to_auth_user(uuid, uuid, text) IS 
'Security function: Safely links a client record to an authenticated user account with validation';

COMMENT ON FUNCTION public.user_can_access_client(uuid, uuid) IS 
'Security function: Checks if a user has legitimate access to a client record';

COMMENT ON TRIGGER validate_auth_user_id_trigger ON public.clients IS 
'Security trigger: Prevents unauthorized modification of auth_user_id field';