-- Agregar campos de generales a todas las tablas de profesionales
-- Para que autocompléten en los formularios de actos jurídicos

-- TABLA: lawyers (abogados)
ALTER TABLE public.lawyers
ADD COLUMN IF NOT EXISTS nacionalidad text,
ADD COLUMN IF NOT EXISTS estado_civil text,
ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
ADD COLUMN IF NOT EXISTS lugar_nacimiento text,
ADD COLUMN IF NOT EXISTS pasaporte text,
ADD COLUMN IF NOT EXISTS direccion text,
ADD COLUMN IF NOT EXISTS telefono text,
ADD COLUMN IF NOT EXISTS email text;

-- TABLA: notarios
ALTER TABLE public.notarios
ADD COLUMN IF NOT EXISTS nacionalidad text,
ADD COLUMN IF NOT EXISTS estado_civil text,
ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
ADD COLUMN IF NOT EXISTS lugar_nacimiento text,
ADD COLUMN IF NOT EXISTS pasaporte text;

-- TABLA: alguaciles
ALTER TABLE public.alguaciles
ADD COLUMN IF NOT EXISTS nacionalidad text,
ADD COLUMN IF NOT EXISTS estado_civil text,
ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
ADD COLUMN IF NOT EXISTS lugar_nacimiento text,
ADD COLUMN IF NOT EXISTS pasaporte text;

-- TABLA: peritos
ALTER TABLE public.peritos
ADD COLUMN IF NOT EXISTS nacionalidad text,
ADD COLUMN IF NOT EXISTS estado_civil text,
ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
ADD COLUMN IF NOT EXISTS lugar_nacimiento text,
ADD COLUMN IF NOT EXISTS pasaporte text;

-- TABLA: tasadores
ALTER TABLE public.tasadores
ADD COLUMN IF NOT EXISTS nacionalidad text,
ADD COLUMN IF NOT EXISTS estado_civil text,
ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
ADD COLUMN IF NOT EXISTS lugar_nacimiento text,
ADD COLUMN IF NOT EXISTS pasaporte text;

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_lawyers_nacionalidad ON public.lawyers(nacionalidad);
CREATE INDEX IF NOT EXISTS idx_notarios_nacionalidad ON public.notarios(nacionalidad);
CREATE INDEX IF NOT EXISTS idx_alguaciles_nacionalidad ON public.alguaciles(nacionalidad);
CREATE INDEX IF NOT EXISTS idx_peritos_nacionalidad ON public.peritos(nacionalidad);
CREATE INDEX IF NOT EXISTS idx_tasadores_nacionalidad ON public.tasadores(nacionalidad);

-- Comentarios para documentación
COMMENT ON COLUMN public.lawyers.nacionalidad IS 'Nacionalidad del abogado';
COMMENT ON COLUMN public.lawyers.estado_civil IS 'Estado civil del abogado';
COMMENT ON COLUMN public.lawyers.fecha_nacimiento IS 'Fecha de nacimiento del abogado';
COMMENT ON COLUMN public.lawyers.lugar_nacimiento IS 'Lugar de nacimiento del abogado';
COMMENT ON COLUMN public.lawyers.pasaporte IS 'Número de pasaporte (para extranjeros)';
COMMENT ON COLUMN public.lawyers.direccion IS 'Dirección del abogado';
COMMENT ON COLUMN public.lawyers.telefono IS 'Teléfono del abogado';
COMMENT ON COLUMN public.lawyers.email IS 'Email del abogado';