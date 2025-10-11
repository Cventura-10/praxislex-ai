-- Asegurar que case_number se genera automáticamente si no existe
CREATE SEQUENCE IF NOT EXISTS case_seq START 1;

-- Eliminar función existente y recrear con tipo correcto
DROP FUNCTION IF EXISTS public.generate_case_number() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TEXT AS $$
BEGIN
  RETURN concat('CASO-', to_char(now(),'YYYY'), '-', lpad(nextval('case_seq')::text,4,'0'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Asegurar que hearings tenga campos correctos como NOT NULL
ALTER TABLE public.hearings 
  ALTER COLUMN fecha SET NOT NULL,
  ALTER COLUMN hora SET NOT NULL,
  ALTER COLUMN caso SET NOT NULL,
  ALTER COLUMN juzgado SET NOT NULL,
  ALTER COLUMN tipo SET NOT NULL;

-- Asegurar que deadlines tenga campos correctos
ALTER TABLE public.deadlines
  ALTER COLUMN fecha_vencimiento SET NOT NULL,
  ALTER COLUMN caso SET NOT NULL,
  ALTER COLUMN tipo SET NOT NULL;