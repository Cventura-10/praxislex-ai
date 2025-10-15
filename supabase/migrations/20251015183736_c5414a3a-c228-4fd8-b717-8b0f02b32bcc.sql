-- Agregar constraint único en act_types.slug si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'act_types_slug_key'
  ) THEN
    ALTER TABLE act_types ADD CONSTRAINT act_types_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Agregar constraint único compuesto en act_fields si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'act_fields_act_slug_field_key_key'
  ) THEN
    ALTER TABLE act_fields ADD CONSTRAINT act_fields_act_slug_field_key_key UNIQUE (act_slug, field_key);
  END IF;
END $$;

-- 1. EMPLAZAMIENTO
INSERT INTO act_types (slug, title, materia, tipo_documento, act_template_kind)
VALUES (
  'emplazamiento',
  'Emplazamiento',
  'Civil y Comercial',
  'Actos Judiciales',
  'procesal_alguacil'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  materia = EXCLUDED.materia,
  tipo_documento = EXCLUDED.tipo_documento,
  act_template_kind = EXCLUDED.act_template_kind;

-- Campos del Emplazamiento
INSERT INTO act_fields (act_slug, field_key, field_label, field_type, is_required, display_order)
VALUES
  ('emplazamiento', 'numero_acto', 'Número de Acto', 'text', true, 1),
  ('emplazamiento', 'fecha_actuacion', 'Fecha de Actuación', 'date', true, 2),
  ('emplazamiento', 'ciudad_actuacion', 'Ciudad', 'text', true, 3),
  ('emplazamiento', 'alguacil_nombre', 'Alguacil - Nombre', 'text', true, 4),
  ('emplazamiento', 'alguacil_cedula', 'Alguacil - Cédula', 'text', true, 5),
  ('emplazamiento', 'alguacil_tribunal', 'Alguacil - Tribunal', 'text', true, 6),
  ('emplazamiento', 'requeriente_nombre', 'Requeriente - Nombre', 'text', true, 7),
  ('emplazamiento', 'abogado_nombre', 'Abogado - Nombre', 'text', true, 8),
  ('emplazamiento', 'abogado_direccion', 'Abogado - Estudio', 'text', true, 9),
  ('emplazamiento', 'emplazado_nombre', 'Emplazado - Nombre', 'text', true, 10),
  ('emplazamiento', 'emplazado_domicilio', 'Emplazado - Domicilio', 'text', true, 11),
  ('emplazamiento', 'persona_contactada', 'Persona Contactada', 'text', true, 12),
  ('emplazamiento', 'tribunal_competente', 'Tribunal Competente', 'text', true, 13),
  ('emplazamiento', 'objeto_breve', 'Objeto (Breve - Máx 2 líneas)', 'textarea', true, 14)
ON CONFLICT (act_slug, field_key) DO UPDATE SET
  field_label = EXCLUDED.field_label,
  field_type = EXCLUDED.field_type,
  is_required = EXCLUDED.is_required,
  display_order = EXCLUDED.display_order;

-- 2. QUERELLA PENAL
INSERT INTO act_types (slug, title, materia, tipo_documento, act_template_kind)
VALUES (
  'querella_penal',
  'Querella Penal con Actor Civil',
  'Penal',
  'Actos Judiciales',
  'procesal_conclusion'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  materia = EXCLUDED.materia,
  tipo_documento = EXCLUDED.tipo_documento,
  act_template_kind = EXCLUDED.act_template_kind;

INSERT INTO act_fields (act_slug, field_key, field_label, field_type, is_required, display_order)
VALUES
  ('querella_penal', 'jurisdiccion', 'Jurisdicción (Fiscalía/Juzgado)', 'text', true, 1),
  ('querella_penal', 'querellante_nombre', 'Querellante (Víctima) - Nombre', 'text', true, 2),
  ('querella_penal', 'querellante_cedula', 'Querellante - Cédula', 'text', true, 3),
  ('querella_penal', 'querellante_domicilio', 'Querellante - Domicilio', 'text', true, 4),
  ('querella_penal', 'abogado_nombre', 'Abogado - Nombre', 'text', true, 5),
  ('querella_penal', 'abogado_estudio', 'Abogado - Estudio', 'text', true, 6),
  ('querella_penal', 'imputado_nombre', 'Imputado (Acusado) - Nombre', 'text', true, 7),
  ('querella_penal', 'imputado_domicilio', 'Imputado - Domicilio', 'text', false, 8),
  ('querella_penal', 'infraccion_penal', 'Infracción Penal (Delito)', 'text', true, 9),
  ('querella_penal', 'relato_hechos', 'Relato de Hechos (Detallado)', 'textarea', true, 10),
  ('querella_penal', 'calificacion_juridica', 'Calificación Jurídica', 'textarea', true, 11),
  ('querella_penal', 'pruebas_documentales', 'Pruebas Documentales', 'textarea', false, 12),
  ('querella_penal', 'pruebas_testimoniales', 'Testigos', 'textarea', false, 13),
  ('querella_penal', 'danos_materiales', 'Daños Materiales (RD$)', 'number', false, 14),
  ('querella_penal', 'danos_morales', 'Daños Morales (RD$)', 'number', false, 15)
ON CONFLICT (act_slug, field_key) DO UPDATE SET
  field_label = EXCLUDED.field_label,
  field_type = EXCLUDED.field_type,
  is_required = EXCLUDED.is_required,
  display_order = EXCLUDED.display_order;

-- 3. INVENTARIO DE DOCUMENTOS  
INSERT INTO act_types (slug, title, materia, tipo_documento, act_template_kind)
VALUES (
  'inventario_documentos',
  'Inventario de Documentos',
  'Civil y Comercial',
  'Actos Judiciales',
  'procesal_conclusion'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  materia = EXCLUDED.materia,
  tipo_documento = EXCLUDED.tipo_documento,
  act_template_kind = EXCLUDED.act_template_kind;

INSERT INTO act_fields (act_slug, field_key, field_label, field_type, is_required, display_order)
VALUES
  ('inventario_documentos', 'tribunal', 'Tribunal', 'text', true, 1),
  ('inventario_documentos', 'expediente', 'Número de Expediente', 'text', true, 2),
  ('inventario_documentos', 'depositante_nombre', 'Depositante - Nombre', 'text', true, 3),
  ('inventario_documentos', 'calidad_procesal', 'Calidad Procesal', 'select', true, 4),
  ('inventario_documentos', 'documentos_listado', 'Listado de Documentos (Numerado)', 'textarea', true, 5)
ON CONFLICT (act_slug, field_key) DO UPDATE SET
  field_label = EXCLUDED.field_label,
  field_type = EXCLUDED.field_type,
  is_required = EXCLUDED.is_required,
  display_order = EXCLUDED.display_order;