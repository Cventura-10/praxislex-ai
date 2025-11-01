-- Crear bucket para plantillas de documentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates',
  'templates',
  false,
  10485760, -- 10MB
  ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS para bucket templates: solo lectura autenticada, escritura admin
CREATE POLICY "Usuarios autenticados pueden leer plantillas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'templates');

CREATE POLICY "Solo admins pueden subir plantillas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'templates' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )
  )
);

CREATE POLICY "Solo admins pueden actualizar plantillas"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'templates'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )
  )
);

CREATE POLICY "Solo admins pueden eliminar plantillas"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'templates'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )
  )
);