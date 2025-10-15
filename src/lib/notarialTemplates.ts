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
// NUEVAS PLANTILLAS - EXPANSIÓN NOTARIAL
// ============================================

// 1. ACTA DE COMPROBACIÓN NOTARIAL (Levantamiento de hechos)
export const ACTA_COMPROBACION: NotarialActTemplate = {
  actId: 'acta_comprobacion_notarial',
  tipo_acto: 'autentico',
  titulo: 'Acta de Comprobación Notarial',
  descripcion: 'Levantamiento de hechos y comprobación de circunstancias por el notario',
  requiere_testigos: false,
  fields: [
    { id: 'numero_protocolo', label: 'Número de Protocolo', type: 'text', required: true },
    { id: 'fecha_instrumentacion', label: 'Fecha de Instrumentación', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'solicitante_nombre', label: 'Solicitante - Nombre Completo', type: 'text', required: true },
    { id: 'solicitante_cedula', label: 'Solicitante - Cédula', type: 'text', required: true },
    
    { id: 'lugar_comprobacion', label: 'Lugar de la Comprobación', type: 'textarea', required: true,
      helpText: 'Dirección exacta donde se realiza la comprobación' },
    
    { id: 'hechos_comprobados', label: 'Hechos Comprobados', type: 'textarea', required: true,
      helpText: 'Descripción detallada de los hechos verificados por el notario' },
    
    { id: 'finalidad_acta', label: 'Finalidad del Acta', type: 'text', required: true,
      placeholder: 'Ej. Para trámite judicial, administrativo, etc.' },
  ]
};

// 2. LEGALIZACIÓN DE FIRMA - CONTRATO DE COMPRAVENTA
export const LEGALIZACION_COMPRAVENTA: NotarialActTemplate = {
  actId: 'legalizacion_compraventa',
  tipo_acto: 'firma_privada',
  titulo: 'Legalización de Firma - Contrato de Compraventa',
  descripcion: 'Certificación de firmas en contrato de compraventa',
  requiere_testigos: false,
  fields: [
    { id: 'numero_acta', label: 'Número de Acta', type: 'text', required: true },
    { id: 'fecha_legalizacion', label: 'Fecha de Legalización', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    // Vendedor
    { id: 'vendedor_nombre', label: 'Vendedor - Nombre Completo', type: 'text', required: true },
    { id: 'vendedor_cedula', label: 'Vendedor - Cédula', type: 'text', required: true },
    
    // Comprador
    { id: 'comprador_nombre', label: 'Comprador - Nombre Completo', type: 'text', required: true },
    { id: 'comprador_cedula', label: 'Comprador - Cédula', type: 'text', required: true },
    
    // Objeto
    { id: 'objeto_venta', label: 'Objeto de la Venta', type: 'textarea', required: true,
      helpText: 'Descripción del bien vendido' },
    { id: 'precio_venta', label: 'Precio de Venta', type: 'money', required: true },
  ]
};

// 3. PODER GENERAL (Amplios poderes)
export const PODER_GENERAL: NotarialActTemplate = {
  actId: 'poder_general',
  tipo_acto: 'firma_privada',
  titulo: 'Poder General',
  descripcion: 'Poder amplísimo para administración de bienes',
  requiere_testigos: false,
  fields: [
    { id: 'fecha', label: 'Fecha', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'poderdante_nombre', label: 'Poderdante - Nombre Completo', type: 'text', required: true },
    { id: 'poderdante_cedula', label: 'Poderdante - Cédula', type: 'text', required: true },
    { id: 'poderdante_domicilio', label: 'Poderdante - Domicilio', type: 'textarea', required: true },
    
    { id: 'apoderado_nombre', label: 'Apoderado - Nombre Completo', type: 'text', required: true },
    { id: 'apoderado_cedula', label: 'Apoderado - Cédula', type: 'text', required: true },
    
    { id: 'ambito_poder', label: 'Ámbito del Poder', type: 'select', required: true,
      options: ['Administración general de bienes', 'Representación judicial', 'Actos comerciales', 'Todos los actos'] },
    
    { id: 'facultades_especificas', label: 'Facultades Específicas', type: 'textarea', required: true,
      helpText: 'Enumerar facultades adicionales' },
  ]
};

// 4. CESIÓN DE DERECHO
export const CESION_DERECHO: NotarialActTemplate = {
  actId: 'cesion_derecho',
  tipo_acto: 'firma_privada',
  titulo: 'Cesión de Derecho',
  descripcion: 'Transferencia de derechos entre partes',
  requiere_testigos: false,
  fields: [
    { id: 'fecha', label: 'Fecha', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'cedente_nombre', label: 'Cedente - Nombre Completo', type: 'text', required: true },
    { id: 'cedente_cedula', label: 'Cedente - Cédula', type: 'text', required: true },
    
    { id: 'cesionario_nombre', label: 'Cesionario - Nombre Completo', type: 'text', required: true },
    { id: 'cesionario_cedula', label: 'Cesionario - Cédula', type: 'text', required: true },
    
    { id: 'derecho_cedido', label: 'Derecho Cedido', type: 'textarea', required: true,
      helpText: 'Descripción del derecho que se transfiere' },
    
    { id: 'contraprestacion', label: 'Contraprestación', type: 'money', required: false,
      helpText: 'Precio o valor de la cesión (si aplica)' },
  ]
};

// 5. CESIÓN DE CRÉDITO
export const CESION_CREDITO: NotarialActTemplate = {
  actId: 'cesion_credito',
  tipo_acto: 'firma_privada',
  titulo: 'Cesión de Crédito',
  descripcion: 'Transferencia de crédito entre acreedor original y nuevo acreedor',
  requiere_testigos: false,
  fields: [
    { id: 'numero_acta', label: 'Número de Acta', type: 'text', required: true },
    { id: 'fecha', label: 'Fecha', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'cedente_nombre', label: 'Cedente (Acreedor Original) - Nombre', type: 'text', required: true },
    { id: 'cedente_cedula', label: 'Cedente - Cédula', type: 'text', required: true },
    
    { id: 'cesionario_nombre', label: 'Cesionario (Nuevo Acreedor) - Nombre', type: 'text', required: true },
    { id: 'cesionario_cedula', label: 'Cesionario - Cédula', type: 'text', required: true },
    
    { id: 'deudor_nombre', label: 'Deudor - Nombre Completo', type: 'text', required: true },
    
    { id: 'monto_credito', label: 'Monto del Crédito Cedido', type: 'money', required: true },
    { id: 'origen_credito', label: 'Origen del Crédito', type: 'textarea', required: true,
      helpText: 'Contrato, factura, préstamo, etc.' },
  ]
};

// 6. DETERMINACIÓN DE HEREDEROS (vía Acta de Notoriedad)
export const DETERMINACION_HEREDEROS: NotarialActTemplate = {
  actId: 'determinacion_herederos',
  tipo_acto: 'autentico',
  titulo: 'Determinación de Herederos',
  descripcion: 'Acta notarial para acreditar la calidad de herederos',
  requiere_testigos: true,
  fields: [
    { id: 'numero_protocolo', label: 'Número de Protocolo', type: 'text', required: true },
    { id: 'fecha_instrumentacion', label: 'Fecha', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    // Datos del De Cujus (fallecido)
    { id: 'decujus_nombre', label: 'De Cujus - Nombre Completo', type: 'text', required: true },
    { id: 'decujus_cedula', label: 'De Cujus - Cédula', type: 'text', required: true },
    { id: 'fecha_fallecimiento', label: 'Fecha de Fallecimiento', type: 'date', required: true },
    { id: 'lugar_fallecimiento', label: 'Lugar de Fallecimiento', type: 'text', required: true },
    
    // Requirentes (solicitantes del acta)
    { id: 'requirentes', label: 'Requirentes (Herederos que solicitan)', type: 'array', required: true,
      helpText: 'Nombres, cédulas y parentesco de los requirentes' },
    
    { id: 'herederos_determinados', label: 'Herederos Determinados', type: 'textarea', required: true,
      helpText: 'Lista completa de herederos con su parentesco' },
    
    // Testigos del hecho notorio
    { id: 'testigo1_nombre', label: 'Testigo 1 - Nombre', type: 'text', required: true },
    { id: 'testigo1_cedula', label: 'Testigo 1 - Cédula', type: 'text', required: true },
    { id: 'testigo2_nombre', label: 'Testigo 2 - Nombre', type: 'text', required: true },
    { id: 'testigo2_cedula', label: 'Testigo 2 - Cédula', type: 'text', required: true },
    { id: 'testigo3_nombre', label: 'Testigo 3 - Nombre', type: 'text', required: true },
    { id: 'testigo3_cedula', label: 'Testigo 3 - Cédula', type: 'text', required: true },
  ]
};

// 7. DECLARACIÓN JURADA DE SOLTERÍA / ESTADO CIVIL
export const DECLARACION_SOLTERIA: NotarialActTemplate = {
  actId: 'declaracion_solteria',
  tipo_acto: 'declaracion_unilateral',
  titulo: 'Declaración Jurada de Soltería',
  descripcion: 'Declaración unilateral sobre el estado civil',
  requiere_testigos: false,
  fields: [
    { id: 'numero_acta', label: 'Número de Acta', type: 'text', required: true },
    { id: 'fecha', label: 'Fecha', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'declarante_nombre', label: 'Declarante - Nombre Completo', type: 'text', required: true },
    { id: 'declarante_cedula', label: 'Declarante - Cédula', type: 'text', required: true },
    { id: 'declarante_domicilio', label: 'Declarante - Domicilio', type: 'textarea', required: true },
    { id: 'declarante_nacionalidad', label: 'Declarante - Nacionalidad', type: 'text', required: true },
    
    { id: 'estado_civil_declarado', label: 'Estado Civil', type: 'select', required: true,
      options: ['Soltero(a)', 'Divorciado(a)', 'Viudo(a)'] },
    
    { id: 'finalidad', label: 'Finalidad de la Declaración', type: 'text', required: true,
      placeholder: 'Ej. Trámite matrimonial, visa, etc.' },
  ]
};

// 8-10: TRES ACTOS ADICIONALES (para completar los 10 solicitados)

export const CONTRATO_ARRENDAMIENTO_NOTARIAL: NotarialActTemplate = {
  actId: 'contrato_arrendamiento',
  tipo_acto: 'firma_privada',
  titulo: 'Legalización - Contrato de Arrendamiento',
  descripcion: 'Legalización de firmas en contrato de alquiler',
  requiere_testigos: false,
  fields: [
    { id: 'fecha', label: 'Fecha', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'arrendador_nombre', label: 'Arrendador - Nombre', type: 'text', required: true },
    { id: 'arrendador_cedula', label: 'Arrendador - Cédula', type: 'text', required: true },
    
    { id: 'arrendatario_nombre', label: 'Arrendatario - Nombre', type: 'text', required: true },
    { id: 'arrendatario_cedula', label: 'Arrendatario - Cédula', type: 'text', required: true },
    
    { id: 'inmueble_arrendado', label: 'Inmueble Arrendado', type: 'textarea', required: true },
    { id: 'renta_mensual', label: 'Renta Mensual', type: 'money', required: true },
    { id: 'plazo_arrendamiento', label: 'Plazo', type: 'text', required: true, placeholder: 'Ej. 12 meses' },
  ]
};

export const RECONOCIMIENTO_DEUDA: NotarialActTemplate = {
  actId: 'reconocimiento_deuda',
  tipo_acto: 'firma_privada',
  titulo: 'Reconocimiento de Deuda',
  descripcion: 'Legalización de reconocimiento de adeudo',
  requiere_testigos: false,
  fields: [
    { id: 'fecha', label: 'Fecha', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'deudor_nombre', label: 'Deudor - Nombre Completo', type: 'text', required: true },
    { id: 'deudor_cedula', label: 'Deudor - Cédula', type: 'text', required: true },
    
    { id: 'acreedor_nombre', label: 'Acreedor - Nombre Completo', type: 'text', required: true },
    { id: 'acreedor_cedula', label: 'Acreedor - Cédula', type: 'text', required: true },
    
    { id: 'monto_deuda', label: 'Monto de la Deuda', type: 'money', required: true },
    { id: 'origen_deuda', label: 'Origen de la Deuda', type: 'textarea', required: true },
    { id: 'plan_pago', label: 'Plan de Pago', type: 'textarea', required: false },
  ]
};

export const ACTA_PROTESTO: NotarialActTemplate = {
  actId: 'acta_protesto',
  tipo_acto: 'autentico',
  titulo: 'Acta de Protesto',
  descripcion: 'Protesto de títulos valores (cheques, letras)',
  requiere_testigos: false,
  fields: [
    { id: 'numero_protocolo', label: 'Número de Protocolo', type: 'text', required: true },
    { id: 'fecha', label: 'Fecha del Protesto', type: 'date', required: true },
    { id: 'ciudad', label: 'Ciudad', type: 'text', required: true },
    
    { id: 'tenedor_nombre', label: 'Tenedor del Título - Nombre', type: 'text', required: true },
    { id: 'tenedor_cedula', label: 'Tenedor - Cédula', type: 'text', required: true },
    
    { id: 'tipo_titulo', label: 'Tipo de Título', type: 'select', required: true,
      options: ['Cheque', 'Letra de Cambio', 'Pagaré'] },
    
    { id: 'numero_titulo', label: 'Número del Título', type: 'text', required: true },
    { id: 'monto_titulo', label: 'Monto', type: 'money', required: true },
    { id: 'librado_nombre', label: 'Librado/Girado - Nombre', type: 'text', required: true },
    
    { id: 'motivo_protesto', label: 'Motivo del Protesto', type: 'select', required: true,
      options: ['Falta de pago', 'Falta de aceptación', 'Otro'] },
  ]
};

// ============================================
// REGISTRO DE PLANTILLAS NOTARIALES
// ============================================

export const NOTARIAL_TEMPLATES_REGISTRY: Record<string, NotarialActTemplate> = {
  // Actos Auténticos
  'contrato_prestamo_hipoteca': CONTRATO_PRESTAMO_HIPOTECA,
  'acta_notoriedad': ACTA_NOTORIEDAD,
  'acta_comprobacion_notarial': ACTA_COMPROBACION,
  'determinacion_herederos': DETERMINACION_HEREDEROS,
  'acta_protesto': ACTA_PROTESTO,
  
  // Firma Privada
  'legalizacion_firmas': LEGALIZACION_FIRMAS,
  'legalizacion_compraventa': LEGALIZACION_COMPRAVENTA,
  'poder_especial': PODER_ESPECIAL,
  'poder_general': PODER_GENERAL,
  'cesion_derecho': CESION_DERECHO,
  'cesion_credito': CESION_CREDITO,
  'contrato_arrendamiento': CONTRATO_ARRENDAMIENTO_NOTARIAL,
  'reconocimiento_deuda': RECONOCIMIENTO_DEUDA,
  
  // Declaraciones Unilaterales
  'declaracion_jurada_propiedad': DECLARACION_JURADA_PROPIEDAD,
  'declaracion_solteria': DECLARACION_SOLTERIA,
  'testamento_autentico': TESTAMENTO_AUTENTICO,
};

export function getNotarialTemplate(actId: string): NotarialActTemplate | null {
  return NOTARIAL_TEMPLATES_REGISTRY[actId] || null;
}

export function getNotarialTemplatesByType(tipo: 'autentico' | 'firma_privada' | 'declaracion_unilateral'): NotarialActTemplate[] {
  return Object.values(NOTARIAL_TEMPLATES_REGISTRY).filter(t => t.tipo_acto === tipo);
}
