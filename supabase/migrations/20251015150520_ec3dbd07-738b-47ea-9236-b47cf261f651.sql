-- Agregar campo jurisdiccion a tablas de profesionales que lo requieran

-- Agregar jurisdiccion a peritos
ALTER TABLE public.peritos ADD COLUMN IF NOT EXISTS jurisdiccion TEXT;

-- Agregar jurisdiccion a tasadores  
ALTER TABLE public.tasadores ADD COLUMN IF NOT EXISTS jurisdiccion TEXT;

-- Agregar comentarios para documentación
COMMENT ON COLUMN public.peritos.jurisdiccion IS 'Jurisdicción de actuación del perito';
COMMENT ON COLUMN public.tasadores.jurisdiccion IS 'Jurisdicción de actuación del tasador';
COMMENT ON COLUMN public.notarios.jurisdiccion IS 'Jurisdicción de actuación del notario';