-- =====================================================
-- NUMERACIÓN AUTOMÁTICA DE ACTOS LEGALES
-- =====================================================

-- Crear tabla de secuencias si no existe
CREATE TABLE IF NOT EXISTS public.act_sequences (
  year INT PRIMARY KEY,
  current_number INT NOT NULL DEFAULT 0
);

-- Crear función para generar siguiente número
CREATE OR REPLACE FUNCTION public.next_act_number(p_year INT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE 
  n INT;
BEGIN
  -- Insertar año si no existe
  INSERT INTO public.act_sequences(year, current_number)
  VALUES (p_year, 0)
  ON CONFLICT (year) DO NOTHING;

  -- Incrementar y obtener número
  UPDATE public.act_sequences
  SET current_number = current_number + 1
  WHERE year = p_year
  RETURNING current_number INTO n;

  -- Retornar formato ACT-YYYY-###
  RETURN 'ACT-' || p_year || '-' || lpad(n::text, 3, '0');
END;
$$;

-- Agregar columnas a generated_acts si no existen
ALTER TABLE public.generated_acts
  ADD COLUMN IF NOT EXISTS numero_acto TEXT,
  ADD COLUMN IF NOT EXISTS numero_acta TEXT,
  ADD COLUMN IF NOT EXISTS numero_folios INT;

-- Crear trigger para asignar número automáticamente
CREATE OR REPLACE FUNCTION public.assign_numero_acto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.numero_acto IS NULL OR NEW.numero_acto = '' THEN
    NEW.numero_acto := public.next_act_number(EXTRACT(YEAR FROM NOW())::INT);
  END IF;
  RETURN NEW;
END;
$$;

-- Eliminar trigger anterior si existe y crear nuevo
DROP TRIGGER IF EXISTS trg_assign_numero_acto ON public.generated_acts;
CREATE TRIGGER trg_assign_numero_acto
  BEFORE INSERT ON public.generated_acts
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_numero_acto();

-- Agregar columnas a notarial_acts si no existen
ALTER TABLE public.notarial_acts
  ADD COLUMN IF NOT EXISTS numero_acto TEXT,
  ADD COLUMN IF NOT EXISTS numero_folios INT;

-- Crear trigger para notarial_acts
DROP TRIGGER IF EXISTS trg_assign_numero_acto_notarial ON public.notarial_acts;
CREATE TRIGGER trg_assign_numero_acto_notarial
  BEFORE INSERT ON public.notarial_acts
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_numero_acto();

COMMENT ON TABLE public.act_sequences IS 'Secuencias anuales para numeración automática de actos legales';
COMMENT ON FUNCTION public.next_act_number(INT) IS 'Genera el siguiente número de acto en formato ACT-YYYY-###';
COMMENT ON FUNCTION public.assign_numero_acto() IS 'Trigger para asignar número automático a actos legales';