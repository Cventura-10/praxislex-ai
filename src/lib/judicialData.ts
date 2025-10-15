/**
 * Datos específicos del Sistema Judicial Dominicano
 * Para uso en formularios de intake de casos
 */

// ============= MATERIAS (Clasificación Corregida) =============

export const MATERIAS_JUDICIALES = [
  { value: "civil_comercial", label: "Civil y Comercial", categoria: "judicial" },
  { value: "penal", label: "Penal", categoria: "judicial" },
  { value: "laboral", label: "Laboral", categoria: "judicial" },
  { value: "administrativo", label: "Administrativo", categoria: "judicial" },
  { value: "inmobiliaria_tierras", label: "Inmobiliaria y Tierras", categoria: "judicial" },
  { value: "juzgado_paz", label: "Juzgado de Paz (Competencia Ampliada)", categoria: "judicial" },
  { value: "municipal_ambiental", label: "Municipal y Ambiental", categoria: "judicial" },
] as const;

export const MATERIAS_EXTRAJUDICIALES = [
  { value: "notarial_corporativo", label: "Derecho Notarial y Corporativo", categoria: "extrajudicial" },
  { value: "mediacion_conciliacion", label: "Manejo de Conflictos (Conciliación/Mediación)", categoria: "extrajudicial" },
] as const;

export const TODAS_MATERIAS = [...MATERIAS_JUDICIALES, ...MATERIAS_EXTRAJUDICIALES];

// ============= TIPOS DE ACCIÓN (Por Materia - Lógica Condicional) =============

export const ACCIONES_POR_MATERIA: Record<string, Array<{ value: string; label: string }>> = {
  // CIVIL Y COMERCIAL
  civil_comercial: [
    { value: "demanda_civil_cobro_alquileres", label: "Demanda Civil en Cobro de Alquileres" },
    { value: "demanda_danos_perjuicios", label: "Demanda en Daños y Perjuicios" },
    { value: "demanda_reivindicacion", label: "Demanda en Reivindicación" },
    { value: "demanda_nulidad_asamblea", label: "Demanda en Nulidad de Asamblea" },
    { value: "cobro_pesos", label: "Cobro de Pesos" },
    { value: "accion_pauliana", label: "Acción Pauliana" },
    { value: "rescision_contrato_alquiler", label: "Rescisión de Contrato de Alquiler por Falta de Pago" },
    { value: "pago_orden_acreedores", label: "Pago al Orden de los Acreedores" },
    { value: "validez_embargo_retentivo", label: "Validez de Embargo Retentivo" },
    { value: "embargo_inmobiliario", label: "Embargo Inmobiliario" },
    { value: "embargo_inmobiliario_abreviado", label: "Embargo Inmobiliario Abreviado" },
    { value: "suspension_pagos", label: "Suspensión de Pagos" },
    { value: "referimiento", label: "Referimiento" },
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

  // JUZGADO DE PAZ
  juzgado_paz: [
    { value: "cobro_pesos_paz", label: "Cobro de Pesos (Juzgado de Paz)" },
    { value: "desalojo_inquilino", label: "Demanda en Desalojo de Inquilino" },
    { value: "cobro_alquileres_paz", label: "Cobro de Alquileres (Juzgado de Paz)" },
    { value: "referimiento_paz", label: "Referimiento (Juzgado de Paz)" },
  ],

  // MUNICIPAL Y AMBIENTAL
  municipal_ambiental: [
    { value: "demanda_ambiental", label: "Demanda Ambiental" },
    { value: "recurso_municipal", label: "Recurso Municipal" },
  ],

  // NOTARIAL Y CORPORATIVO
  notarial_corporativo: [
    { value: "acta_notarial", label: "Acta Notarial" },
    { value: "constitucion_sociedad", label: "Constitución de Sociedad" },
    { value: "compraventa_inmueble", label: "Compraventa de Inmueble" },
    { value: "cancelacion_hipoteca", label: "Cancelación y Reducción de Hipoteca" },
  ],

  // MEDIACIÓN Y CONCILIACIÓN
  mediacion_conciliacion: [
    { value: "solicitud_mediacion", label: "Solicitud de Mediación" },
    { value: "solicitud_conciliacion", label: "Solicitud de Conciliación" },
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
