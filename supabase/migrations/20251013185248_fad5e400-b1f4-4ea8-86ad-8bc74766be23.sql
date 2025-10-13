-- Add lawyer_id column to cases table to properly link lawyers
-- This will allow proper foreign key relationship between cases and lawyers

-- First check if column already exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cases' 
        AND column_name = 'lawyer_id'
    ) THEN
        ALTER TABLE public.cases 
        ADD COLUMN lawyer_id UUID REFERENCES public.lawyers(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN public.cases.lawyer_id IS 'Abogado asignado al caso';
    END IF;
END $$;

-- Update RLS policies to allow lawyer_id
DROP POLICY IF EXISTS "Users can create cases in their tenant" ON public.cases;
CREATE POLICY "Users can create cases in their tenant" 
ON public.cases 
FOR INSERT 
WITH CHECK (
  (tenant_id = get_user_tenant_id(auth.uid())) 
  AND (auth.uid() = user_id) 
  AND ((client_id IS NULL) OR user_owns_client(auth.uid(), client_id))
  AND ((lawyer_id IS NULL) OR EXISTS (
    SELECT 1 FROM public.lawyers 
    WHERE id = cases.lawyer_id 
    AND user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can update cases in their tenant" ON public.cases;
CREATE POLICY "Users can update cases in their tenant" 
ON public.cases 
FOR UPDATE 
USING (
  (tenant_id = get_user_tenant_id(auth.uid())) 
  AND (user_id = auth.uid())
)
WITH CHECK (
  (tenant_id = get_user_tenant_id(auth.uid())) 
  AND (auth.uid() = user_id) 
  AND ((client_id IS NULL) OR user_owns_client(auth.uid(), client_id))
  AND ((lawyer_id IS NULL) OR EXISTS (
    SELECT 1 FROM public.lawyers 
    WHERE id = cases.lawyer_id 
    AND user_id = auth.uid()
  ))
);