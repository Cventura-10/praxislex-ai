-- Fix hash function to use pgcrypto digest correctly and ensure case number autogeneration trigger exists

-- 1) Correct hash function: digest expects bytea, not text
CREATE OR REPLACE FUNCTION public.hash_payload(data jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN encode(digest(convert_to(data::text, 'UTF8'), 'sha256'), 'hex');
END;
$$;

-- 2) Ensure BEFORE INSERT trigger exists to auto-generate numero_expediente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_generate_case_number'
  ) THEN
    CREATE TRIGGER trg_auto_generate_case_number
    BEFORE INSERT ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_case_number();
  END IF;
END $$;