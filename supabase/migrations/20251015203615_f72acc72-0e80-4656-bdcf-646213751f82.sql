-- Agregar columna folios a la tabla notarial_acts si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notarial_acts' 
    AND column_name = 'folios'
  ) THEN
    ALTER TABLE public.notarial_acts 
    ADD COLUMN folios integer DEFAULT 1;
  END IF;
END $$;