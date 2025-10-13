-- 1. ARREGLAR CONSTRAINT: Solo puede haber UN cliente por auth_user_id
-- Eliminar constraint duplicado si existe
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_auth_user_id_key;

-- Agregar constraint UNIQUE en auth_user_id (cuando no es null)
CREATE UNIQUE INDEX IF NOT EXISTS clients_auth_user_id_unique_idx 
ON public.clients(auth_user_id) 
WHERE auth_user_id IS NOT NULL;

-- 2. LIMPIAR DATOS: Eliminar clientes duplicados por auth_user_id
-- Mantener solo el cliente más reciente por auth_user_id
WITH duplicates AS (
  SELECT id, auth_user_id,
         ROW_NUMBER() OVER (PARTITION BY auth_user_id ORDER BY created_at DESC) as rn
  FROM public.clients
  WHERE auth_user_id IS NOT NULL
)
DELETE FROM public.clients
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 3. MEJORAR RLS POLICY: Simplificar y optimizar
DROP POLICY IF EXISTS "Users can create their own client profile" ON public.clients;
DROP POLICY IF EXISTS "Clients: insert owner only" ON public.clients;

-- Policy correcta para INSERT de clientes
CREATE POLICY "Clients can create profile during signup"
ON public.clients
FOR INSERT
WITH CHECK (
  auth.uid() = auth_user_id 
  AND auth.uid() = user_id
);