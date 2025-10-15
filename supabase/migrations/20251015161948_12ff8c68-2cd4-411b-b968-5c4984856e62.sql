-- =====================================================
-- CORRECCIÓN DE RECURSIÓN INFINITA EN POLÍTICAS RLS
-- Paso 1: Crear funciones SECURITY DEFINER
-- =====================================================

-- Función para verificar si un usuario pertenece a un tenant específico
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(p_user_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
  );
$$;

-- Función para obtener todos los tenant_ids de un usuario
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tenant_id
  FROM public.tenant_users
  WHERE user_id = p_user_id;
$$;

-- =====================================================
-- Paso 2: RECREAR POLÍTICAS RLS DE TENANT_USERS (sin recursión)
-- =====================================================

-- Eliminar políticas existentes de tenant_users
DROP POLICY IF EXISTS "Users can view their own tenant membership" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view members in their tenant" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can insert members" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can update members" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can delete members" ON public.tenant_users;

-- Política simple para ver tu propia membresía (sin recursión)
CREATE POLICY "Users can view their own tenant membership"
ON public.tenant_users
FOR SELECT
USING (user_id = auth.uid());

-- Política para ver otros miembros del mismo tenant (usando función SECURITY DEFINER)
CREATE POLICY "Users can view members in their tenant"
ON public.tenant_users
FOR SELECT
USING (
  tenant_id = ANY(ARRAY(SELECT public.get_user_tenant_ids(auth.uid())))
);

-- Políticas de modificación para owners/admins
CREATE POLICY "Tenant owners can insert members"
ON public.tenant_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = tenant_users.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Tenant owners can update members"
ON public.tenant_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = tenant_users.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Tenant owners can delete members"
ON public.tenant_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = tenant_users.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
  )
);

-- =====================================================
-- Paso 3: ACTUALIZAR POLÍTICAS DE LAWYERS
-- =====================================================

DROP POLICY IF EXISTS "Users can view lawyers in their tenant" ON public.lawyers;
DROP POLICY IF EXISTS "Users can create lawyers in their tenant" ON public.lawyers;
DROP POLICY IF EXISTS "Users can update lawyers in their tenant" ON public.lawyers;
DROP POLICY IF EXISTS "Users can delete lawyers in their tenant" ON public.lawyers;

CREATE POLICY "Users can view lawyers in their tenant"
ON public.lawyers
FOR SELECT
USING (
  user_id = auth.uid() 
  OR tenant_id = ANY(ARRAY(SELECT public.get_user_tenant_ids(auth.uid())))
);

CREATE POLICY "Users can create lawyers in their tenant"
ON public.lawyers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update lawyers in their tenant"
ON public.lawyers
FOR UPDATE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete lawyers in their tenant"
ON public.lawyers
FOR DELETE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- =====================================================
-- Paso 4: ACTUALIZAR POLÍTICAS DE NOTARIOS
-- =====================================================

DROP POLICY IF EXISTS "Users can view notarios in their tenant" ON public.notarios;
DROP POLICY IF EXISTS "Users can create notarios in their tenant" ON public.notarios;
DROP POLICY IF EXISTS "Users can update notarios in their tenant" ON public.notarios;
DROP POLICY IF EXISTS "Users can delete notarios in their tenant" ON public.notarios;

CREATE POLICY "Users can view notarios in their tenant"
ON public.notarios
FOR SELECT
USING (
  user_id = auth.uid()
  OR tenant_id = ANY(ARRAY(SELECT public.get_user_tenant_ids(auth.uid())))
);

CREATE POLICY "Users can create notarios in their tenant"
ON public.notarios
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update notarios in their tenant"
ON public.notarios
FOR UPDATE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete notarios in their tenant"
ON public.notarios
FOR DELETE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- =====================================================
-- Paso 5: ACTUALIZAR POLÍTICAS DE ALGUACILES
-- =====================================================

DROP POLICY IF EXISTS "Users can view alguaciles in their tenant" ON public.alguaciles;
DROP POLICY IF EXISTS "Users can create alguaciles in their tenant" ON public.alguaciles;
DROP POLICY IF EXISTS "Users can update alguaciles in their tenant" ON public.alguaciles;
DROP POLICY IF EXISTS "Users can delete alguaciles in their tenant" ON public.alguaciles;

CREATE POLICY "Users can view alguaciles in their tenant"
ON public.alguaciles
FOR SELECT
USING (
  user_id = auth.uid()
  OR tenant_id = ANY(ARRAY(SELECT public.get_user_tenant_ids(auth.uid())))
);

CREATE POLICY "Users can create alguaciles in their tenant"
ON public.alguaciles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update alguaciles in their tenant"
ON public.alguaciles
FOR UPDATE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete alguaciles in their tenant"
ON public.alguaciles
FOR DELETE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- =====================================================
-- Paso 6: ACTUALIZAR POLÍTICAS DE PERITOS
-- =====================================================

DROP POLICY IF EXISTS "Users can view peritos in their tenant" ON public.peritos;
DROP POLICY IF EXISTS "Users can create peritos in their tenant" ON public.peritos;
DROP POLICY IF EXISTS "Users can update peritos in their tenant" ON public.peritos;
DROP POLICY IF EXISTS "Users can delete peritos in their tenant" ON public.peritos;

CREATE POLICY "Users can view peritos in their tenant"
ON public.peritos
FOR SELECT
USING (
  user_id = auth.uid()
  OR tenant_id = ANY(ARRAY(SELECT public.get_user_tenant_ids(auth.uid())))
);

CREATE POLICY "Users can create peritos in their tenant"
ON public.peritos
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update peritos in their tenant"
ON public.peritos
FOR UPDATE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete peritos in their tenant"
ON public.peritos
FOR DELETE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- =====================================================
-- Paso 7: ACTUALIZAR POLÍTICAS DE TASADORES
-- =====================================================

DROP POLICY IF EXISTS "Users can view tasadores in their tenant" ON public.tasadores;
DROP POLICY IF EXISTS "Users can create tasadores in their tenant" ON public.tasadores;
DROP POLICY IF EXISTS "Users can update tasadores in their tenant" ON public.tasadores;
DROP POLICY IF EXISTS "Users can delete tasadores in their tenant" ON public.tasadores;

CREATE POLICY "Users can view tasadores in their tenant"
ON public.tasadores
FOR SELECT
USING (
  user_id = auth.uid()
  OR tenant_id = ANY(ARRAY(SELECT public.get_user_tenant_ids(auth.uid())))
);

CREATE POLICY "Users can create tasadores in their tenant"
ON public.tasadores
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update tasadores in their tenant"
ON public.tasadores
FOR UPDATE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete tasadores in their tenant"
ON public.tasadores
FOR DELETE
USING (
  user_id = auth.uid()
  AND (tenant_id IS NULL OR public.user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- =====================================================
-- COMENTARIO FINAL
-- =====================================================
-- Esta migración elimina la recursión infinita al:
-- 1. Crear funciones SECURITY DEFINER que acceden a tenant_users
-- 2. Usar esas funciones en las políticas RLS en lugar de subqueries
-- 3. Las funciones SECURITY DEFINER se ejecutan con privilegios elevados
--    y no activan las políticas RLS, rompiendo la recursión