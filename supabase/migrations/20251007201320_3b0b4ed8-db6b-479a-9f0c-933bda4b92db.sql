-- SECURITY FIX: Replace insecure firm_accounting_summary view with secure function

-- Step 1: Drop the existing insecure view
DROP VIEW IF EXISTS public.firm_accounting_summary CASCADE;

-- Step 2: Create secure function to get firm accounting summary
CREATE OR REPLACE FUNCTION public.get_firm_accounting_summary(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  user_id uuid,
  total_ingresos_facturas numeric,
  total_ingresos_pagos numeric,
  total_gastos numeric,
  total_itbis_ingresos numeric,
  total_itbis_gastos numeric,
  total_intereses_cobrados numeric,
  total_intereses_creditos numeric,
  balance_neto numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security: Only allow users to view their own accounting summary
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only view own accounting data';
  END IF;

  -- Audit log: Track access to sensitive financial data
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (auth.uid(), p_user_id, 'firm_accounting_summary', 'view_summary')
  ON CONFLICT DO NOTHING;

  -- Return aggregated financial data for the authenticated user
  RETURN QUERY
  SELECT 
    p_user_id as user_id,
    -- Total income from paid invoices
    COALESCE(SUM(CASE WHEN i.estado = 'pagado' THEN i.monto ELSE 0 END), 0) as total_ingresos_facturas,
    -- Total income from payments
    COALESCE(SUM(p.monto), 0) as total_ingresos_pagos,
    -- Total expenses
    COALESCE(SUM(e.monto), 0) as total_gastos,
    -- Total ITBIS from invoices
    COALESCE(SUM(i.itbis), 0) as total_itbis_ingresos,
    -- Total ITBIS from expenses
    COALESCE(SUM(e.itbis), 0) as total_itbis_gastos,
    -- Total interest charged
    COALESCE(SUM(i.interes), 0) as total_intereses_cobrados,
    -- Total interest on credits
    COALESCE(SUM(cc.interes), 0) as total_intereses_creditos,
    -- Net balance
    (COALESCE(SUM(CASE WHEN i.estado = 'pagado' THEN i.monto ELSE 0 END), 0) + 
     COALESCE(SUM(p.monto), 0) - 
     COALESCE(SUM(e.monto), 0)) as balance_neto
  FROM public.invoices i
  FULL OUTER JOIN public.payments p ON p.user_id = p_user_id
  FULL OUTER JOIN public.expenses e ON e.user_id = p_user_id
  FULL OUTER JOIN public.client_credits cc ON cc.user_id = p_user_id
  WHERE i.user_id = p_user_id
     OR p.user_id = p_user_id
     OR e.user_id = p_user_id
     OR cc.user_id = p_user_id
  GROUP BY p_user_id;
END;
$$;

-- Step 3: Add helpful comments
COMMENT ON FUNCTION public.get_firm_accounting_summary(uuid) IS 
'Secure function to retrieve firm accounting summary. Only returns data for the authenticated user with full audit logging.';

-- Step 4: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_firm_accounting_summary(uuid) TO authenticated;

-- Step 5: Revoke any public access
REVOKE EXECUTE ON FUNCTION public.get_firm_accounting_summary(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_firm_accounting_summary(uuid) FROM public;