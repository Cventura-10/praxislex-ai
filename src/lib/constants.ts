// Materias jurídicas en República Dominicana
export const MATERIAS_JURIDICAS = [
  { value: "civil", label: "Civil" },
  { value: "penal", label: "Penal" },
  { value: "laboral", label: "Laboral" },
  { value: "trabajo", label: "Trabajo" },
  { value: "comercial", label: "Comercial" },
  { value: "familia", label: "Asuntos de Familia" },
  { value: "administrativo", label: "Contencioso Administrativo" },
  { value: "tributario", label: "Contencioso Tributario" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
  { value: "tierras", label: "Tierras" },
  { value: "reestructuracion", label: "Reestructuración" },
  { value: "electoral", label: "Electoral" },
  { value: "penal_laboral", label: "Penal-Laboral" },
  { value: "municipal", label: "Municipal" },
  { value: "nna", label: "Niños, Niñas y Adolescentes" },
  { value: "transito", label: "Tránsito" },
  { value: "constitucional", label: "Constitucional" },
  { value: "ambiental", label: "Ambiental" },
  { value: "propiedad_intelectual", label: "Propiedad Intelectual" },
  { value: "arbitraje", label: "Arbitraje" },
  { value: "migracion", label: "Migración" },
  { value: "notarial", label: "Notarial" },
  { value: "consumidor", label: "Protección al Consumidor" },
] as const;

// Tipos de acciones legales en República Dominicana (conforme Portal Poder Judicial)
export const TIPOS_ACCION_LEGAL = [
  { value: "accion_amparo", label: "Acción de Amparo" },
  { value: "habeas_corpus", label: "Acción de Habeas Corpus" },
  { value: "habeas_data", label: "Acción de Habeas Data" },
  { value: "accion_pauliana", label: "Acción Pauliana" },
  { value: "adquisicion", label: "Adquisición" },
  { value: "cancelacion_reduccion_hipoteca", label: "Cancelación y Reducción de Hipoteca" },
  { value: "cobro_pesos", label: "Cobro de Pesos" },
  { value: "cobro_alquileres", label: "Demanda Civil en Cobro de Alquileres" },
  { value: "danos_perjuicios", label: "Demanda en Daños y Perjuicios" },
  { value: "nulidad_asamblea", label: "Demanda en Nulidad de Asamblea" },
  { value: "nulidad_autorizacion_administrativa", label: "Demanda en Nulidad de Autorización Administrativa" },
  { value: "nulidad_resolucion_administrativa", label: "Demanda en Nulidad de Resolución Administrativa" },
  { value: "reclamacion_prestaciones", label: "Demanda en Reclamaciones de Prestaciones" },
  { value: "reclamacion_prestaciones_sociales", label: "Demanda en Reclamaciones de Prestaciones Sociales" },
  { value: "reivindicacion", label: "Demanda en Reivindicación" },
  { value: "demanda_incidental", label: "Demanda Incidental" },
  { value: "infraccion_propiedad_intelectual", label: "Demanda por Infracción de Derechos de Autor, Patentes y Marcas" },
  { value: "desecho_documento", label: "Desecho de Documento" },
  { value: "embargo_inmobiliario", label: "Embargo Inmobiliario" },
  { value: "embargo_inmobiliario_abreviado", label: "Embargo Inmobiliario Abreviado" },
  { value: "embargo_inmobiliario_derecho_comun", label: "Embargo Inmobiliario de Derecho Común" },
  { value: "embargo_inmobiliario_ordinario", label: "Embargo Inmobiliario Ordinario" },
  { value: "embargo_inmobiliario_demanda_incidental", label: "Embargo Inmobiliario y Demanda Incidental" },
  { value: "extincion", label: "Extinción" },
  { value: "interpretacion_contrato", label: "Interpretación de Contrato" },
  { value: "juramentacion_administrador", label: "Juramentación de Administrador Judicial" },
  { value: "juramentacion_notario", label: "Juramentación de Notario" },
  { value: "juramentacion_perito", label: "Juramentación de Perito" },
  { value: "levantamiento_bloqueo", label: "Levantamiento de Bloqueo" },
  { value: "liquidacion", label: "Liquidación" },
  { value: "liquidacion_estado_costas", label: "Liquidación de Estado de Costas y Honorarios" },
  { value: "modificacion_resolucion_actas", label: "Modificación de Resolución de Actas" },
  { value: "modificacion_pliego_condiciones", label: "Modificación o Reparo al Pliego de Condiciones" },
  { value: "notificacion_recurso_casacion", label: "Notificación de Recurso de Casación" },
  { value: "nulidad_acta_defuncion", label: "Nulidad de Acta de Defunción por Duplicidad" },
  { value: "nulidad_acta_nacimiento", label: "Nulidad de Acta de Nacimiento por Duplicidad" },
  { value: "oponibilidad_sentencia", label: "Oponibilidad de Sentencia" },
  { value: "pago_orden_acreedores", label: "Pago al Orden de los Acreedores" },
  { value: "pago_dinero", label: "Pago de Dinero" },
  { value: "pago_indebido", label: "Pago de lo Indebido" },
  { value: "recurso_administrativo_transito", label: "Recurso Administrativo Tránsito" },
  { value: "recurso_amparo_tributario", label: "Recurso Amparo Tributario" },
  { value: "recurso_contencioso_administrativo", label: "Recurso Contencioso Administrativo" },
  { value: "recurso_contencioso_electoral", label: "Recurso Contencioso Electoral" },
  { value: "recurso_contencioso_tributario", label: "Recurso Contencioso Tributario" },
  { value: "recurso_decisiones_disciplinarias", label: "Recurso Contra Decisiones Disciplinarias" },
  { value: "recurso_apelacion", label: "Recurso de Apelación" },
  { value: "recurso_apelacion_casacion", label: "Recurso de Apelación - Casación (con Reenvío)" },
  { value: "recurso_apelacion_declinado", label: "Recurso de Apelación - Declinado" },
  { value: "recurso_apelacion_referimientos", label: "Recurso de Apelación Contra Decisiones de Referimientos" },
  { value: "recurso_apelacion_in_voce", label: "Recurso de Apelación Contra Sentencia In-Voce" },
  { value: "recurso_apelacion_expediente_migrado", label: "Recurso de Apelación Expediente Migrado" },
  { value: "recurso_apelacion_incidental", label: "Recurso de Apelación Incidental" },
  { value: "recurso_casacion", label: "Recurso de Casación" },
  { value: "recurso_casacion_administrativo", label: "Recurso de Casación Administrativo" },
  { value: "recurso_casacion_civil", label: "Recurso de Casación Civil" },
  { value: "recurso_casacion_laboral", label: "Recurso de Casación Laboral" },
  { value: "recurso_impugnacion", label: "Recurso de Impugnación" },
  { value: "recurso_contredit", label: "Recurso de Impugnación o Le Contredit" },
  { value: "recurso_oposicion", label: "Recurso de Oposición" },
  { value: "recurso_reconsideracion", label: "Recurso de Reconsideración" },
  { value: "recurso_revision", label: "Recurso de Revisión" },
  { value: "recurso_revision_administrativo", label: "Recurso de Revisión Administrativo" },
  { value: "recurso_revision_civil", label: "Recurso de Revisión Civil" },
  { value: "recurso_revision_constitucional", label: "Recurso de Revisión Constitucional" },
  { value: "recurso_revision_penal", label: "Recurso de Revisión Penal" },
  { value: "recurso_revision_tributaria", label: "Recurso de Revisión Tributaria" },
  { value: "recurso_retardacion", label: "Recurso de Retardación" },
  { value: "recurso_responsabilidad_patrimonial", label: "Recurso de Responsabilidad Patrimonial" },
  { value: "recurso_tercerias", label: "Recurso de Tercerías" },
  { value: "recurso_tercerias_incidental", label: "Recurso de Tercerías Incidental" },
  { value: "recurso_tercerias_principal", label: "Recurso de Tercerías Principal" },
  { value: "recurso_revision_fraude", label: "Recurso de Revisión por Causa de Fraude" },
  { value: "recurso_jurisdiccional_tst", label: "Recurso Jurisdiccional - Contra Decisiones del TST" },
  { value: "recurso_jurisdiccional_mensuras", label: "Recurso Jurisdiccional - Contra Decisiones Dirección de Mensuras" },
  { value: "recurso_jurisdiccional_registro_titulos", label: "Recurso Jurisdiccional - Contra Decisiones Registro de Títulos" },
  { value: "recurso_jurisdiccional_tribunal", label: "Recurso Jurisdiccional Contra Decisión Tribunal" },
  { value: "referimiento", label: "Referimiento" },
  { value: "referimiento_expediente_recurso", label: "Referimiento de Expediente en Recurso - Presidencia TST" },
  { value: "rescision_contrato_alquiler", label: "Rescisión de Contrato de Alquiler por Falta de Pago" },
  { value: "restablecimiento_contrato", label: "Restablecimiento de Contrato" },
  { value: "revocacion_venta", label: "Revocación de Venta" },
  { value: "simulacion_cesion_credito", label: "Simulación de Cesión de Crédito" },
  { value: "suspension_ejecucion_sentencia", label: "Solicitud de Suspensión de Ejecución de Sentencia" },
  { value: "suspension_pagos", label: "Suspensión de Pagos" },
  { value: "suspension_efectos_pagare", label: "Suspensión de los Efectos de Pagaré Notarial" },
  { value: "validez_embargo_retentivo", label: "Validez de Embargo Retentivo" },
  { value: "verificacion_escrituras", label: "Verificación de Escrituras" },
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

// Categorías de gastos procesales
export const CATEGORIAS_GASTOS = [
  { value: "tasas_judiciales", label: "Tasas Judiciales" },
  { value: "timbres", label: "Timbres y Papel Sellado" },
  { value: "notificaciones", label: "Notificaciones y Alguacilazgo" },
  { value: "peritos", label: "Honorarios de Peritos" },
  { value: "traducciones", label: "Traducciones" },
  { value: "copias_certificadas", label: "Copias Certificadas" },
  { value: "publicaciones", label: "Publicaciones y Edictos" },
  { value: "transporte", label: "Transporte y Traslados" },
  { value: "depositos_garantia", label: "Depósitos y Garantías" },
  { value: "tramites_registrales", label: "Trámites Registrales" },
  { value: "investigaciones", label: "Investigaciones Privadas" },
  { value: "documentacion", label: "Obtención de Documentos" },
  { value: "mensajeria", label: "Mensajería y Courier" },
  { value: "papeleria", label: "Papelería y Materiales" },
  { value: "otros", label: "Otros Gastos" },
] as const;
