-- Crear secuencia para números de factura
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1;

-- Función para generar número de factura automáticamente
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN concat('FAC-', to_char(now(),'YYYY'), '-', lpad(nextval('invoice_number_seq')::text, 4, '0'));
END;
$function$;

-- Trigger para auto-generar número de factura
CREATE OR REPLACE FUNCTION public.auto_generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.numero_factura IS NULL OR NEW.numero_factura = '' THEN
    NEW.numero_factura := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Aplicar trigger a la tabla invoices
DROP TRIGGER IF EXISTS trigger_auto_invoice_number ON public.invoices;
CREATE TRIGGER trigger_auto_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_invoice_number();