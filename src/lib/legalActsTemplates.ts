/**
 * PLANTILLAS DE ACTOS PROCESALES - PRAXISLEX
 * Clasificación: Judicial vs Extrajudicial
 * Basado en estructura procesal dominicana
 */

export type TemplateKind = 
  | 'procesal_portada'      // Demandas, recursos con portada procesal
  | 'procesal_alguacil'     // Emplazamientos, mandamientos
  | 'procesal_conclusion'   // Conclusiones sin diligencias
  | 'extrajudicial_contrato' // Contratos
  | 'extrajudicial_carta';   // Cartas, intimaciones

export interface ActField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'array';
  required: boolean;
  validation?: string;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface LegalActTemplate {
  actId: string;
  templateKind: TemplateKind;
  fields: ActField[];
  validators?: {
    fieldId: string;
    rule: (value: any, allFields: Record<string, any>) => boolean | string;
  }[];
}

// ============================================
// PLANTILLA CANÓNICA: DEMANDA CIVIL
// En devolución de valores / daños y perjuicios
// ============================================

export const DEMANDA_CIVIL_TEMPLATE: LegalActTemplate = {
  actId: 'demanda_civil',
  templateKind: 'procesal_portada',
  fields: [
    // IDENTIFICACIÓN DEL ACTO
    { id: 'numero_acto', label: 'Número de Acto', type: 'text', required: true, placeholder: '2025-001' },
    { id: 'folios', label: 'Folios', type: 'number', required: true, placeholder: '15' },
    { id: 'ciudad_actuacion', label: 'Ciudad de Actuación', type: 'text', required: true, placeholder: 'Santo Domingo' },
    { id: 'provincia_actuacion', label: 'Provincia', type: 'text', required: true, placeholder: 'Distrito Nacional' },
    { id: 'fecha_acto', label: 'Fecha del Acto', type: 'date', required: true },

    // PARTES - DEMANDANTE
    { id: 'demandante_identificacion_completa', label: 'Identificación Completa del Demandante', type: 'textarea', required: true, 
      placeholder: 'Nombre completo, nacionalidad, estado civil, cédula/RNC, domicilio' },
    
    // PARTES - DEMANDADOS (array)
    { id: 'demandados_lista', label: 'Lista de Demandados', type: 'array', required: true,
      helpText: 'Agregar cada demandado con identificación completa' },

    // DOMICILIO PROCESAL
    { id: 'domicilio_procesal', label: 'Elección de Domicilio Procesal', type: 'textarea', required: true },

    // ABOGADO
    { id: 'abogado_nombre', label: 'Nombre del Abogado', type: 'text', required: true },
    { id: 'abogado_matricula', label: 'Matrícula CARD', type: 'text', required: true },
    { id: 'abogado_cedula', label: 'Cédula del Abogado', type: 'text', required: true },
    { id: 'abogado_estudio', label: 'Dirección del Estudio', type: 'textarea', required: true },
    { id: 'abogado_contacto', label: 'Contacto (Teléfono/Email)', type: 'text', required: true },

    // MINISTERIO Y ALGUACIL
    { id: 'mandato_texto', label: 'Texto del Mandato', type: 'textarea', required: true,
      placeholder: 'Yo [nombre del alguacil], debidamente nombrado, recibido y juramentado...' },
    
    { id: 'traslados_enumerados', label: 'Traslados del Alguacil', type: 'array', required: true,
      helpText: 'Al menos un traslado por demandado: domicilio, receptor, cargo, fecha/hora' },

    { id: 'emplazamiento_texto', label: 'Texto del Emplazamiento', type: 'textarea', required: true },
    { id: 'tribunal_competente', label: 'Tribunal Competente', type: 'text', required: true },
    { id: 'ubicacion_tribunal', label: 'Ubicación del Tribunal', type: 'text', required: true },
    { id: 'octava_franca_fecha_limite', label: 'Fecha Límite Octava Franca', type: 'date', required: true },

    // SÍNTESIS
    { id: 'proposito_breve', label: 'Propósito Breve de la Demanda', type: 'textarea', required: true,
      placeholder: 'Síntesis de la pretensión principal' },

    // HECHOS
    { id: 'hechos_detallados', label: 'Relato Fáctico Detallado', type: 'textarea', required: true,
      helpText: 'Narración cronológica con contratos, pagos, incumplimientos' },

    // DERECHO - JERARQUÍA NORMATIVA
    { id: 'fundamento_bloque_constitucional', label: 'Bloque Constitucional', type: 'array', required: false,
      helpText: 'Artículos de la Constitución con texto literal' },
    { id: 'fundamento_tratados', label: 'Tratados Internacionales', type: 'array', required: false },
    { id: 'fundamento_codigos', label: 'Códigos y Leyes', type: 'array', required: true },
    { id: 'otras_normas', label: 'Otras Normas Aplicables', type: 'array', required: false },

    // TESIS Y SUBSUNCIÓN
    { id: 'tesis_argumental', label: 'Tesis de Derecho', type: 'textarea', required: true },
    { id: 'subsuncion_hechos_norma', label: 'Subsunción Hechos-Norma', type: 'textarea', required: true },
    { id: 'citas_jurisprudenciales', label: 'Citas Jurisprudenciales', type: 'array', required: false },
    { id: 'citas_doctrina', label: 'Citas de Doctrina', type: 'array', required: false },

    // DISPOSITIVO
    { id: 'petitorio_items', label: 'Peticiones (Dispositivo)', type: 'array', required: true,
      helpText: 'Validez procesal, comprobación, condenas con montos' },
    { id: 'costas_texto', label: 'Costas y Distracción', type: 'textarea', required: true },

    // DECLARACIÓN MINISTERIAL
    { id: 'recibido_por', label: 'Recibido por (Ministerial)', type: 'text', required: false },
    { id: 'folios_totales', label: 'Folios Totales', type: 'number', required: false },
    { id: 'hora_inicio', label: 'Hora Inicio', type: 'text', required: false },
    { id: 'hora_fin', label: 'Hora Fin', type: 'text', required: false },
    { id: 'costo_actuacion', label: 'Costo de Actuación', type: 'text', required: false },
    { id: 'certificacion_ministerial', label: 'Certificación del Ministerial', type: 'textarea', required: false },
  ],
  validators: [
    {
      fieldId: 'traslados_enumerados',
      rule: (value, allFields) => {
        if (!Array.isArray(value) || value.length === 0) {
          return 'Debe haber al menos un traslado por demandado';
        }
        return true;
      }
    },
    {
      fieldId: 'fundamento_codigos',
      rule: (value) => {
        if (!Array.isArray(value) || value.length === 0) {
          return 'Debe citar al menos una norma legal';
        }
        return true;
      }
    }
  ]
};

// ============================================
// PLANTILLA: CONCLUSIONES
// Sin número de acto ni diligencias
// ============================================

export const CONCLUSIONES_TEMPLATE: LegalActTemplate = {
  actId: 'conclusiones',
  templateKind: 'procesal_conclusion',
  fields: [
    { id: 'tribunal', label: 'Tribunal', type: 'text', required: true },
    { id: 'expediente', label: 'Expediente', type: 'text', required: true },
    { id: 'partes', label: 'Partes', type: 'textarea', required: true },
    { id: 'hechos_probados', label: 'Hechos Probados', type: 'textarea', required: true },
    { id: 'medios_derecho', label: 'Medios de Derecho', type: 'textarea', required: true },
    { id: 'conclusiones_finales', label: 'Conclusiones Finales', type: 'array', required: true },
    { id: 'costas', label: 'Costas', type: 'text', required: true },
  ]
};

// ============================================
// PLANTILLA: CONTRATO (EXTRAJUDICIAL)
// Partes + Objeto + Cláusulas
// ============================================

export const CONTRATO_VENTA_TEMPLATE: LegalActTemplate = {
  actId: 'contrato_venta',
  templateKind: 'extrajudicial_contrato',
  fields: [
    { id: 'titulo_contrato', label: 'Título del Contrato', type: 'text', required: true },
    { id: 'fecha_contrato', label: 'Fecha', type: 'date', required: true },
    { id: 'lugar_celebracion', label: 'Lugar de Celebración', type: 'text', required: true },
    
    // PARTES (no demandante/demandado)
    { id: 'parte_vendedor', label: 'Vendedor (Identificación)', type: 'textarea', required: true },
    { id: 'parte_comprador', label: 'Comprador (Identificación)', type: 'textarea', required: true },

    // OBJETO
    { id: 'objeto_contrato', label: 'Objeto del Contrato', type: 'textarea', required: true },
    { id: 'descripcion_bien', label: 'Descripción del Bien', type: 'textarea', required: true },
    { id: 'precio', label: 'Precio', type: 'number', required: true },

    // CLÁUSULAS
    { id: 'clausulas', label: 'Cláusulas', type: 'array', required: true },
    { id: 'forma_pago', label: 'Forma de Pago', type: 'text', required: true },
    { id: 'garantias', label: 'Garantías', type: 'textarea', required: false },
    
    // CIERRE
    { id: 'jurisdiccion', label: 'Jurisdicción', type: 'text', required: true },
    { id: 'firmas', label: 'Firmas', type: 'array', required: true },
  ]
};

// ============================================
// PLANTILLA: CARTA DE COBRANZA (EXTRAJUDICIAL)
// ============================================

export const CARTA_COBRANZA_TEMPLATE: LegalActTemplate = {
  actId: 'carta_cobranza',
  templateKind: 'extrajudicial_carta',
  fields: [
    { id: 'fecha_carta', label: 'Fecha', type: 'date', required: true },
    { id: 'destinatario', label: 'Destinatario', type: 'textarea', required: true },
    { id: 'asunto', label: 'Asunto', type: 'text', required: true },
    { id: 'antecedentes', label: 'Antecedentes', type: 'textarea', required: true },
    { id: 'deuda_monto', label: 'Monto de la Deuda', type: 'number', required: true },
    { id: 'plazo_pago', label: 'Plazo para Pago', type: 'text', required: true },
    { id: 'consecuencias', label: 'Consecuencias del Incumplimiento', type: 'textarea', required: true },
    { id: 'firma_remitente', label: 'Firma del Remitente', type: 'text', required: true },
  ]
};

// ============================================
// REGISTRO DE PLANTILLAS
// ============================================

export const TEMPLATES_REGISTRY: Record<string, LegalActTemplate> = {
  'demanda_civil': DEMANDA_CIVIL_TEMPLATE,
  'conclusiones': CONCLUSIONES_TEMPLATE,
  'contrato_venta': CONTRATO_VENTA_TEMPLATE,
  'carta_cobranza': CARTA_COBRANZA_TEMPLATE,
};

export function getTemplateForAct(actId: string): LegalActTemplate | null {
  return TEMPLATES_REGISTRY[actId] || null;
}

export function getTemplateKind(actId: string): TemplateKind | null {
  const template = getTemplateForAct(actId);
  return template?.templateKind || null;
}
