-- Fix client_credits tipo constraint to support all transaction types
ALTER TABLE public.client_credits DROP CONSTRAINT IF EXISTS client_credits_tipo_check;

-- Add updated constraint with all valid transaction types
ALTER TABLE public.client_credits 
ADD CONSTRAINT client_credits_tipo_check 
CHECK (tipo = ANY (ARRAY['credito'::text, 'debito'::text, 'ingreso_general'::text, 'gasto_general'::text]));

-- Add comment to document valid values
COMMENT ON COLUMN public.client_credits.tipo IS 'Valid values: credito (client credit), debito (client debit), ingreso_general (general firm income), gasto_general (general firm expense)';