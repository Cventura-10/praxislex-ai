-- Eliminar función existente primero
DROP FUNCTION IF EXISTS public.generate_case_number() CASCADE;

-- Tabla de logs de acciones de IA
CREATE TABLE IF NOT EXISTS public.ai_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_token text,
  intent text NOT NULL,
  params jsonb,
  case_number text,
  created_at timestamp with time zone DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_ai_actions_user ON public.ai_actions_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_case ON public.ai_actions_log(case_number);

-- RLS para ai_actions_log
ALTER TABLE public.ai_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI actions"
ON public.ai_actions_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI actions"
ON public.ai_actions_log FOR INSERT
WITH CHECK (true);

-- Agregar case_number a todas las tablas relacionadas si no existe
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS case_number text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS case_number text;
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS case_number text;
ALTER TABLE public.client_credits ADD COLUMN IF NOT EXISTS case_number text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS case_number text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS case_number text;

-- Agregar case_number único a cases si no existe
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS case_number text;
DROP INDEX IF EXISTS idx_cases_case_number;
CREATE UNIQUE INDEX idx_cases_case_number ON public.cases(case_number) WHERE case_number IS NOT NULL;

-- Función mejorada para generar número de expediente automático
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
    NEW.case_number := CONCAT(
      'EXP-',
      to_char(NOW(), 'YYYYMMDD'),
      '-',
      UPPER(substring(gen_random_uuid()::text, 1, 6))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para generar case_number automáticamente
DROP TRIGGER IF EXISTS trg_generate_case_number ON public.cases;
CREATE TRIGGER trg_generate_case_number
BEFORE INSERT ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.generate_case_number();

-- Poblar case_number para casos existentes
UPDATE public.cases
SET case_number = CONCAT('EXP-', to_char(created_at, 'YYYYMMDD'), '-', UPPER(substring(id::text, 1, 6)))
WHERE case_number IS NULL;

-- Poblar case_number en hearings desde cases
UPDATE public.hearings h
SET case_number = cs.case_number
FROM public.cases cs
WHERE h.case_id = cs.id AND h.case_number IS NULL;

-- Poblar case_number en invoices desde casos relacionados al cliente
UPDATE public.invoices i
SET case_number = (
  SELECT cs.case_number 
  FROM public.cases cs 
  WHERE cs.client_id = i.client_id 
  ORDER BY cs.created_at DESC 
  LIMIT 1
)
WHERE i.case_number IS NULL 
AND EXISTS (SELECT 1 FROM public.cases WHERE client_id = i.client_id);