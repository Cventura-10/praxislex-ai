-- Hotfix v1.4.8: Domicilio en clients y vista de notarios

-- Agregar campos de domicilio a clients si no existen
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS provincia_id TEXT,
  ADD COLUMN IF NOT EXISTS municipio_id TEXT,
  ADD COLUMN IF NOT EXISTS sector_id TEXT,
  ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_clients_provincia ON public.clients(provincia_id);
CREATE INDEX IF NOT EXISTS idx_clients_municipio ON public.clients(municipio_id);

-- Crear vista de notarios con datos completos y cédula enmascarada
CREATE OR REPLACE VIEW public.v_notarios_complete AS
SELECT
  n.id,
  n.nombre,
  n.matricula_cdn as exequatur,
  n.telefono,
  n.email,
  n.oficina_direccion as oficina,
  n.jurisdiccion,
  n.tenant_id,
  n.user_id,
  CASE 
    WHEN n.cedula_encrypted IS NOT NULL AND LENGTH(n.cedula_encrypted) >= 11 THEN
      SUBSTRING(n.cedula_encrypted, 1, 3) || '-****-****'
    ELSE '***-****-****'
  END as cedula_mask
FROM public.notarios n
WHERE n.estado = 'activo';