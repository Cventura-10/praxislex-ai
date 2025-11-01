-- ============================================================================
-- PRAXIS LEX RESCATE TOTAL v3.2 - Migraciones Base de Datos
-- ============================================================================

-- 1.1 Secuencias y numeración ACT-YYYY-###
CREATE TABLE IF NOT EXISTS public.act_sequences (
  year INT PRIMARY KEY,
  current_number INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.next_act_number(p_year INT)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE 
  n INT;
BEGIN
  INSERT INTO public.act_sequences(year, current_number)
  VALUES (p_year, 0)
  ON CONFLICT (year) DO NOTHING;

  UPDATE public.act_sequences
  SET current_number = current_number + 1
  WHERE year = p_year
  RETURNING current_number INTO n;

  RETURN 'ACT-' || p_year || '-' || lpad(n::text, 3, '0');
END;
$$;

-- 1.2 Alterar tabla notarial_acts (añadir campos si faltan)
ALTER TABLE public.notarial_acts
  ADD COLUMN IF NOT EXISTS numero_acto TEXT,
  ADD COLUMN IF NOT EXISTS numero_acta TEXT,
  ADD COLUMN IF NOT EXISTS provincia_id INT REFERENCES public.provincias(id);

-- Trigger BEFORE INSERT para asignar numero_acto si viene null
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

DROP TRIGGER IF EXISTS trg_assign_numero_acto ON public.notarial_acts;
CREATE TRIGGER trg_assign_numero_acto
  BEFORE INSERT ON public.notarial_acts
  FOR EACH ROW 
  EXECUTE FUNCTION public.assign_numero_acto();

-- 1.3 Geo RD (idempotente) - Las tablas ya existen, verificar índices
CREATE INDEX IF NOT EXISTS idx_mun_prov ON public.municipios(provincia_id);
CREATE INDEX IF NOT EXISTS idx_sec_mun ON public.sectores(municipio_id);

-- 1.4 Domicilio en clients - campos ya existen, agregar faltantes
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS sector_id TEXT;

-- 1.5 Vista de notarios para autofill limpio
CREATE OR REPLACE VIEW public.v_notarios AS
SELECT
  n.id,
  n.user_id,
  n.tenant_id,
  n.nombre,
  COALESCE(n.exequatur, '') AS exequatur,
  COALESCE(n.telefono, '') AS telefono,
  COALESCE(n.email, '') AS email,
  COALESCE(n.oficina_direccion, '') AS oficina,
  n.municipio_id,
  m.nombre AS municipio_nombre,
  m.provincia_id,
  p.nombre AS provincia_nombre,
  COALESCE(n.jurisdiccion, '') AS jurisdiccion,
  (LEFT(COALESCE(n.cedula_encrypted, ''), 3) || '-****-****') AS cedula_mask
FROM public.notarios n
LEFT JOIN public.municipios m ON m.id = n.municipio_id
LEFT JOIN public.provincias p ON p.id = m.provincia_id;

-- 1.6 Contraparte y Abogados contrarios
CREATE TABLE IF NOT EXISTS public.act_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acto_id UUID REFERENCES public.notarial_acts(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  professional_id UUID REFERENCES public.lawyers(id) ON DELETE SET NULL,
  side TEXT NOT NULL CHECK (side IN ('actor', 'demandado', 'tercero')),
  rol TEXT NOT NULL,
  snapshot JSONB DEFAULT '{}'::JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL
);

-- RLS para act_parties
ALTER TABLE public.act_parties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own act_parties" ON public.act_parties;
CREATE POLICY "read own act_parties" 
  ON public.act_parties 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "write own act_parties" ON public.act_parties;
CREATE POLICY "write own act_parties" 
  ON public.act_parties 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update own act_parties" ON public.act_parties;
CREATE POLICY "update own act_parties" 
  ON public.act_parties 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete own act_parties" ON public.act_parties;
CREATE POLICY "delete own act_parties" 
  ON public.act_parties 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para updated_at en act_parties
CREATE OR REPLACE FUNCTION public.update_act_parties_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_act_parties_timestamp ON public.act_parties;
CREATE TRIGGER trg_update_act_parties_timestamp
  BEFORE UPDATE ON public.act_parties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_act_parties_timestamp();