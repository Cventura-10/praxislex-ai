-- Agregar campo tipo_caso a la tabla cases
ALTER TABLE public.cases 
ADD COLUMN tipo_caso text NOT NULL DEFAULT 'judicial' 
CHECK (tipo_caso IN ('judicial', 'extrajudicial'));

-- Agregar comentario para documentar
COMMENT ON COLUMN public.cases.tipo_caso IS 'Tipo de caso: judicial (requiere juzgado, etapa procesal) o extrajudicial (no requiere juzgado)';