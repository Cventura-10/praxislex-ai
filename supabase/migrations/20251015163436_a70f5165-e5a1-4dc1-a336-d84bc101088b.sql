-- =====================================================
-- SECURITY FIX: Add strict input validation to tenant functions
-- Prevents privilege escalation via SECURITY DEFINER bypass
-- =====================================================

-- Drop and recreate user_belongs_to_tenant with validation (CASCADE)
DROP FUNCTION IF EXISTS public.user_belongs_to_tenant(uuid, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(p_user_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- CRITICAL SECURITY: Only allow checking current user's tenant membership
  -- Prevents privilege escalation attacks
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Security violation: Cannot check tenant membership for other users';
  END IF;
  
  -- Validate inputs
  IF p_user_id IS NULL OR p_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Audit this security-sensitive check
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (auth.uid(), p_tenant_id, 'tenant_users', 'check_membership')
  ON CONFLICT DO NOTHING;
  
  -- Perform the actual check
  RETURN EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
  );
END;
$$;

-- Drop and recreate get_user_tenant_ids with validation (CASCADE)
DROP FUNCTION IF EXISTS public.get_user_tenant_ids(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- CRITICAL SECURITY: Only allow getting current user's tenant IDs
  -- Prevents privilege escalation attacks
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Security violation: Cannot retrieve tenant IDs for other users';
  END IF;
  
  -- Validate input
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Audit this security-sensitive operation
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (auth.uid(), p_user_id, 'tenant_users', 'list_tenants')
  ON CONFLICT DO NOTHING;
  
  -- Return tenant IDs
  RETURN QUERY
  SELECT tenant_id
  FROM public.tenant_users
  WHERE user_id = p_user_id;
END;
$$;

-- Add validation to reveal_client_pii function
DROP FUNCTION IF EXISTS public.reveal_client_pii(uuid);

CREATE OR REPLACE FUNCTION public.reveal_client_pii(p_client_id uuid)
RETURNS TABLE(
  client_id uuid,
  nombre_completo text,
  cedula_rnc text,
  email text,
  telefono text,
  direccion text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Validate authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Validate input
  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'Invalid client_id: cannot be null';
  END IF;

  -- Check rate limit before proceeding
  IF NOT public.check_and_log_pii_access(v_user_id, p_client_id) THEN
    RAISE EXCEPTION 'Rate limit exceeded for PII access';
  END IF;

  -- Verify user owns this client
  IF NOT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = p_client_id
      AND c.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: client not owned by user';
  END IF;

  -- Log PII access
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action, ip_address)
  VALUES (
    v_user_id, 
    p_client_id, 
    'clients', 
    'reveal_pii',
    inet_client_addr()
  );

  -- Return decrypted data
  RETURN QUERY
  SELECT 
    c.id AS client_id,
    c.nombre_completo,
    COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), '') AS cedula_rnc,
    COALESCE(c.email, '') AS email,
    COALESCE(c.telefono, '') AS telefono,
    COALESCE(c.direccion, '') AS direccion
  FROM public.clients c
  WHERE c.id = p_client_id
    AND c.user_id = v_user_id;
END;
$$;

-- Recreate all dropped policies that depended on these functions

-- Lawyers policies
CREATE POLICY "Users can create lawyers in their tenant"
ON public.lawyers FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update lawyers in their tenant"
ON public.lawyers FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete lawyers in their tenant"
ON public.lawyers FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- Notarios policies
CREATE POLICY "Users can create notarios in their tenant"
ON public.notarios FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update notarios in their tenant"
ON public.notarios FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete notarios in their tenant"
ON public.notarios FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- Alguaciles policies
CREATE POLICY "Users can create alguaciles in their tenant"
ON public.alguaciles FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update alguaciles in their tenant"
ON public.alguaciles FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete alguaciles in their tenant"
ON public.alguaciles FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- Peritos policies
CREATE POLICY "Users can create peritos in their tenant"
ON public.peritos FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update peritos in their tenant"
ON public.peritos FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete peritos in their tenant"
ON public.peritos FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- Tasadores policies
CREATE POLICY "Users can create tasadores in their tenant"
ON public.tasadores FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can update tasadores in their tenant"
ON public.tasadores FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

CREATE POLICY "Users can delete tasadores in their tenant"
ON public.tasadores FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid()) AND 
  ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id))
);

-- Add comments documenting security measures
COMMENT ON FUNCTION public.user_belongs_to_tenant IS 
'Security-hardened function to check tenant membership. Only allows checking current user (auth.uid()). Includes audit logging.';

COMMENT ON FUNCTION public.get_user_tenant_ids IS 
'Security-hardened function to get tenant IDs. Only allows retrieving for current user (auth.uid()). Includes audit logging.';

COMMENT ON FUNCTION public.reveal_client_pii IS 
'Security-hardened PII access function with strict validation, rate limiting, ownership verification, and audit logging.';