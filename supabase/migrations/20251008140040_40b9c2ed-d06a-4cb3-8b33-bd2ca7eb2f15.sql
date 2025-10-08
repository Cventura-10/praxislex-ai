-- =====================================================
-- SECURITY FIX: Part 1 - Add missing RLS policies for client_invitations
-- =====================================================

-- Allow owners and admins to update invitations
CREATE POLICY "Owners and admins can update client invitations"
ON public.client_invitations
FOR UPDATE
USING (
  created_by = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  created_by = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow owners and admins to delete invitations
CREATE POLICY "Owners and admins can delete client invitations"
ON public.client_invitations
FOR DELETE
USING (
  created_by = auth.uid() 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

COMMENT ON TABLE public.client_invitations IS 
'Client invitation tokens with full RLS protection. Only creators and admins can modify or delete invitations.';