/**
 * PLANTILLAS NOTARIALES - PRAXISLEX
 * Basado en Ley No. 140-15 del Notariado (República Dominicana)
 * Clasificación: Actos Auténticos, Firma Privada, Declaraciones Unilaterales
 */

export interface NotarialActField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'array' | 'money';
  required: boolean;
  validation?: string;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  showIf?: (values: Record<string, any>) => boolean;
}

export interface NotarialActTemplate {
  actId: string;
  tipo_acto: 'autentico' | 'firma_privada' | 'declaracion_unilateral';
  titulo: string;
  descripcion: string;
  requiere_testigos: boolean;
  fields: NotarialActField[];
}

// ============================================
// ACTOS AUTÉNTICOS (Art. 5 Ley 140-15)
// ============================================

export const CONTRATO_PRESTAMO_HIPOTECA: NotarialActTemplate = {
  actId: 'contrato_prestamo_hipoteca',
  tipo_acto: 'autentico',
  titulo: 'Contrato de Préstamo con Garantía Hipotecaria',
  descripcion: 'Acto auténtico más solemne del derecho notarial dominicano',
  requiere_testigos: true,
  fields: [
    // DATOS GENERALES
    { id: 'numero_protocolo', label: 'Número de Protocolo', type: 'text', required: true, placeholder: '2025-001' },
    { id: 'fecha_instrumentacion', label: 'Fecha de Instrumentación', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true, placeholder: 'Santo Domingo' },
    { id: 'provincia', label: 'Provincia', type: 'text', required: false, placeholder: 'Distrito Nacional' },
    
    // NOTARIO
    { id: 'notario_nombre', label: 'Nombre del Notario', type: 'text', required: true },
    { id: 'notario_matricula', label: 'Matrícula CDN', type: 'text', required: true },
    { id: 'notario_colegio', label: 'Colegio Notarial', type: 'text', required: true },
    { id: 'notario_estudio', label: 'Dirección del Estudio', type: 'textarea', required: true },
    
    // PRESTAMISTA (ACREEDOR)
    { id: 'prestamista_nombre', label: 'Prestamista - Nombre Completo', type: 'text', required: true },
    { id: 'prestamista_cedula', label: 'Prestamista - Cédula/RNC', type: 'text', required: true },
    { id: 'prestamista_nacionalidad', label: 'Prestamista - Nacionalidad', type: 'text', required: true },
    { id: 'prestamista_estado_civil', label: 'Prestamista - Estado Civil', type: 'select', required: true, 
      options: ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)', 'Unión libre'] },
    { id: 'prestamista_domicilio', label: 'Prestamista - Domicilio', type: 'textarea', required: true },
    
    // PRESTATARIO (DEUDOR)
    { id: 'prestatario_nombre', label: 'Prestatario - Nombre Completo', type: 'text', required: true },
    { id: 'prestatario_cedula', label: 'Prestatario - Cédula', type: 'text', required: true },
    { id: 'prestatario_nacionalidad', label: 'Prestatario - Nacionalidad', type: 'text', required: true },
    { id: 'prestatario_estado_civil', label: 'Prestatario - Estado Civil', type: 'select', required: true,
      options: ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)', 'Unión libre'] },
    { id: 'prestatario_domicilio', label: 'Prestatario - Domicilio', type: 'textarea', required: true },
    
    // PRÉSTAMO
    { id: 'monto_prestamo', label: 'Monto del Préstamo', type: 'money', required: true, placeholder: '0.00' },
    { id: 'tasa_interes', label: 'Tasa de Interés Anual (%)', type: 'number', required: true },
    { id: 'plazo_meses', label: 'Plazo (meses)', type: 'number', required: true },
    { id: 'cuotas_mensuales', label: 'Cuotas Mensuales', type: 'money', required: true },
    { id: 'fecha_primer_pago', label: 'Fecha Primer Pago', type: 'date', required: true },
    
    // INMUEBLE HIPOTECADO
    { id: 'inmueble_descripcion', label: 'Descripción del Inmueble', type: 'textarea', required: true,
      helpText: 'Ubicación, linderos, área, matrícula del Registro de Títulos' },
    { id: 'inmueble_matricula', label: 'Matrícula del Registro de Títulos', type: 'text', required: true },
    { id: 'inmueble_valor', label: 'Valor del Inmueble', type: 'money', required: true },
    
    // CLÁUSULAS ESPECÍFICAS
    { id: 'clausula_mora', label: 'Cláusula de Mora', type: 'textarea', required: true },
    { id: 'clausula_vencimiento_anticipado', label: 'Cláusula de Vencimiento Anticipado', type: 'textarea', required: true },
    { id: 'clausula_garantia', label: 'Cláusula de la Garantía Hipotecaria', type: 'textarea', required: true },
    
    // TESTIGOS INSTRUMENTALES (obligatorios)
    { id: 'testigo1_nombre', label: 'Testigo 1 - Nombre Completo', type: 'text', required: true },
    { id: 'testigo1_cedula', label: 'Testigo 1 - Cédula', type: 'text', required: true },
    { id: 'testigo2_nombre', label: 'Testigo 2 - Nombre Completo', type: 'text', required: true },
    { id: 'testigo2_cedula', label: 'Testigo 2 - Cédula', type: 'text', required: true },
    
    // LECTURA Y FIRMAS
    { id: 'lectura_otorgada', label: '¿Se otorgó lectura?', type: 'select', required: true,
      options: ['Sí, en presencia de las partes', 'Se dispensó por conocimiento'] },
  ]
};

export const ACTA_NOTORIEDAD: NotarialActTemplate = {
  actId: 'acta_notoriedad',
  tipo_acto: 'autentico',
  titulo: 'Acta de Notoriedad',
  descripcion: 'Para acreditar hechos notorios (sucesiones, deslindes, identidad)',
  requiere_testigos: true,
  fields: [
    { id: 'numero_protocolo', label: 'Número de Protocolo', type: 'text', required: true },
    { id: 'fecha_instrumentacion', label: 'Fecha de Instrumentación', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'solicitante_nombre', label: 'Solicitante - Nombre Completo', type: 'text', required: true },
    { id: 'solicitante_cedula', label: 'Solicitante - Cédula', type: 'text', required: true },
    { id: 'solicitante_domicilio', label: 'Solicitante - Domicilio', type: 'textarea', required: true },
    
    { id: 'hecho_notorio', label: 'Hecho Notorio a Acreditar', type: 'textarea', required: true,
      helpText: 'Descripción del hecho que se pretende certificar como notorio' },
    
    { id: 'testigos_hecho', label: 'Testigos del Hecho (mínimo 3)', type: 'array', required: true,
      helpText: 'Nombres, cédulas y domicilios de al menos 3 testigos' },
    
    { id: 'declaraciones_testigos', label: 'Declaraciones de los Testigos', type: 'textarea', required: true },
    
    { id: 'testigo_instrumental_1', label: 'Testigo Instrumental 1', type: 'text', required: true },
    { id: 'testigo_instrumental_2', label: 'Testigo Instrumental 2', type: 'text', required: true },
  ]
};

// ============================================
// ACTOS BAJO FIRMA PRIVADA (Art. 6 Ley 140-15)
// ============================================

export const LEGALIZACION_FIRMAS: NotarialActTemplate = {
  actId: 'legalizacion_firmas',
  tipo_acto: 'firma_privada',
  titulo: 'Legalización de Firmas en Contrato',
  descripcion: 'Certificación de firma libre y voluntaria en documento privado',
  requiere_testigos: false,
  fields: [
    { id: 'numero_acta', label: 'Número de Acta', type: 'text', required: true },
    { id: 'fecha_legalizacion', label: 'Fecha de Legalización', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'tipo_documento', label: 'Tipo de Documento', type: 'select', required: true,
      options: ['Contrato de Venta', 'Contrato de Arrendamiento', 'Poder', 'Reconocimiento de Deuda', 'Otro'] },
    
    { id: 'firmante1_nombre', label: 'Firmante 1 - Nombre Completo', type: 'text', required: true },
    { id: 'firmante1_cedula', label: 'Firmante 1 - Cédula', type: 'text', required: true },
    { id: 'firmante1_domicilio', label: 'Firmante 1 - Domicilio', type: 'textarea', required: false },
    
    { id: 'firmante2_nombre', label: 'Firmante 2 - Nombre Completo', type: 'text', required: false },
    { id: 'firmante2_cedula', label: 'Firmante 2 - Cédula', type: 'text', required: false },
    
    { id: 'objeto_contrato', label: 'Objeto del Contrato', type: 'textarea', required: true,
      helpText: 'Breve descripción del contenido del documento' },
    
    { id: 'certificacion_firma', label: 'Certificación', type: 'textarea', required: true,
      placeholder: 'Certifico que las firmas fueron estampadas libremente en mi presencia...' },
  ]
};

export const PODER_ESPECIAL: NotarialActTemplate = {
  actId: 'poder_especial',
  tipo_acto: 'firma_privada',
  titulo: 'Poder Especial',
  descripcion: 'Poder limitado a actos específicos',
  requiere_testigos: false,
  fields: [
    { id: 'fecha', label: 'Fecha', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'poderdante_nombre', label: 'Poderdante - Nombre Completo', type: 'text', required: true },
    { id: 'poderdante_cedula', label: 'Poderdante - Cédula', type: 'text', required: true },
    { id: 'poderdante_domicilio', label: 'Poderdante - Domicilio', type: 'textarea', required: true },
    
    { id: 'apoderado_nombre', label: 'Apoderado - Nombre Completo', type: 'text', required: true },
    { id: 'apoderado_cedula', label: 'Apoderado - Cédula', type: 'text', required: true },
    
    { id: 'facultades', label: 'Facultades Conferidas', type: 'textarea', required: true,
      helpText: 'Enumerar específicamente los actos para los cuales se otorga el poder' },
    
    { id: 'duracion', label: 'Duración del Poder', type: 'text', required: false,
      placeholder: 'Ejemplo: hasta completar el trámite X' },
  ]
};

// ============================================
// DECLARACIONES UNILATERALES
// ============================================

export const DECLARACION_JURADA_PROPIEDAD: NotarialActTemplate = {
  actId: 'declaracion_jurada_propiedad',
  tipo_acto: 'declaracion_unilateral',
  titulo: 'Declaración Jurada de Única Propiedad',
  descripcion: 'Declaración unilateral sobre propiedad de bienes',
  requiere_testigos: false,
  fields: [
    { id: 'numero_acta', label: 'Número de Acta', type: 'text', required: true },
    { id: 'fecha', label: 'Fecha', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'declarante_nombre', label: 'Declarante - Nombre Completo', type: 'text', required: true },
    { id: 'declarante_cedula', label: 'Declarante - Cédula', type: 'text', required: true },
    { id: 'declarante_domicilio', label: 'Declarante - Domicilio', type: 'textarea', required: true },
    
    { id: 'objeto_declaracion', label: 'Objeto de la Declaración', type: 'textarea', required: true,
      helpText: 'Descripción del bien o situación sobre la cual se declara' },
    
    { id: 'contenido_declaracion', label: 'Contenido de la Declaración Jurada', type: 'textarea', required: true },
    
    { id: 'finalidad', label: 'Finalidad de la Declaración', type: 'text', required: true,
      placeholder: 'Ejemplo: Trámite de préstamo bancario' },
  ]
};

export const TESTAMENTO_AUTENTICO: NotarialActTemplate = {
  actId: 'testamento_autentico',
  tipo_acto: 'declaracion_unilateral',
  titulo: 'Acta de Testamento Auténtico',
  descripcion: 'Testamento otorgado ante notario (acto solemne)',
  requiere_testigos: true,
  fields: [
    { id: 'numero_protocolo', label: 'Número de Protocolo', type: 'text', required: true },
    { id: 'fecha_instrumentacion', label: 'Fecha de Instrumentación', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'testador_nombre', label: 'Testador - Nombre Completo', type: 'text', required: true },
    { id: 'testador_cedula', label: 'Testador - Cédula', type: 'text', required: true },
    { id: 'testador_nacionalidad', label: 'Testador - Nacionalidad', type: 'text', required: true },
    { id: 'testador_estado_civil', label: 'Testador - Estado Civil', type: 'select', required: true,
      options: ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)'] },
    { id: 'testador_domicilio', label: 'Testador - Domicilio', type: 'textarea', required: true },
    
    { id: 'disposiciones', label: 'Disposiciones Testamentarias', type: 'textarea', required: true,
      helpText: 'Legados, herederos, albacea, etc.' },
    
    { id: 'testigo1_nombre', label: 'Testigo 1 - Nombre Completo', type: 'text', required: true },
    { id: 'testigo1_cedula', label: 'Testigo 1 - Cédula', type: 'text', required: true },
    { id: 'testigo2_nombre', label: 'Testigo 2 - Nombre Completo', type: 'text', required: true },
    { id: 'testigo2_cedula', label: 'Testigo 2 - Cédula', type: 'text', required: true },
    
    { id: 'lectura_conferida', label: 'Lectura del Testamento', type: 'textarea', required: true,
      placeholder: 'Se dio lectura íntegra del testamento en presencia de...' },
  ]
};

// ============================================
// REGISTRO DE PLANTILLAS NOTARIALES
// ============================================

export const NOTARIAL_TEMPLATES_REGISTRY: Record<string, NotarialActTemplate> = {
  // Actos Auténticos
  'contrato_prestamo_hipoteca': CONTRATO_PRESTAMO_HIPOTECA,
  'acta_notoriedad': ACTA_NOTORIEDAD,
  
  // Firma Privada
  'legalizacion_firmas': LEGALIZACION_FIRMAS,
  'poder_especial': PODER_ESPECIAL,
  
  // Declaraciones Unilaterales
  'declaracion_jurada_propiedad': DECLARACION_JURADA_PROPIEDAD,
  'testamento_autentico': TESTAMENTO_AUTENTICO,
};

export function getNotarialTemplate(actId: string): NotarialActTemplate | null {
  return NOTARIAL_TEMPLATES_REGISTRY[actId] || null;
}

export function getNotarialTemplatesByType(tipo: 'autentico' | 'firma_privada' | 'declaracion_unilateral'): NotarialActTemplate[] {
  return Object.values(NOTARIAL_TEMPLATES_REGISTRY).filter(t => t.tipo_acto === tipo);
}
