-- Enable pgcrypto extension for secure token hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add column for hashed token
ALTER TABLE public.client_invitations 
ADD COLUMN IF NOT EXISTS token_hash text;

-- Create function to hash tokens using bcrypt (more secure than SHA256)
CREATE OR REPLACE FUNCTION public.hash_invitation_token(p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use bcrypt with default cost factor (10)
  RETURN crypt(p_token, gen_salt('bf'));
END;
$$;

-- Create function to verify token against hash
CREATE OR REPLACE FUNCTION public.verify_invitation_token(p_token text, p_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Compare token with stored hash
  RETURN p_hash = crypt(p_token, p_hash);
END;
$$;

-- Create table for rate limiting token validation attempts
CREATE TABLE IF NOT EXISTS public.token_validation_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  ip_address text,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

-- Enable RLS on token validation attempts
ALTER TABLE public.token_validation_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view validation attempts
CREATE POLICY "Admins can view validation attempts"
ON public.token_validation_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster rate limit checks
CREATE INDEX IF NOT EXISTS idx_token_validation_attempts_hash_time 
ON public.token_validation_attempts(token_hash, attempted_at);

-- Function to check rate limit for token validation (max 5 attempts per hour per token)
CREATE OR REPLACE FUNCTION public.check_token_rate_limit(p_token_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts int;
BEGIN
  -- Count failed attempts in last hour
  SELECT COUNT(*) INTO v_attempts
  FROM public.token_validation_attempts
  WHERE token_hash = p_token_hash
    AND attempted_at > now() - interval '1 hour'
    AND success = false;
  
  -- Return false if too many attempts
  RETURN v_attempts < 5;
END;
$$;

-- Function to log token validation attempt
CREATE OR REPLACE FUNCTION public.log_token_validation(
  p_token_hash text, 
  p_success boolean,
  p_ip_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.token_validation_attempts(token_hash, success, ip_address)
  VALUES (p_token_hash, p_success, p_ip_address);
  
  -- Clean up old attempts (older than 24 hours)
  DELETE FROM public.token_validation_attempts
  WHERE attempted_at < now() - interval '24 hours';
END;
$$;

-- Secure function to validate invitation token with rate limiting
CREATE OR REPLACE FUNCTION public.validate_invitation_token_secure(p_token text)
RETURNS TABLE(client_id uuid, client_email text, is_valid boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_client record;
  v_token_hash text;
BEGIN
  -- Generate hash of provided token
  v_token_hash := public.hash_invitation_token(p_token);
  
  -- Check rate limit
  IF NOT public.check_token_rate_limit(v_token_hash) THEN
    PERFORM public.log_token_validation(v_token_hash, false, NULL);
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'Too many validation attempts. Please wait before trying again.'::text;
    RETURN;
  END IF;
  
  -- Find invitation by comparing token hash
  SELECT * INTO v_invitation
  FROM public.client_invitations
  WHERE token_hash IS NOT NULL 
    AND public.verify_invitation_token(p_token, token_hash);
  
  -- If not found, check old plain-text tokens (for backward compatibility during migration)
  IF NOT FOUND THEN
    SELECT * INTO v_invitation
    FROM public.client_invitations
    WHERE token = p_token AND token_hash IS NULL;
    
    -- If found with plain token, hash it now
    IF FOUND THEN
      UPDATE public.client_invitations
      SET token_hash = public.hash_invitation_token(token),
          token = NULL  -- Remove plain text token
      WHERE id = v_invitation.id;
    END IF;
  END IF;

  -- Check if invitation exists
  IF NOT FOUND THEN
    PERFORM public.log_token_validation(v_token_hash, false, NULL);
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'Invalid invitation token'::text;
    RETURN;
  END IF;

  -- Check if already used
  IF v_invitation.used_at IS NOT NULL THEN
    PERFORM public.log_token_validation(v_invitation.token_hash, false, NULL);
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Invitation already used'::text;
    RETURN;
  END IF;

  -- Check if expired
  IF v_invitation.expires_at < now() THEN
    PERFORM public.log_token_validation(v_invitation.token_hash, false, NULL);
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Invitation expired'::text;
    RETURN;
  END IF;

  -- Get client info
  SELECT * INTO v_client
  FROM public.clients
  WHERE id = v_invitation.client_id;

  -- Check if client already linked
  IF v_client.auth_user_id IS NOT NULL THEN
    PERFORM public.log_token_validation(v_invitation.token_hash, false, NULL);
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Client already linked to an account'::text;
    RETURN;
  END IF;

  -- Log successful validation
  PERFORM public.log_token_validation(v_invitation.token_hash, true, NULL);

  -- Return success
  RETURN QUERY SELECT v_invitation.client_id, v_client.email, true, 'Valid'::text;
END;
$$;

-- Secure function to use/accept invitation token
CREATE OR REPLACE FUNCTION public.accept_invitation_token_secure(
  p_token text,
  p_client_id uuid
)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_token_hash text;
BEGIN
  -- Generate hash of provided token
  v_token_hash := public.hash_invitation_token(p_token);
  
  -- Check rate limit
  IF NOT public.check_token_rate_limit(v_token_hash) THEN
    RETURN QUERY SELECT false, 'Too many attempts. Please wait before trying again.'::text;
    RETURN;
  END IF;
  
  -- Find and validate invitation
  SELECT * INTO v_invitation
  FROM public.client_invitations
  WHERE client_id = p_client_id
    AND token_hash IS NOT NULL
    AND public.verify_invitation_token(p_token, token_hash)
    AND used_at IS NULL
    AND expires_at > now();
  
  -- Check old plain-text tokens for backward compatibility
  IF NOT FOUND THEN
    SELECT * INTO v_invitation
    FROM public.client_invitations
    WHERE client_id = p_client_id
      AND token = p_token
      AND token_hash IS NULL
      AND used_at IS NULL
      AND expires_at > now();
  END IF;

  IF NOT FOUND THEN
    PERFORM public.log_token_validation(v_token_hash, false, NULL);
    RETURN QUERY SELECT false, 'Invalid or expired invitation'::text;
    RETURN;
  END IF;

  -- Verify requesting user
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, 'User not authenticated'::text;
    RETURN;
  END IF;

  -- Mark invitation as used
  UPDATE public.client_invitations
  SET used_at = now(),
      used_by = auth.uid(),
      token_hash = COALESCE(token_hash, public.hash_invitation_token(token)),
      token = NULL  -- Remove plain text token
  WHERE id = v_invitation.id;

  -- Link client to auth user
  UPDATE public.clients
  SET auth_user_id = auth.uid(),
      accepted_terms = false
  WHERE id = p_client_id
    AND auth_user_id IS NULL;  -- Ensure not already linked

  -- Log successful acceptance
  PERFORM public.log_token_validation(v_token_hash, true, NULL);

  -- Audit the action
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (auth.uid(), p_client_id, 'clients', 'accept_invitation');

  RETURN QUERY SELECT true, 'Success'::text;
END;
$$;

-- Create trigger to automatically hash tokens on insert
CREATE OR REPLACE FUNCTION public.auto_hash_invitation_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If token is provided and token_hash is not, hash it
  IF NEW.token IS NOT NULL AND NEW.token != '' AND NEW.token_hash IS NULL THEN
    NEW.token_hash := public.hash_invitation_token(NEW.token);
    -- Optionally clear the plain text token immediately
    -- NEW.token := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_hash_invitation_token ON public.client_invitations;

-- Create trigger
CREATE TRIGGER trigger_auto_hash_invitation_token
BEFORE INSERT OR UPDATE ON public.client_invitations
FOR EACH ROW
EXECUTE FUNCTION public.auto_hash_invitation_token();

-- Migrate existing plain-text tokens to hashed versions
UPDATE public.client_invitations
SET token_hash = public.hash_invitation_token(token)
WHERE token IS NOT NULL AND token_hash IS NULL;

-- Add comment explaining the security improvement
COMMENT ON COLUMN public.client_invitations.token_hash IS 'Bcrypt hash of invitation token for secure storage. Plain text tokens should be cleared after hashing.';
COMMENT ON FUNCTION public.validate_invitation_token_secure IS 'Securely validates invitation tokens using hash comparison with rate limiting to prevent brute force attacks.';
COMMENT ON FUNCTION public.check_token_rate_limit IS 'Prevents brute force attacks by limiting failed token validation attempts to 5 per hour per token.';
COMMENT ON TABLE public.token_validation_attempts IS 'Tracks token validation attempts for rate limiting and security auditing.';