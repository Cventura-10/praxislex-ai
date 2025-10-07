-- FIX: Correct the SQL query logic in get_firm_accounting_summary function
-- The previous version had incorrect JOIN logic

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
DECLARE
  v_ingresos_facturas numeric;
  v_ingresos_pagos numeric;
  v_gastos numeric;
  v_itbis_ingresos numeric;
  v_itbis_gastos numeric;
  v_intereses_cobrados numeric;
  v_intereses_creditos numeric;
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

  -- Calculate total income from paid invoices
  SELECT COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END), 0)
  INTO v_ingresos_facturas
  FROM public.invoices
  WHERE user_id = p_user_id;

  -- Calculate total income from payments
  SELECT COALESCE(SUM(monto), 0)
  INTO v_ingresos_pagos
  FROM public.payments
  WHERE user_id = p_user_id;

  -- Calculate total expenses
  SELECT COALESCE(SUM(monto), 0)
  INTO v_gastos
  FROM public.expenses
  WHERE user_id = p_user_id;

  -- Calculate total ITBIS from invoices
  SELECT COALESCE(SUM(itbis), 0)
  INTO v_itbis_ingresos
  FROM public.invoices
  WHERE user_id = p_user_id;

  -- Calculate total ITBIS from expenses
  SELECT COALESCE(SUM(itbis), 0)
  INTO v_itbis_gastos
  FROM public.expenses
  WHERE user_id = p_user_id;

  -- Calculate total interest charged on invoices
  SELECT COALESCE(SUM(interes), 0)
  INTO v_intereses_cobrados
  FROM public.invoices
  WHERE user_id = p_user_id;

  -- Calculate total interest from credits
  SELECT COALESCE(SUM(interes), 0)
  INTO v_intereses_creditos
  FROM public.client_credits
  WHERE user_id = p_user_id;

  -- Return the aggregated results
  RETURN QUERY
  SELECT 
    p_user_id,
    v_ingresos_facturas,
    v_ingresos_pagos,
    v_gastos,
    v_itbis_ingresos,
    v_itbis_gastos,
    v_intereses_cobrados,
    v_intereses_creditos,
    (v_ingresos_facturas + v_ingresos_pagos - v_gastos) as balance_neto;
END;
$$;

COMMENT ON FUNCTION public.get_firm_accounting_summary(uuid) IS 
'Secure function to retrieve firm accounting summary. Returns aggregated financial data only for the authenticated user with full audit logging. All access is logged to data_access_audit table.';