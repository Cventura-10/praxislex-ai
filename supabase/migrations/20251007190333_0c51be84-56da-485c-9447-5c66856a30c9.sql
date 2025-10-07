-- Add read-only token validation function for pre-flight checks
CREATE OR REPLACE FUNCTION public.check_invitation_token_validity(p_token text)
RETURNS TABLE(
  client_id uuid,
  client_email text,
  is_valid boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_client record;
BEGIN
  -- Find the invitation
  SELECT * INTO v_invitation
  FROM public.client_invitations
  WHERE token = p_token;

  -- Check if invitation exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'Invalid invitation token'::text;
    RETURN;
  END IF;

  -- Check if already used
  IF v_invitation.used_at IS NOT NULL THEN
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Invitation already used'::text;
    RETURN;
  END IF;

  -- Check if expired
  IF v_invitation.expires_at < now() THEN
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Invitation expired'::text;
    RETURN;
  END IF;

  -- Get client info
  SELECT * INTO v_client
  FROM public.clients
  WHERE id = v_invitation.client_id;

  -- Check if client already linked to auth user
  IF v_client.auth_user_id IS NOT NULL THEN
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Client already linked to an account'::text;
    RETURN;
  END IF;

  -- Return success (read-only, doesn't modify anything)
  RETURN QUERY SELECT v_invitation.client_id, v_client.email, true, 'Valid'::text;
END;
$$;

COMMENT ON FUNCTION public.check_invitation_token_validity(text) IS 
'Security function: Read-only validation of invitation token without consuming it';