-- ============================================================================
-- MULTI-TENANCY IMPLEMENTATION FOR PRAXISLEX
-- ============================================================================
-- This migration adds multi-tenant support with tenant isolation via RLS
-- ============================================================================

-- Step 1: Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  max_users integer NOT NULL DEFAULT 1,
  max_documents_per_month integer NOT NULL DEFAULT 20,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

-- Step 2: Create tenant_users junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Step 3: Add tenant_id to all core tables
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.deadlines ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.client_credits ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.jurisprudence_embeddings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.legal_model_templates ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Step 4: Create indexes for tenant_id lookups (critical for performance)
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cases_tenant ON public.cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hearings_tenant ON public.hearings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_tenant ON public.deadlines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_tenant ON public.legal_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON public.expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_lookup ON public.tenant_users(user_id, tenant_id);

-- Step 5: Create function to get user's current tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id 
  FROM public.tenant_users
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

-- Step 6: Create function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION public.user_in_tenant(p_user_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
  );
$$;

-- Step 7: Enable RLS on tenant tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for tenants table
CREATE POLICY "Users can view their own tenants"
  ON public.tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant owners can update their tenant"
  ON public.tenants FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Step 9: Create RLS policies for tenant_users table
CREATE POLICY "Users can view tenant memberships"
  ON public.tenant_users FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage users"
  ON public.tenant_users FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Step 10: Update existing RLS policies to include tenant isolation
-- Clients
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios clientes" ON public.clients;
CREATE POLICY "Users can view clients in their tenant"
  ON public.clients FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (user_id = auth.uid() OR auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Los usuarios pueden crear sus propios clientes" ON public.clients;
CREATE POLICY "Users can create clients in their tenant"
  ON public.clients FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios clientes" ON public.clients;
DROP POLICY IF EXISTS "Clients: update owner or linked user" ON public.clients;
CREATE POLICY "Users can update clients in their tenant"
  ON public.clients FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (user_id = auth.uid() OR auth_user_id = auth.uid())
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (user_id = auth.uid() OR auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propios clientes" ON public.clients;
CREATE POLICY "Users can delete clients in their tenant"
  ON public.clients FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND user_id = auth.uid()
  );

-- Cases
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios casos" ON public.cases;
CREATE POLICY "Users can view cases in their tenant"
  ON public.cases FOR SELECT
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Los usuarios pueden crear sus propios casos" ON public.cases;
CREATE POLICY "Users can create cases in their tenant"
  ON public.cases FOR INSERT
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND auth.uid() = user_id
    AND (client_id IS NULL OR user_owns_client(auth.uid(), client_id))
  );

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios casos" ON public.cases;
CREATE POLICY "Users can update cases in their tenant"
  ON public.cases FOR UPDATE
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND auth.uid() = user_id
    AND (client_id IS NULL OR user_owns_client(auth.uid(), client_id))
  );

DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propios casos" ON public.cases;
CREATE POLICY "Users can delete cases in their tenant"
  ON public.cases FOR DELETE
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND user_id = auth.uid()
  );

-- Step 11: Create trigger to auto-assign tenant to new records
CREATE OR REPLACE FUNCTION public.auto_assign_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_user_tenant_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Apply auto-assign trigger to core tables
DROP TRIGGER IF EXISTS auto_assign_tenant_clients ON public.clients;
CREATE TRIGGER auto_assign_tenant_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_tenant();

DROP TRIGGER IF EXISTS auto_assign_tenant_cases ON public.cases;
CREATE TRIGGER auto_assign_tenant_cases
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_tenant();

DROP TRIGGER IF EXISTS auto_assign_tenant_hearings ON public.hearings;
CREATE TRIGGER auto_assign_tenant_hearings
  BEFORE INSERT ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_tenant();

DROP TRIGGER IF EXISTS auto_assign_tenant_legal_documents ON public.legal_documents;
CREATE TRIGGER auto_assign_tenant_legal_documents
  BEFORE INSERT ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_tenant();

-- Step 12: Create function to initialize tenant for new users
CREATE OR REPLACE FUNCTION public.initialize_user_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_tenant_name text;
BEGIN
  -- Create a personal tenant for the new user
  v_tenant_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  ) || '''s Firm';
  
  INSERT INTO public.tenants (name, slug, plan, max_users)
  VALUES (
    v_tenant_name,
    lower(regexp_replace(v_tenant_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(NEW.id::text from 1 for 8),
    'free',
    1
  )
  RETURNING id INTO v_tenant_id;
  
  -- Assign user to tenant as owner
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  VALUES (v_tenant_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Trigger to create tenant for new users
DROP TRIGGER IF EXISTS on_auth_user_created_tenant ON auth.users;
CREATE TRIGGER on_auth_user_created_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_tenant();

-- Step 13: Migrate existing data to a default tenant
DO $$
DECLARE
  v_default_tenant_id uuid;
BEGIN
  -- Check if we need to migrate existing data
  IF EXISTS (SELECT 1 FROM public.clients WHERE tenant_id IS NULL LIMIT 1) THEN
    -- Create default tenant for existing data
    INSERT INTO public.tenants (name, slug, plan, max_users, max_documents_per_month)
    VALUES ('PraxisLex Default Firm', 'praxislex-default', 'pro', 999, 999)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO v_default_tenant_id;
    
    -- Get the default tenant ID if it already exists
    IF v_default_tenant_id IS NULL THEN
      SELECT id INTO v_default_tenant_id 
      FROM public.tenants 
      WHERE slug = 'praxislex-default';
    END IF;
    
    -- Assign all existing users to default tenant
    INSERT INTO public.tenant_users (tenant_id, user_id, role)
    SELECT v_default_tenant_id, id, 'owner'
    FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.tenant_users 
      WHERE tenant_users.user_id = auth.users.id
    );
    
    -- Update all existing records with NULL tenant_id
    UPDATE public.clients SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.cases SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.hearings SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.deadlines SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.legal_documents SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.invoices SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.payments SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.expenses SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.client_credits SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.jurisprudence_embeddings SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.legal_model_templates SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
END $$;

-- Step 14: Make tenant_id NOT NULL after migration
ALTER TABLE public.clients ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.cases ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.hearings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.legal_documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN tenant_id SET NOT NULL;

-- Step 15: Create view for user's current tenant
CREATE OR REPLACE VIEW public.current_user_tenant AS
SELECT t.*
FROM public.tenants t
INNER JOIN public.tenant_users tu ON tu.tenant_id = t.id
WHERE tu.user_id = auth.uid()
LIMIT 1;

COMMENT ON TABLE public.tenants IS 'Multi-tenant organizations (law firms)';
COMMENT ON TABLE public.tenant_users IS 'User-tenant relationships with roles';
COMMENT ON FUNCTION public.get_user_tenant_id IS 'Returns the tenant_id for the current user';
COMMENT ON FUNCTION public.user_in_tenant IS 'Checks if user belongs to tenant';