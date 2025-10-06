-- Crear tabla para información de firma del abogado/bufete
CREATE TABLE public.law_firm_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre_firma text NOT NULL,
  rnc text,
  direccion text,
  telefono text,
  email text,
  ciudad text,
  provincia text,
  abogado_principal text,
  matricula_card text,
  eslogan text,
  sitio_web text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.law_firm_profile ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own law firm profile"
  ON public.law_firm_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own law firm profile"
  ON public.law_firm_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own law firm profile"
  ON public.law_firm_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_law_firm_profile_updated_at
  BEFORE UPDATE ON public.law_firm_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();