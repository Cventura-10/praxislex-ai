-- Harden RLS: remove public SELECT and require authentication for metadata tables
-- 1) act_fields: drop public SELECT policy and restrict to authenticated users
DROP POLICY IF EXISTS "act_fields_select_all" ON public.act_fields;
CREATE POLICY "act_fields_select_authenticated"
  ON public.act_fields
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 2) act_types: drop public SELECT policy and restrict to authenticated users
DROP POLICY IF EXISTS "act_types_select_all" ON public.act_types;
CREATE POLICY "act_types_select_authenticated"
  ON public.act_types
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 3) case_stages: previously public SELECT; restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view case stages" ON public.case_stages;
CREATE POLICY "Authenticated users can view case stages"
  ON public.case_stages
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
