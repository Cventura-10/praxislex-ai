-- Phase 2: Enhanced Client Invitation Token Security
-- Create dedicated client_invitations table with expiration and single-use enforcement

CREATE TABLE public.client_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamp with time zone,
  used_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- Only owners can create invitations for their clients
CREATE POLICY "Owners can create client invitations"
ON public.client_invitations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id AND c.user_id = auth.uid()
  )
);

-- Only owners can view their client invitations
CREATE POLICY "Owners can view their client invitations"
ON public.client_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id AND c.user_id = auth.uid()
  )
);

-- Create secure function to validate and consume invitation tokens
CREATE OR REPLACE FUNCTION public.validate_invitation_token(p_token text)
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

  -- Mark as used
  UPDATE public.client_invitations
  SET used_at = now(),
      used_by = auth.uid()
  WHERE id = v_invitation.id;

  -- Link client to auth user
  UPDATE public.clients
  SET auth_user_id = auth.uid(),
      accepted_terms = false
  WHERE id = v_invitation.client_id;

  -- Return success
  RETURN QUERY SELECT v_invitation.client_id, v_client.email, true, 'Success'::text;
END;
$$;

-- Add index for performance
CREATE INDEX idx_client_invitations_token ON public.client_invitations(token);
CREATE INDEX idx_client_invitations_expires_at ON public.client_invitations(expires_at);

-- Add audit logging
COMMENT ON TABLE public.client_invitations IS 
'Secure client invitation system with expiration and single-use enforcement. Replaces insecure invitation_token column on clients table.';

COMMENT ON FUNCTION public.validate_invitation_token(text) IS 
'SECURITY CRITICAL: Validates invitation token, enforces expiration and single-use, links client to auth user. All validation is server-side.';