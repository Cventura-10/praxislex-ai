// Materias jurídicas en República Dominicana
export const MATERIAS_JURIDICAS = [
  { value: "civil", label: "Civil" },
  { value: "penal", label: "Penal" },
  { value: "laboral", label: "Laboral" },
  { value: "comercial", label: "Comercial" },
  { value: "familia", label: "Familia" },
  { value: "administrativo", label: "Contencioso Administrativo" },
  { value: "tierras", label: "Tierras" },
  { value: "nna", label: "Niños, Niñas y Adolescentes" },
  { value: "transito", label: "Tránsito" },
  { value: "tributario", label: "Tributario" },
  { value: "constitucional", label: "Constitucional" },
  { value: "ambiental", label: "Ambiental" },
  { value: "propiedad_intelectual", label: "Propiedad Intelectual" },
  { value: "inmobiliario", label: "Inmobiliario" },
  { value: "arbitraje", label: "Arbitraje" },
  { value: "migracion", label: "Migración" },
  { value: "notarial", label: "Notarial" },
  { value: "consumidor", label: "Protección al Consumidor" },
] as const;

// Órganos productores de jurisprudencia en RD
export const ORGANOS_JUDICIALES = [
  // Suprema Corte de Justicia
  { value: "scj_pleno", label: "Suprema Corte de Justicia - Pleno" },
  { value: "scj_1ra", label: "Suprema Corte - Primera Sala (Civil y Comercial)" },
  { value: "scj_2da", label: "Suprema Corte - Segunda Sala (Penal)" },
  { value: "scj_3ra", label: "Suprema Corte - Tercera Sala (Tierras, Laboral, Cont-Adm)" },
  
  // Tribunal Constitucional
  { value: "tc", label: "Tribunal Constitucional" },
  
  // Cortes de Apelación
  { value: "corte_apelacion_dn", label: "Corte de Apelación del Distrito Nacional" },
  { value: "corte_apelacion_santo_domingo", label: "Corte de Apelación de Santo Domingo" },
  { value: "corte_apelacion_santiago", label: "Corte de Apelación de Santiago" },
  { value: "corte_apelacion_san_francisco", label: "Corte de Apelación de San Francisco de Macorís" },
  { value: "corte_apelacion_la_vega", label: "Corte de Apelación de La Vega" },
  { value: "corte_apelacion_san_cristobal", label: "Corte de Apelación de San Cristóbal" },
  { value: "corte_apelacion_san_pedro", label: "Corte de Apelación de San Pedro de Macorís" },
  
  // Tribunales especializados
  { value: "tribunal_tierras", label: "Tribunal Superior de Tierras" },
  { value: "tribunal_laboral", label: "Tribunal Superior Laboral" },
  { value: "tribunal_administrativo", label: "Tribunal Superior Administrativo" },
  { value: "tribunal_nna", label: "Tribunal de Niños, Niñas y Adolescentes" },
  
  // Primera Instancia
  { value: "primera_instancia_dn", label: "Primera Instancia del Distrito Nacional" },
  { value: "primera_instancia_santo_domingo", label: "Primera Instancia de Santo Domingo" },
  { value: "primera_instancia_santiago", label: "Primera Instancia de Santiago" },
  
  // Juzgados de Paz
  { value: "juzgado_paz", label: "Juzgado de Paz" },
  
  // Otros
  { value: "camara_civil_comercial", label: "Cámara Civil y Comercial" },
  { value: "camara_penal", label: "Cámara Penal" },
] as const;

// Etapas procesales
export const ETAPAS_PROCESALES = [
  { value: "demanda", label: "Demanda" },
  { value: "contestacion", label: "Contestación" },
  { value: "excepciones", label: "Excepciones" },
  { value: "audiencia_preliminar", label: "Audiencia Preliminar" },
  { value: "pruebas", label: "Presentación de Pruebas" },
  { value: "alegatos", label: "Alegatos" },
  { value: "sentencia", label: "Sentencia" },
  { value: "apelacion", label: "Apelación" },
  { value: "casacion", label: "Casación" },
  { value: "ejecucion", label: "Ejecución" },
  { value: "archivado", label: "Archivado" },
] as const;

// Tipos de documentos
export const TIPOS_DOCUMENTO = [
  { value: "demanda", label: "Demanda" },
  { value: "contestacion", label: "Contestación" },
  { value: "escrito", label: "Escrito" },
  { value: "sentencia", label: "Sentencia" },
  { value: "recurso", label: "Recurso" },
  { value: "prueba", label: "Prueba" },
  { value: "anexo", label: "Anexo" },
  { value: "contrato", label: "Contrato" },
  { value: "poder", label: "Poder" },
  { value: "acta", label: "Acta" },
  { value: "dictamen", label: "Dictamen" },
  { value: "informe", label: "Informe" },
] as const;

// Estados de pago
export const ESTADOS_PAGO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "parcial", label: "Pago Parcial" },
  { value: "pagado", label: "Pagado" },
  { value: "vencido", label: "Vencido" },
  { value: "cancelado", label: "Cancelado" },
] as const;

// Métodos de pago
export const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia Bancaria" },
  { value: "cheque", label: "Cheque" },
  { value: "tarjeta", label: "Tarjeta de Crédito/Débito" },
  { value: "azul", label: "Azul" },
  { value: "cardnet", label: "CardNET" },
] as const;

// Tipos de cobro
export const TIPOS_COBRO = [
  { value: "honorarios", label: "Honorarios Profesionales" },
  { value: "gastos", label: "Gastos Procesales" },
  { value: "anticipo", label: "Anticipo" },
  { value: "igualas", label: "Igualas" },
  { value: "consultoria", label: "Consultoría" },
  { value: "otros", label: "Otros" },
] as const;
