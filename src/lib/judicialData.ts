/**
 * Datos específicos del Sistema Judicial Dominicano
 * Para uso en formularios de intake de casos
 */

// ============= MATERIAS (Clasificación Corregida) =============

export const MATERIAS_JUDICIALES = [
  { value: "civil", label: "Civil", categoria: "judicial" },
  { value: "penal", label: "Penal", categoria: "judicial" },
  { value: "laboral", label: "Laboral", categoria: "judicial" },
  { value: "administrativo", label: "Administrativo", categoria: "judicial" },
  { value: "constitucional", label: "Constitucional", categoria: "judicial" },
  { value: "inmobiliario", label: "Inmobiliario y Tierras", categoria: "judicial" },
  { value: "familia", label: "Familia y Sucesiones", categoria: "judicial" },
  { value: "comercial", label: "Comercial", categoria: "judicial" },
  { value: "tributario", label: "Tributario", categoria: "judicial" },
  { value: "transito", label: "Tránsito", categoria: "judicial" },
  { value: "ambiental", label: "Ambiental", categoria: "judicial" },
  { value: "nna", label: "Niños, Niñas y Adolescentes", categoria: "judicial" },
  { value: "municipal", label: "Municipal", categoria: "judicial" },
] as const;

export const MATERIAS_EXTRAJUDICIALES = [
  { value: "notarial", label: "Notarial", categoria: "extrajudicial" },
  { value: "corporativo", label: "Corporativo", categoria: "extrajudicial" },
  { value: "contratos", label: "Contratos", categoria: "extrajudicial" },
  { value: "alquiler", label: "Alquiler y Arrendamiento", categoria: "extrajudicial" },
  { value: "compraventa", label: "Compraventa", categoria: "extrajudicial" },
  { value: "mediacion", label: "Mediación y Conciliación", categoria: "extrajudicial" },
  { value: "consultoria", label: "Consultoría Legal", categoria: "extrajudicial" },
  { value: "tramites", label: "Trámites Administrativos", categoria: "extrajudicial" },
  { value: "poderes", label: "Poderes y Mandatos", categoria: "extrajudicial" },
  { value: "testamentos", label: "Testamentos y Sucesiones", categoria: "extrajudicial" },
] as const;

export const TODAS_MATERIAS = [...MATERIAS_JUDICIALES, ...MATERIAS_EXTRAJUDICIALES];

// ============= TIPOS DE ACCIÓN (Por Materia - Lógica Condicional) =============

export const ACCIONES_POR_MATERIA: Record<string, Array<{ value: string; label: string }>> = {
  // CIVIL
  civil: [
    { value: "demanda_civil_cobro_pesos", label: "Cobro de Pesos" },
    { value: "demanda_danos_perjuicios", label: "Daños y Perjuicios" },
    { value: "demanda_reivindicacion", label: "Reivindicación" },
    { value: "accion_pauliana", label: "Acción Pauliana" },
    { value: "validez_embargo_retentivo", label: "Validez de Embargo Retentivo" },
    { value: "embargo_inmobiliario", label: "Embargo Inmobiliario" },
    { value: "referimiento", label: "Referimiento" },
    { value: "desalojo", label: "Desalojo" },
  ],

  // PENAL
  penal: [
    { value: "querella_penal", label: "Querella" },
    { value: "denuncia_penal", label: "Denuncia" },
    { value: "constitucion_actor_civil", label: "Constitución en Actor Civil" },
    { value: "habeas_corpus", label: "Acción de Habeas Corpus" },
    { value: "recurso_revision_penal", label: "Recurso de Revisión Penal" },
    { value: "recurso_apelacion_penal", label: "Recurso de Apelación - Sentencia Penal" },
  ],

  // LABORAL
  laboral: [
    { value: "demanda_despido_injustificado", label: "Demanda por Despido Injustificado" },
    { value: "demanda_prestaciones_laborales", label: "Demanda en Reclamaciones de Prestaciones Laborales" },
    { value: "demanda_prestaciones_sociales", label: "Demanda en Reclamaciones de Prestaciones Sociales" },
    { value: "restablecimiento_contrato", label: "Restablecimiento de Contrato" },
    { value: "recurso_casacion_laboral", label: "Recurso de Casación Laboral" },
  ],

  // ADMINISTRATIVO
  administrativo: [
    { value: "recurso_contencioso_administrativo", label: "Recurso Contencioso Administrativo" },
    { value: "demanda_nulidad_autorizacion_administrativa", label: "Demanda en Nulidad de Autorización Administrativa" },
    { value: "demanda_nulidad_resolucion_administrativa", label: "Demanda en Nulidad de Resolución Administrativa" },
    { value: "recurso_responsabilidad_patrimonial", label: "Recurso de Responsabilidad Patrimonial" },
    { value: "recurso_revision_administrativo", label: "Recurso de Revisión Administrativo" },
  ],

  // INMOBILIARIA Y TIERRAS
  inmobiliaria_tierras: [
    { value: "litis_sobre_derechos_registrados", label: "Litis sobre Derechos Registrados" },
    { value: "recurso_jurisdiccional_mensuras", label: "Recurso Jurisdiccional - Contra Decisiones Dirección de Mensuras" },
    { value: "recurso_jurisdiccional_registro_titulos", label: "Recurso Jurisdiccional - Contra Decisiones Registro de Títulos" },
    { value: "demanda_reivindicacion_inmueble", label: "Demanda en Reivindicación de Inmueble" },
  ],

  // COMERCIAL
  comercial: [
    { value: "demanda_nulidad_asamblea", label: "Nulidad de Asamblea" },
    { value: "suspension_pagos", label: "Suspensión de Pagos" },
    { value: "quiebra", label: "Declaratoria de Quiebra" },
    { value: "cobro_cheque", label: "Cobro de Cheque" },
  ],

  // FAMILIA
  familia: [
    { value: "divorcio", label: "Divorcio" },
    { value: "pension_alimenticia", label: "Pensión Alimenticia" },
    { value: "guarda_custodia", label: "Guarda y Custodia" },
    { value: "filiacion", label: "Filiación" },
    { value: "particion_bienes", label: "Partición de Bienes" },
  ],

  // NOTARIAL (Extrajudicial)
  notarial: [
    { value: "acta_notarial", label: "Acta Notarial" },
    { value: "protesto_cheque", label: "Protesto de Cheque" },
    { value: "certificacion_firma", label: "Certificación de Firma" },
    { value: "legalizacion_documentos", label: "Legalización de Documentos" },
  ],

  // CORPORATIVO (Extrajudicial)
  corporativo: [
    { value: "constitucion_sociedad", label: "Constitución de Sociedad" },
    { value: "modificacion_estatutos", label: "Modificación de Estatutos" },
    { value: "disolucion_liquidacion", label: "Disolución y Liquidación" },
    { value: "registro_mercantil", label: "Registro Mercantil" },
  ],

  // CONTRATOS (Extrajudicial)
  contratos: [
    { value: "redaccion_contrato", label: "Redacción de Contrato" },
    { value: "revision_contrato", label: "Revisión de Contrato" },
    { value: "negociacion_contrato", label: "Negociación de Contrato" },
  ],

  // ALQUILER (Extrajudicial)
  alquiler: [
    { value: "contrato_alquiler", label: "Contrato de Alquiler" },
    { value: "renovacion_contrato", label: "Renovación de Contrato" },
    { value: "terminacion_contrato", label: "Terminación de Contrato" },
    { value: "actualizacion_canon", label: "Actualización de Canon" },
  ],

  // COMPRAVENTA (Extrajudicial)
  compraventa: [
    { value: "compraventa_inmueble", label: "Compraventa de Inmueble" },
    { value: "compraventa_vehiculo", label: "Compraventa de Vehículo" },
    { value: "compraventa_empresa", label: "Compraventa de Empresa" },
    { value: "promesa_venta", label: "Promesa de Venta" },
  ],

  // MEDIACIÓN (Extrajudicial)
  mediacion: [
    { value: "solicitud_mediacion", label: "Solicitud de Mediación" },
    { value: "solicitud_conciliacion", label: "Solicitud de Conciliación" },
    { value: "acuerdo_extrajudicial", label: "Acuerdo Extrajudicial" },
  ],

  // CONSULTORÍA (Extrajudicial)
  consultoria: [
    { value: "opinion_legal", label: "Opinión Legal" },
    { value: "due_diligence", label: "Due Diligence" },
    { value: "asesoria_compliance", label: "Asesoría en Compliance" },
  ],

  // TRÁMITES (Extrajudicial)
  tramites: [
    { value: "apostilla", label: "Apostilla" },
    { value: "registro_marca", label: "Registro de Marca" },
    { value: "permiso_construccion", label: "Permiso de Construcción" },
  ],

  // PODERES (Extrajudicial)
  poderes: [
    { value: "poder_general", label: "Poder General" },
    { value: "poder_especial", label: "Poder Especial" },
    { value: "poder_irrevocable", label: "Poder Irrevocable" },
  ],

  // TESTAMENTOS (Extrajudicial)
  testamentos: [
    { value: "testamento_abierto", label: "Testamento Abierto" },
    { value: "testamento_cerrado", label: "Testamento Cerrado" },
    { value: "declaratoria_herederos", label: "Declaratoria de Herederos" },
    { value: "inventario_bienes", label: "Inventario de Bienes" },
  ],
};

// ============= TIPOS DE JUZGADOS/TRIBUNALES (Searchable Dropdown) =============

export const TIPOS_JUZGADOS = [
  // Juzgados de Paz
  { value: "juzgado_paz_civil", label: "Juzgado de Paz - Civil", categoria: "paz" },
  { value: "juzgado_paz_comercial", label: "Juzgado de Paz - Comercial", categoria: "paz" },
  { value: "juzgado_paz_inquilino", label: "Juzgado de Paz - Inquilino", categoria: "paz" },
  { value: "juzgado_paz_penal", label: "Juzgado de Paz - Penal", categoria: "paz" },
  
  // Primera Instancia
  { value: "camara_civil_comercial", label: "Juzgado de Primera Instancia / Cámaras Civiles y Comerciales", categoria: "primera_instancia" },
  { value: "camara_penal", label: "Juzgado de Primera Instancia / Cámaras Penales", categoria: "primera_instancia" },
  { value: "juzgado_instruccion", label: "Juzgado de Instrucción", categoria: "primera_instancia" },
  
  // Tierras
  { value: "tribunal_tierra_jurisdiccion_original", label: "Tribunal de Tierra (Jurisdicción Original)", categoria: "tierras" },
  { value: "tribunal_tierra_superior", label: "Tribunal de Tierra (Superior)", categoria: "tierras" },
  
  // Cortes de Apelación
  { value: "corte_apelacion_civil_comercial", label: "Corte de Apelación (Civil/Comercial)", categoria: "apelacion" },
  { value: "corte_apelacion_penal", label: "Corte de Apelación (Penal)", categoria: "apelacion" },
  { value: "corte_apelacion_laboral", label: "Corte de Apelación (Laboral)", categoria: "apelacion" },
  { value: "corte_apelacion_administrativa", label: "Corte de Apelación (Administrativa)", categoria: "apelacion" },
  
  // Tribunales Especializados
  { value: "tribunal_superior_administrativo", label: "Tribunal Superior Administrativo (TSA)", categoria: "especializado" },
  { value: "juzgado_trabajo", label: "Juzgado de Trabajo", categoria: "especializado" },
  
  // Altas Cortes
  { value: "suprema_corte_justicia", label: "Corte Suprema de Justicia (CSJ)", categoria: "alta_corte" },
  { value: "tribunal_constitucional", label: "Tribunal Constitucional (TC)", categoria: "alta_corte" },
] as const;

// ============= ETAPAS PROCESALES (Fases del Proceso) =============

export const ETAPAS_PROCESALES_DETALLADAS = [
  { value: "fase_inicial", label: "Fase Inicial (Intake y Análisis)", categoria: "inicio" },
  { value: "fase_traslado", label: "Fase de Traslado/Emplazamiento", categoria: "inicio" },
  { value: "fase_conciliacion", label: "Fase de Conciliación/Instrucción", categoria: "instruccion" },
  { value: "fase_fondo", label: "Fase de Fondo (Audiencias/Pruebas)", categoria: "fondo" },
  { value: "fase_recursos", label: "Fase de Recursos (Apelación/Casación)", categoria: "recursos" },
  { value: "fase_ejecucion", label: "Fase de Ejecución", categoria: "ejecucion" },
  { value: "caso_concluido", label: "Caso Concluido (Sentencia Definitiva)", categoria: "conclusion" },
] as const;

// ============= HELPERS =============

/**
 * Obtiene las acciones disponibles para una materia específica
 */
export function getAccionesPorMateria(materiaValue: string) {
  return ACCIONES_POR_MATERIA[materiaValue] || [];
}

/**
 * Filtra juzgados por categoría
 */
export function getJuzgadosPorCategoria(categoria: string) {
  return TIPOS_JUZGADOS.filter(j => j.categoria === categoria);
}
