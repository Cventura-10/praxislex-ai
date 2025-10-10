-- Permitir que usuarios autenticados creen su propio perfil de cliente
-- Esto es adicional a la política existente que permite a abogados crear clientes

CREATE POLICY "Users can create their own client profile"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() = auth_user_id
);

-- Permitir que usuarios actualicen su propio perfil de cliente vinculado
DROP POLICY IF EXISTS "Clients: update owner only" ON public.clients;

CREATE POLICY "Clients: update owner or linked user"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR (auth.uid() = auth_user_id AND auth_user_id IS NOT NULL)
)
WITH CHECK (
  auth.uid() = user_id 
  OR (auth.uid() = auth_user_id AND auth_user_id IS NOT NULL)
);