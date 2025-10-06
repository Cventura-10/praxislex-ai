-- Function to generate automatic case numbers
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text;
  v_count int;
  v_case_number text;
BEGIN
  -- Get current year
  v_year := to_char(now(), 'YYYY');
  
  -- Count cases created this year for this user
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.cases
  WHERE user_id = auth.uid()
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM now());
  
  -- Generate case number: CASO-YYYY-NNNN
  v_case_number := 'CASO-' || v_year || '-' || lpad(v_count::text, 4, '0');
  
  RETURN v_case_number;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_case_number() TO authenticated;

-- Trigger function to auto-generate case number if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_case_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate if numero_expediente is empty or null
  IF NEW.numero_expediente IS NULL OR NEW.numero_expediente = '' THEN
    NEW.numero_expediente := public.generate_case_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and create trigger
DROP TRIGGER IF EXISTS trg_auto_generate_case_number ON public.cases;
CREATE TRIGGER trg_auto_generate_case_number
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_case_number();
