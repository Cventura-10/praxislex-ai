-- Agregar campos adicionales a la tabla lawyers para el generador de actos
ALTER TABLE public.lawyers 
ADD COLUMN IF NOT EXISTS matricula_card TEXT,
ADD COLUMN IF NOT EXISTS firma_digital_url TEXT,
ADD COLUMN IF NOT EXISTS despacho_direccion TEXT;

-- Comentarios para documentar los campos
COMMENT ON COLUMN public.lawyers.matricula_card IS 'Número de matrícula del Colegio de Abogados de la República Dominicana';
COMMENT ON COLUMN public.lawyers.firma_digital_url IS 'URL de la imagen de firma digital del abogado almacenada en storage';
COMMENT ON COLUMN public.lawyers.despacho_direccion IS 'Dirección completa del despacho del abogado';