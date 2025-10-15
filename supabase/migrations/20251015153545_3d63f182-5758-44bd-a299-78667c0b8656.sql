-- Corregir recursión infinita en RLS de tenant_users
-- El problema es que get_user_tenant_id() consulta tenant_users, 
-- creando recursión cuando tenant_users tiene políticas que usan get_user_tenant_id()

-- Primero, eliminar las políticas problemáticas de tenant_users
DROP POLICY IF EXISTS "Users can view their tenant membership" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view tenant members" ON public.tenant_users;

-- Crear políticas sin recursión usando auth.uid() directamente
CREATE POLICY "Users can view their own tenant membership"
ON public.tenant_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view members in their tenant"  
ON public.tenant_users
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id 
    FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
  )
);

-- Asegurar que las tablas de profesionales tengan las políticas correctas
-- sin depender de funciones que causen recursión

-- Actualizar políticas de lawyers
DROP POLICY IF EXISTS "Users can view lawyers in their tenant" ON public.lawyers;
CREATE POLICY "Users can view lawyers in their tenant"
ON public.lawyers
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id 
    FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
  ) OR user_id = auth.uid()
);

-- Actualizar políticas de notarios  
DROP POLICY IF EXISTS "Users can view notarios in their tenant" ON public.notarios;
CREATE POLICY "Users can view notarios in their tenant"
ON public.notarios
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id 
    FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
  ) OR user_id = auth.uid()
);

-- Actualizar políticas de alguaciles
DROP POLICY IF EXISTS "Users can view alguaciles in their tenant" ON public.alguaciles;
CREATE POLICY "Users can view alguaciles in their tenant"
ON public.alguaciles
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id 
    FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
  ) OR user_id = auth.uid()
);

-- Actualizar políticas de peritos
DROP POLICY IF EXISTS "Users can view peritos in their tenant" ON public.peritos;
CREATE POLICY "Users can view peritos in their tenant"
ON public.peritos
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id 
    FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
  ) OR user_id = auth.uid()
);

-- Actualizar políticas de tasadores
DROP POLICY IF EXISTS "Users can view tasadores in their tenant" ON public.tasadores;
CREATE POLICY "Users can view tasadores in their tenant"
ON public.tasadores
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT t.tenant_id 
    FROM public.tenant_users t
    WHERE t.user_id = auth.uid()
  ) OR user_id = auth.uid()
);

-- Comentario sobre la solución
COMMENT ON POLICY "Users can view their own tenant membership" ON public.tenant_users IS 
'Permite a usuarios ver su propia membresía sin recursión usando auth.uid() directamente';

COMMENT ON POLICY "Users can view members in their tenant" ON public.tenant_users IS
'Permite ver miembros del tenant usando subquery directa en lugar de función que causa recursión';