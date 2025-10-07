-- Add ITBIS and interest fields to existing tables

-- Add optional ITBIS field to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS itbis numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal numeric GENERATED ALWAYS AS (monto - COALESCE(itbis, 0)) STORED;

-- Add optional ITBIS and interest fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS itbis numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS interes numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal numeric GENERATED ALWAYS AS (monto - COALESCE(itbis, 0) - COALESCE(interes, 0)) STORED;

-- Add optional interest field to client_credits table
ALTER TABLE public.client_credits
ADD COLUMN IF NOT EXISTS interes numeric DEFAULT 0;

-- Add optional interest field to payments table  
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS aplicado_interes numeric DEFAULT 0;

-- Create a view for consolidated firm accounting
CREATE OR REPLACE VIEW public.firm_accounting_summary AS
SELECT 
  u.id as user_id,
  -- Total ingresos (facturas pagadas + pagos recibidos)
  COALESCE(SUM(CASE WHEN i.estado = 'pagado' THEN i.monto ELSE 0 END), 0) as total_ingresos_facturas,
  COALESCE(SUM(p.monto), 0) as total_ingresos_pagos,
  -- Total gastos
  COALESCE(SUM(e.monto), 0) as total_gastos,
  -- ITBIS totales
  COALESCE(SUM(i.itbis), 0) as total_itbis_ingresos,
  COALESCE(SUM(e.itbis), 0) as total_itbis_gastos,
  -- Intereses totales
  COALESCE(SUM(i.interes), 0) as total_intereses_cobrados,
  COALESCE(SUM(cc.interes), 0) as total_intereses_creditos,
  -- Balance neto
  (COALESCE(SUM(CASE WHEN i.estado = 'pagado' THEN i.monto ELSE 0 END), 0) + 
   COALESCE(SUM(p.monto), 0) - 
   COALESCE(SUM(e.monto), 0)) as balance_neto
FROM auth.users u
LEFT JOIN public.invoices i ON i.user_id = u.id
LEFT JOIN public.payments p ON p.user_id = u.id
LEFT JOIN public.expenses e ON e.user_id = u.id
LEFT JOIN public.client_credits cc ON cc.user_id = u.id
GROUP BY u.id;

-- Grant access to the view
GRANT SELECT ON public.firm_accounting_summary TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.firm_accounting_summary SET (security_invoker = true);

-- Comment explaining the new fields
COMMENT ON COLUMN public.expenses.itbis IS 'ITBIS (impuesto) aplicado al gasto - campo opcional';
COMMENT ON COLUMN public.invoices.itbis IS 'ITBIS (impuesto) incluido en la factura - campo opcional';
COMMENT ON COLUMN public.invoices.interes IS 'Intereses aplicados a la factura - campo opcional';
COMMENT ON COLUMN public.client_credits.interes IS 'Intereses aplicados al crédito - campo opcional';
COMMENT ON VIEW public.firm_accounting_summary IS 'Vista consolidada de contabilidad general de la firma';