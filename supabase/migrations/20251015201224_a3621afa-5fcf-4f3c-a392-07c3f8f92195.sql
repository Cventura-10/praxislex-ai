-- 0) FIX: functions causing INSERT in STABLE functions (make them VOLATILE)
-- user_belongs_to_tenant writes to audit table, cannot be STABLE
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(p_user_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result boolean;
BEGIN
  -- Only allow checking current user's membership
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Security violation: Cannot check tenant membership for other users';
  END IF;

  IF p_user_id IS NULL OR p_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Best-effort audit (do not abort on error)
  BEGIN
    INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
    VALUES (auth.uid(), p_tenant_id, 'tenant_users', 'check_membership')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE user_id = p_user_id AND tenant_id = p_tenant_id
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

-- get_user_tenant_ids also writes to audit, cannot be STABLE
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Security violation: Cannot retrieve tenant IDs for other users';
  END IF;
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Best-effort audit
  BEGIN
    INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
    VALUES (auth.uid(), p_user_id, 'tenant_users', 'list_tenants')
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN QUERY
  SELECT tenant_id
  FROM public.tenant_users
  WHERE user_id = p_user_id;
END;
$function$;

-- 1) Ensure unique index required by ON CONFLICT in search rate limit logic
DO $$
BEGIN
  IF to_regclass('public.search_rate_limit') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'search_rate_limit_user_window_idx' AND n.nspname = 'public'
    ) THEN
      CREATE UNIQUE INDEX search_rate_limit_user_window_idx ON public.search_rate_limit (user_id, window_start);
    END IF;
  END IF;
END$$;

-- 2) RLS policies + triggers for professionals: notarios, peritos, tasadores
-- Pattern matches existing policies for lawyers/alguaciles
DO $$
BEGIN
  -- NOTARIOS
  IF to_regclass('public.notarios') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.notarios ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notarios' AND policyname='Users can view notarios in their tenant') THEN
      CREATE POLICY "Users can view notarios in their tenant" ON public.notarios
      FOR SELECT
      USING ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notarios' AND policyname='Users can create notarios in their tenant') THEN
      CREATE POLICY "Users can create notarios in their tenant" ON public.notarios
      FOR INSERT
      WITH CHECK ((auth.uid() = user_id) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notarios' AND policyname='Users can update notarios in their tenant') THEN
      CREATE POLICY "Users can update notarios in their tenant" ON public.notarios
      FOR UPDATE
      USING ((user_id = auth.uid()) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notarios' AND policyname='Users can delete notarios in their tenant') THEN
      CREATE POLICY "Users can delete notarios in their tenant" ON public.notarios
      FOR DELETE
      USING ((user_id = auth.uid()) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_tenant_notarios') THEN
      CREATE TRIGGER set_tenant_notarios
      BEFORE INSERT ON public.notarios
      FOR EACH ROW EXECUTE FUNCTION public.auto_assign_tenant();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_notarios_updated_at') THEN
      CREATE TRIGGER update_notarios_updated_at
      BEFORE UPDATE ON public.notarios
      FOR EACH ROW EXECUTE FUNCTION public.update_professional_timestamp();
    END IF;
  END IF;

  -- PERITOS
  IF to_regclass('public.peritos') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.peritos ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='peritos' AND policyname='Users can view peritos in their tenant') THEN
      CREATE POLICY "Users can view peritos in their tenant" ON public.peritos
      FOR SELECT
      USING ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='peritos' AND policyname='Users can create peritos in their tenant') THEN
      CREATE POLICY "Users can create peritos in their tenant" ON public.peritos
      FOR INSERT
      WITH CHECK ((auth.uid() = user_id) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='peritos' AND policyname='Users can update peritos in their tenant') THEN
      CREATE POLICY "Users can update peritos in their tenant" ON public.peritos
      FOR UPDATE
      USING ((user_id = auth.uid()) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='peritos' AND policyname='Users can delete peritos in their tenant') THEN
      CREATE POLICY "Users can delete peritos in their tenant" ON public.peritos
      FOR DELETE
      USING ((user_id = auth.uid()) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_tenant_peritos') THEN
      CREATE TRIGGER set_tenant_peritos
      BEFORE INSERT ON public.peritos
      FOR EACH ROW EXECUTE FUNCTION public.auto_assign_tenant();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_peritos_updated_at') THEN
      CREATE TRIGGER update_peritos_updated_at
      BEFORE UPDATE ON public.peritos
      FOR EACH ROW EXECUTE FUNCTION public.update_professional_timestamp();
    END IF;
  END IF;

  -- TASADORES
  IF to_regclass('public.tasadores') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tasadores ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasadores' AND policyname='Users can view tasadores in their tenant') THEN
      CREATE POLICY "Users can view tasadores in their tenant" ON public.tasadores
      FOR SELECT
      USING ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasadores' AND policyname='Users can create tasadores in their tenant') THEN
      CREATE POLICY "Users can create tasadores in their tenant" ON public.tasadores
      FOR INSERT
      WITH CHECK ((auth.uid() = user_id) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasadores' AND policyname='Users can update tasadores in their tenant') THEN
      CREATE POLICY "Users can update tasadores in their tenant" ON public.tasadores
      FOR UPDATE
      USING ((user_id = auth.uid()) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasadores' AND policyname='Users can delete tasadores in their tenant') THEN
      CREATE POLICY "Users can delete tasadores in their tenant" ON public.tasadores
      FOR DELETE
      USING ((user_id = auth.uid()) AND ((tenant_id IS NULL) OR user_belongs_to_tenant(auth.uid(), tenant_id)));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_tenant_tasadores') THEN
      CREATE TRIGGER set_tenant_tasadores
      BEFORE INSERT ON public.tasadores
      FOR EACH ROW EXECUTE FUNCTION public.auto_assign_tenant();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_tasadores_updated_at') THEN
      CREATE TRIGGER update_tasadores_updated_at
      BEFORE UPDATE ON public.tasadores
      FOR EACH ROW EXECUTE FUNCTION public.update_professional_timestamp();
    END IF;
  END IF;
END$$;