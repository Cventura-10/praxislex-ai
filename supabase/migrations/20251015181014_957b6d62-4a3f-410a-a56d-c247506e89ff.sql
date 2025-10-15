-- Poblar act_types con los modelos principales de actos jurídicos
-- Basado en el análisis de integración y modelos desarrollados

-- Acto de Traslado (Demanda) - Ya existe como demanda_civil
UPDATE act_types 
SET 
  title = 'Acto de Traslado (Demanda Civil)',
  act_template_kind = 'procesal_portada'
WHERE slug = 'demanda_civil';

-- Insertar Emplazamiento (Acto de notificación pura)
INSERT INTO act_types (slug, title, materia, tipo_documento, act_template_kind)
VALUES 
  ('emplazamiento', 'Emplazamiento', 'Civil y Comercial', 'Actos Judiciales', 'procesal_alguacil');

-- Insertar Querella Penal
INSERT INTO act_types (slug, title, materia, tipo_documento, act_template_kind)
VALUES 
  ('querella_penal', 'Querella con Constitución en Actor Civil', 'Penal', 'Actos Judiciales', 'escrito_deposito');

-- Insertar Inventario de Documentos
INSERT INTO act_types (slug, title, materia, tipo_documento, act_template_kind)
VALUES 
  ('inventario_documentos', 'Inventario de Documentos', 'Civil y Comercial', 'Actos Judiciales', 'escrito_deposito');

-- Insertar Escrito de Conclusiones
INSERT INTO act_types (slug, title, materia, tipo_documento, act_template_kind)
VALUES 
  ('conclusiones', 'Escrito de Conclusiones', 'Civil y Comercial', 'Actos Judiciales', 'escrito_varios');

-- Insertar Contrato de Compraventa
INSERT INTO act_types (slug, title, materia, tipo_documento, act_template_kind)
VALUES 
  ('contrato_compraventa', 'Contrato de Compraventa Inmobiliaria', 'Inmobiliario', 'Actos Extrajudiciales', 'extrajudicial_contrato');

-- Insertar campos para Emplazamiento
DELETE FROM act_fields WHERE act_slug = 'emplazamiento';
INSERT INTO act_fields (act_slug, field_key, field_label, field_type, is_required, display_order)
VALUES 
  ('emplazamiento', 'numero_acto', 'Número de Acto', 'text', true, 1),
  ('emplazamiento', 'fecha_actuacion', 'Fecha de Actuación', 'date', true, 2),
  ('emplazamiento', 'alguacil_nombre', 'Nombre del Alguacil', 'text', true, 3),
  ('emplazamiento', 'requeriente_nombre', 'Nombre del Requeriente', 'text', true, 4),
  ('emplazamiento', 'emplazado_nombre', 'Nombre del Emplazado', 'text', true, 5),
  ('emplazamiento', 'tribunal_nombre', 'Tribunal', 'text', true, 6),
  ('emplazamiento', 'audiencia_fecha', 'Fecha de Audiencia', 'date', true, 7),
  ('emplazamiento', 'objeto_demanda', 'Objeto de la Demanda (breve)', 'textarea', true, 8);

-- Insertar campos para Querella Penal
DELETE FROM act_fields WHERE act_slug = 'querella_penal';
INSERT INTO act_fields (act_slug, field_key, field_label, field_type, is_required, display_order)
VALUES 
  ('querella_penal', 'tribunal_nombre', 'Tribunal', 'text', true, 1),
  ('querella_penal', 'querellante_nombre', 'Nombre del Querellante', 'text', true, 2),
  ('querella_penal', 'imputado_nombre', 'Nombre del Imputado', 'text', true, 3),
  ('querella_penal', 'relato_hechos', 'Relato de los Hechos', 'textarea', true, 4),
  ('querella_penal', 'calificacion_juridica', 'Calificación Jurídica', 'textarea', true, 5),
  ('querella_penal', 'pruebas', 'Pruebas', 'textarea', true, 6),
  ('querella_penal', 'petitorio', 'Petitorio', 'textarea', true, 7);

-- Insertar campos para Inventario de Documentos
DELETE FROM act_fields WHERE act_slug = 'inventario_documentos';
INSERT INTO act_fields (act_slug, field_key, field_label, field_type, is_required, display_order)
VALUES 
  ('inventario_documentos', 'tribunal_nombre', 'Tribunal', 'text', true, 1),
  ('inventario_documentos', 'numero_expediente', 'Número de Expediente', 'text', true, 2),
  ('inventario_documentos', 'depositante_nombre', 'Nombre del Depositante', 'text', true, 3),
  ('inventario_documentos', 'depositante_calidad', 'Calidad (Demandante/Demandado/Interventor)', 'text', true, 4),
  ('inventario_documentos', 'documentos', 'Lista de Documentos', 'textarea', true, 5);