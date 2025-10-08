-- Create storage bucket for legal document models
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-models',
  'legal-models',
  false,
  10485760, -- 10MB
  ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for legal-models bucket
CREATE POLICY "Authenticated users can upload legal models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'legal-models' AND auth.uid() = owner);

CREATE POLICY "Users can view their own legal models"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'legal-models' AND auth.uid() = owner);

CREATE POLICY "Users can update their own legal models"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'legal-models' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own legal models"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'legal-models' AND auth.uid() = owner);

-- Create table to store legal model metadata
CREATE TABLE IF NOT EXISTS public.legal_model_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  materia TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_model_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_model_templates
CREATE POLICY "Users can view their own templates"
ON public.legal_model_templates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
ON public.legal_model_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.legal_model_templates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.legal_model_templates FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_legal_model_templates_user_id ON public.legal_model_templates(user_id);
CREATE INDEX idx_legal_model_templates_template_id ON public.legal_model_templates(template_id);
CREATE INDEX idx_legal_model_templates_materia ON public.legal_model_templates(materia);