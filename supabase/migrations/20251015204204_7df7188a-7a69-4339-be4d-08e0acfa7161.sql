-- Habilitar RLS en notarial_acts si no está habilitado
ALTER TABLE public.notarial_acts ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver sus propios actos notariales
DROP POLICY IF EXISTS "Users can view their own notarial acts" ON public.notarial_acts;
CREATE POLICY "Users can view their own notarial acts"
ON public.notarial_acts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política para que los usuarios puedan crear sus propios actos notariales
DROP POLICY IF EXISTS "Users can create their own notarial acts" ON public.notarial_acts;
CREATE POLICY "Users can create their own notarial acts"
ON public.notarial_acts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND (case_id IS NULL OR user_owns_case(auth.uid(), case_id))
  AND (client_id IS NULL OR user_owns_client(auth.uid(), client_id))
);

-- Política para que los usuarios puedan actualizar sus propios actos notariales
DROP POLICY IF EXISTS "Users can update their own notarial acts" ON public.notarial_acts;
CREATE POLICY "Users can update their own notarial acts"
ON public.notarial_acts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios actos notariales
DROP POLICY IF EXISTS "Users can delete their own notarial acts" ON public.notarial_acts;
CREATE POLICY "Users can delete their own notarial acts"
ON public.notarial_acts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);