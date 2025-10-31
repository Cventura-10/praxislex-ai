-- Agregar campos adicionales a la tabla clients para autocompletado en formularios
-- Incluye todas las generales necesarias para actos jurídicos

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS nacionalidad text,
ADD COLUMN IF NOT EXISTS estado_civil text,
ADD COLUMN IF NOT EXISTS profesion text,
ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
ADD COLUMN IF NOT EXISTS lugar_nacimiento text,
ADD COLUMN IF NOT EXISTS pasaporte text,
ADD COLUMN IF NOT EXISTS ocupacion text,
ADD COLUMN IF NOT EXISTS empresa_empleador text,
ADD COLUMN IF NOT EXISTS matricula_card text,
ADD COLUMN IF NOT EXISTS matricula_profesional text,
ADD COLUMN IF NOT EXISTS tipo_persona text DEFAULT 'fisica' CHECK (tipo_persona IN ('fisica', 'juridica')),
ADD COLUMN IF NOT EXISTS razon_social text,
ADD COLUMN IF NOT EXISTS representante_legal text,
ADD COLUMN IF NOT EXISTS cargo_representante text;

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_clients_nacionalidad ON public.clients(nacionalidad);
CREATE INDEX IF NOT EXISTS idx_clients_estado_civil ON public.clients(estado_civil);
CREATE INDEX IF NOT EXISTS idx_clients_tipo_persona ON public.clients(tipo_persona);

-- Comentarios para documentación
COMMENT ON COLUMN public.clients.nacionalidad IS 'Nacionalidad del cliente (ej: Dominicana, Haitiana, etc.)';
COMMENT ON COLUMN public.clients.estado_civil IS 'Estado civil (soltero, casado, divorciado, unión libre, viudo)';
COMMENT ON COLUMN public.clients.profesion IS 'Profesión u oficio del cliente';
COMMENT ON COLUMN public.clients.fecha_nacimiento IS 'Fecha de nacimiento del cliente';
COMMENT ON COLUMN public.clients.lugar_nacimiento IS 'Lugar de nacimiento del cliente';
COMMENT ON COLUMN public.clients.pasaporte IS 'Número de pasaporte (para extranjeros)';
COMMENT ON COLUMN public.clients.ocupacion IS 'Ocupación actual del cliente';
COMMENT ON COLUMN public.clients.empresa_empleador IS 'Empresa o empleador del cliente';
COMMENT ON COLUMN public.clients.matricula_card IS 'Matrícula CARD (si el cliente es abogado)';
COMMENT ON COLUMN public.clients.matricula_profesional IS 'Matrícula profesional (médico, ingeniero, etc.)';
COMMENT ON COLUMN public.clients.tipo_persona IS 'Tipo de persona: física o jurídica';
COMMENT ON COLUMN public.clients.razon_social IS 'Razón social (para personas jurídicas)';
COMMENT ON COLUMN public.clients.representante_legal IS 'Nombre del representante legal (para personas jurídicas)';
COMMENT ON COLUMN public.clients.cargo_representante IS 'Cargo del representante legal (gerente, presidente, etc.)';