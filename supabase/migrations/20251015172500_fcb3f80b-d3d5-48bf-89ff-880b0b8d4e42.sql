-- Add missing SELECT policies for alguaciles and lawyers tables
-- This fixes critical security issue: users can INSERT/UPDATE/DELETE but cannot SELECT their own data

-- Add SELECT policy for alguaciles table
CREATE POLICY "Users can view alguaciles in their tenant"
  ON public.alguaciles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid() 
    AND (tenant_id IS NULL OR user_belongs_to_tenant(auth.uid(), tenant_id))
  );

-- Add SELECT policy for lawyers table  
CREATE POLICY "Users can view lawyers in their tenant"
  ON public.lawyers FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND (tenant_id IS NULL OR user_belongs_to_tenant(auth.uid(), tenant_id))
  );