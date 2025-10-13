-- Fix RLS policy for lawyers table to properly handle tenant_id
DROP POLICY IF EXISTS "Users can create lawyers in their tenant" ON public.lawyers;

CREATE POLICY "Users can create lawyers in their tenant" 
ON public.lawyers 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (tenant_id IS NULL OR tenant_id = get_user_tenant_id(auth.uid()))
);