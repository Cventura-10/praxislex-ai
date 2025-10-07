-- Drop the dangerous INSERT policy that allows users to manipulate audit logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.data_access_audit;

-- Audit logs should only be written by SECURITY DEFINER functions and triggers
-- Users should only be able to read their own logs (existing SELECT policies remain)