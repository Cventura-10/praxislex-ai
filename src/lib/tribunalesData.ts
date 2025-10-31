/**
 * Base de datos completa de Tribunales de República Dominicana
 * Organizados por tipo y jurisdicción territorial
 */

export interface TribunalOption {
  value: string;
  label: string;
  categoria: string;
  provincia?: string;
  municipio?: string;
}

export const TRIBUNALES_REPUBLICA_DOMINICANA: TribunalOption[] = [
  // ============= TRIBUNAL CONSTITUCIONAL =============
  { 
    value: "tc_rd", 
    label: "Tribunal Constitucional de República Dominicana", 
    categoria: "constitucional",
    provincia: "Distrito Nacional"
  },

  // ============= CORTE SUPREMA DE JUSTICIA =============
  { 
    value: "csj_rd", 
    label: "Corte Suprema de Justicia (Suprema Corte)", 
    categoria: "suprema",
    provincia: "Distrito Nacional"
  },

  // ============= CORTES DE APELACIÓN =============
  // Distrito Nacional
  { 
    value: "ca_dn_civil", 
    label: "Corte de Apelación del Distrito Nacional - Civil y Comercial", 
    categoria: "apelacion",
    provincia: "Distrito Nacional"
  },
  { 
    value: "ca_dn_penal", 
    label: "Corte de Apelación del Distrito Nacional - Penal", 
    categoria: "apelacion",
    provincia: "Distrito Nacional"
  },
  { 
    value: "ca_dn_laboral", 
    label: "Corte de Apelación del Distrito Nacional - Laboral", 
    categoria: "apelacion",
    provincia: "Distrito Nacional"
  },
  { 
    value: "ca_dn_nna", 
    label: "Corte de Apelación del Distrito Nacional - Niños, Niñas y Adolescentes", 
    categoria: "apelacion",
    provincia: "Distrito Nacional"
  },

  // Santo Domingo
  { 
    value: "ca_sd_civil", 
    label: "Corte de Apelación de Santo Domingo - Civil y Comercial", 
    categoria: "apelacion",
    provincia: "Santo Domingo"
  },
  { 
    value: "ca_sd_penal", 
    label: "Corte de Apelación de Santo Domingo - Penal", 
    categoria: "apelacion",
    provincia: "Santo Domingo"
  },

  // Santiago
  { 
    value: "ca_stgo_civil", 
    label: "Corte de Apelación de Santiago - Civil y Comercial", 
    categoria: "apelacion",
    provincia: "Santiago"
  },
  { 
    value: "ca_stgo_penal", 
    label: "Corte de Apelación de Santiago - Penal", 
    categoria: "apelacion",
    provincia: "Santiago"
  },

  // San Cristóbal
  { 
    value: "ca_sc_civil", 
    label: "Corte de Apelación de San Cristóbal - Civil y Comercial", 
    categoria: "apelacion",
    provincia: "San Cristóbal"
  },

  // La Vega
  { 
    value: "ca_lv_civil", 
    label: "Corte de Apelación de La Vega - Civil y Comercial", 
    categoria: "apelacion",
    provincia: "La Vega"
  },

  // San Francisco de Macorís
  { 
    value: "ca_sfm_civil", 
    label: "Corte de Apelación de San Francisco de Macorís - Civil y Comercial", 
    categoria: "apelacion",
    provincia: "Duarte"
  },

  // San Pedro de Macorís
  { 
    value: "ca_spm_civil", 
    label: "Corte de Apelación de San Pedro de Macorís - Civil y Comercial", 
    categoria: "apelacion",
    provincia: "San Pedro de Macorís"
  },

  // ============= TRIBUNAL SUPERIOR ADMINISTRATIVO =============
  { 
    value: "tsa_rd", 
    label: "Tribunal Superior Administrativo (TSA)", 
    categoria: "administrativo",
    provincia: "Distrito Nacional"
  },

  // ============= TRIBUNAL SUPERIOR DE TIERRAS =============
  { 
    value: "tst_rd", 
    label: "Tribunal Superior de Tierras, Laboral, Contencioso-Administrativo y Contencioso-Tributario", 
    categoria: "tierras",
    provincia: "Distrito Nacional"
  },

  // ============= JUZGADOS DE PRIMERA INSTANCIA - DISTRITO NACIONAL =============
  // Civil y Comercial
  { 
    value: "jpi_dn_civil_1", 
    label: "Juzgado de Primera Instancia del Distrito Nacional - Civil y Comercial (Primera Sala)", 
    categoria: "primera_instancia",
    provincia: "Distrito Nacional"
  },
  { 
    value: "jpi_dn_civil_2", 
    label: "Juzgado de Primera Instancia del Distrito Nacional - Civil y Comercial (Segunda Sala)", 
    categoria: "primera_instancia",
    provincia: "Distrito Nacional"
  },
  { 
    value: "jpi_dn_civil_3", 
    label: "Juzgado de Primera Instancia del Distrito Nacional - Civil y Comercial (Tercera Sala)", 
    categoria: "primera_instancia",
    provincia: "Distrito Nacional"
  },
  { 
    value: "jpi_dn_civil_4", 
    label: "Juzgado de Primera Instancia del Distrito Nacional - Civil y Comercial (Cuarta Sala)", 
    categoria: "primera_instancia",
    provincia: "Distrito Nacional"
  },

  // Penal
  { 
    value: "jpi_dn_penal_1", 
    label: "Juzgado de Primera Instancia del Distrito Nacional - Penal (Primera Sala)", 
    categoria: "primera_instancia",
    provincia: "Distrito Nacional"
  },
  { 
    value: "jpi_dn_penal_2", 
    label: "Juzgado de Primera Instancia del Distrito Nacional - Penal (Segunda Sala)", 
    categoria: "primera_instancia",
    provincia: "Distrito Nacional"
  },

  // Trabajo
  { 
    value: "jt_dn_1", 
    label: "Juzgado de Trabajo del Distrito Nacional (Primera Sala)", 
    categoria: "trabajo",
    provincia: "Distrito Nacional"
  },
  { 
    value: "jt_dn_2", 
    label: "Juzgado de Trabajo del Distrito Nacional (Segunda Sala)", 
    categoria: "trabajo",
    provincia: "Distrito Nacional"
  },

  // Tierras
  { 
    value: "tt_dn", 
    label: "Tribunal de Tierras del Distrito Nacional", 
    categoria: "tierras",
    provincia: "Distrito Nacional"
  },

  // ============= JUZGADOS DE PRIMERA INSTANCIA - SANTO DOMINGO =============
  { 
    value: "jpi_sd_civil_1", 
    label: "Juzgado de Primera Instancia de Santo Domingo - Civil y Comercial (Primera Sala)", 
    categoria: "primera_instancia",
    provincia: "Santo Domingo"
  },
  { 
    value: "jpi_sd_civil_2", 
    label: "Juzgado de Primera Instancia de Santo Domingo - Civil y Comercial (Segunda Sala)", 
    categoria: "primera_instancia",
    provincia: "Santo Domingo"
  },
  { 
    value: "jpi_sd_penal", 
    label: "Juzgado de Primera Instancia de Santo Domingo - Penal", 
    categoria: "primera_instancia",
    provincia: "Santo Domingo"
  },
  { 
    value: "jt_sd", 
    label: "Juzgado de Trabajo de Santo Domingo", 
    categoria: "trabajo",
    provincia: "Santo Domingo"
  },
  { 
    value: "tt_sd", 
    label: "Tribunal de Tierras de Santo Domingo", 
    categoria: "tierras",
    provincia: "Santo Domingo"
  },

  // ============= JUZGADOS DE PRIMERA INSTANCIA - SANTIAGO =============
  { 
    value: "jpi_stgo_civil_1", 
    label: "Juzgado de Primera Instancia de Santiago - Civil y Comercial (Primera Sala)", 
    categoria: "primera_instancia",
    provincia: "Santiago"
  },
  { 
    value: "jpi_stgo_civil_2", 
    label: "Juzgado de Primera Instancia de Santiago - Civil y Comercial (Segunda Sala)", 
    categoria: "primera_instancia",
    provincia: "Santiago"
  },
  { 
    value: "jpi_stgo_penal", 
    label: "Juzgado de Primera Instancia de Santiago - Penal", 
    categoria: "primera_instancia",
    provincia: "Santiago"
  },
  { 
    value: "jt_stgo", 
    label: "Juzgado de Trabajo de Santiago", 
    categoria: "trabajo",
    provincia: "Santiago"
  },
  { 
    value: "tt_stgo", 
    label: "Tribunal de Tierras de Santiago", 
    categoria: "tierras",
    provincia: "Santiago"
  },

  // ============= JUZGADOS DE PRIMERA INSTANCIA - SAN CRISTÓBAL =============
  { 
    value: "jpi_sc_civil", 
    label: "Juzgado de Primera Instancia de San Cristóbal - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "San Cristóbal"
  },
  { 
    value: "jpi_sc_penal", 
    label: "Juzgado de Primera Instancia de San Cristóbal - Penal", 
    categoria: "primera_instancia",
    provincia: "San Cristóbal"
  },
  { 
    value: "jt_sc", 
    label: "Juzgado de Trabajo de San Cristóbal", 
    categoria: "trabajo",
    provincia: "San Cristóbal"
  },

  // ============= JUZGADOS DE PRIMERA INSTANCIA - LA VEGA =============
  { 
    value: "jpi_lv_civil", 
    label: "Juzgado de Primera Instancia de La Vega - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "La Vega"
  },
  { 
    value: "jpi_lv_penal", 
    label: "Juzgado de Primera Instancia de La Vega - Penal", 
    categoria: "primera_instancia",
    provincia: "La Vega"
  },
  { 
    value: "jt_lv", 
    label: "Juzgado de Trabajo de La Vega", 
    categoria: "trabajo",
    provincia: "La Vega"
  },

  // ============= JUZGADOS DE PRIMERA INSTANCIA - SAN PEDRO DE MACORÍS =============
  { 
    value: "jpi_spm_civil", 
    label: "Juzgado de Primera Instancia de San Pedro de Macorís - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "San Pedro de Macorís"
  },
  { 
    value: "jpi_spm_penal", 
    label: "Juzgado de Primera Instancia de San Pedro de Macorís - Penal", 
    categoria: "primera_instancia",
    provincia: "San Pedro de Macorís"
  },

  // ============= JUZGADOS DE PRIMERA INSTANCIA - SAN FRANCISCO DE MACORÍS =============
  { 
    value: "jpi_sfm_civil", 
    label: "Juzgado de Primera Instancia de San Francisco de Macorís - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Duarte"
  },
  { 
    value: "jpi_sfm_penal", 
    label: "Juzgado de Primera Instancia de San Francisco de Macorís - Penal", 
    categoria: "primera_instancia",
    provincia: "Duarte"
  },

  // ============= JUZGADOS DE PRIMERA INSTANCIA - OTRAS PROVINCIAS =============
  // Azua
  { 
    value: "jpi_azua_civil", 
    label: "Juzgado de Primera Instancia de Azua - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Azua"
  },

  // Barahona
  { 
    value: "jpi_barahona_civil", 
    label: "Juzgado de Primera Instancia de Barahona - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Barahona"
  },

  // El Seibo
  { 
    value: "jpi_seibo_civil", 
    label: "Juzgado de Primera Instancia de El Seibo - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "El Seibo"
  },

  // Espaillat
  { 
    value: "jpi_moca_civil", 
    label: "Juzgado de Primera Instancia de Moca - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Espaillat"
  },

  // Hato Mayor
  { 
    value: "jpi_hato_mayor_civil", 
    label: "Juzgado de Primera Instancia de Hato Mayor - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Hato Mayor"
  },

  // La Altagracia
  { 
    value: "jpi_higuey_civil", 
    label: "Juzgado de Primera Instancia de Higüey - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "La Altagracia"
  },

  // La Romana
  { 
    value: "jpi_romana_civil", 
    label: "Juzgado de Primera Instancia de La Romana - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "La Romana"
  },

  // Montecristi
  { 
    value: "jpi_montecristi_civil", 
    label: "Juzgado de Primera Instancia de Montecristi - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Montecristi"
  },

  // Puerto Plata
  { 
    value: "jpi_puerto_plata_civil", 
    label: "Juzgado de Primera Instancia de Puerto Plata - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Puerto Plata"
  },

  // Samaná
  { 
    value: "jpi_samana_civil", 
    label: "Juzgado de Primera Instancia de Samaná - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Samaná"
  },

  // Sánchez Ramírez
  { 
    value: "jpi_cotui_civil", 
    label: "Juzgado de Primera Instancia de Cotuí - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Sánchez Ramírez"
  },

  // Valverde
  { 
    value: "jpi_mao_civil", 
    label: "Juzgado de Primera Instancia de Mao - Civil y Comercial", 
    categoria: "primera_instancia",
    provincia: "Valverde"
  },

  // ============= JUZGADOS DE PAZ - DISTRITO NACIONAL =============
  { 
    value: "jpaz_dn_primera_circunscripcion", 
    label: "Juzgado de Paz del Distrito Nacional - Primera Circunscripción", 
    categoria: "paz",
    provincia: "Distrito Nacional"
  },
  { 
    value: "jpaz_dn_segunda_circunscripcion", 
    label: "Juzgado de Paz del Distrito Nacional - Segunda Circunscripción", 
    categoria: "paz",
    provincia: "Distrito Nacional"
  },
  { 
    value: "jpaz_dn_tercera_circunscripcion", 
    label: "Juzgado de Paz del Distrito Nacional - Tercera Circunscripción", 
    categoria: "paz",
    provincia: "Distrito Nacional"
  },

  // ============= JUZGADOS DE PAZ - SANTO DOMINGO =============
  { 
    value: "jpaz_sd_este", 
    label: "Juzgado de Paz de Santo Domingo Este", 
    categoria: "paz",
    provincia: "Santo Domingo"
  },
  { 
    value: "jpaz_sd_oeste", 
    label: "Juzgado de Paz de Santo Domingo Oeste", 
    categoria: "paz",
    provincia: "Santo Domingo"
  },
  { 
    value: "jpaz_sd_norte", 
    label: "Juzgado de Paz de Santo Domingo Norte", 
    categoria: "paz",
    provincia: "Santo Domingo"
  },
  { 
    value: "jpaz_boca_chica", 
    label: "Juzgado de Paz de Boca Chica", 
    categoria: "paz",
    provincia: "Santo Domingo"
  },

  // ============= JUZGADOS DE PAZ - SANTIAGO =============
  { 
    value: "jpaz_santiago", 
    label: "Juzgado de Paz de Santiago", 
    categoria: "paz",
    provincia: "Santiago"
  },

  // ============= JUZGADOS DE PAZ - OTRAS PROVINCIAS (SELECCIÓN) =============
  { 
    value: "jpaz_azua", 
    label: "Juzgado de Paz de Azua", 
    categoria: "paz",
    provincia: "Azua"
  },
  { 
    value: "jpaz_barahona", 
    label: "Juzgado de Paz de Barahona", 
    categoria: "paz",
    provincia: "Barahona"
  },
  { 
    value: "jpaz_higuey", 
    label: "Juzgado de Paz de Higüey", 
    categoria: "paz",
    provincia: "La Altagracia"
  },
  { 
    value: "jpaz_la_romana", 
    label: "Juzgado de Paz de La Romana", 
    categoria: "paz",
    provincia: "La Romana"
  },
  { 
    value: "jpaz_la_vega", 
    label: "Juzgado de Paz de La Vega", 
    categoria: "paz",
    provincia: "La Vega"
  },
  { 
    value: "jpaz_moca", 
    label: "Juzgado de Paz de Moca", 
    categoria: "paz",
    provincia: "Espaillat"
  },
  { 
    value: "jpaz_puerto_plata", 
    label: "Juzgado de Paz de Puerto Plata", 
    categoria: "paz",
    provincia: "Puerto Plata"
  },
  { 
    value: "jpaz_san_cristobal", 
    label: "Juzgado de Paz de San Cristóbal", 
    categoria: "paz",
    provincia: "San Cristóbal"
  },
  { 
    value: "jpaz_san_francisco", 
    label: "Juzgado de Paz de San Francisco de Macorís", 
    categoria: "paz",
    provincia: "Duarte"
  },
  { 
    value: "jpaz_san_pedro", 
    label: "Juzgado de Paz de San Pedro de Macorís", 
    categoria: "paz",
    provincia: "San Pedro de Macorís"
  },
];

/**
 * Filtra tribunales por categoría
 */
export function getTribunalesPorCategoria(categoria: string): TribunalOption[] {
  return TRIBUNALES_REPUBLICA_DOMINICANA.filter(t => t.categoria === categoria);
}

/**
 * Filtra tribunales por provincia
 */
export function getTribunalesPorProvincia(provincia: string): TribunalOption[] {
  return TRIBUNALES_REPUBLICA_DOMINICANA.filter(t => t.provincia === provincia);
}

/**
 * Busca tribunales por texto (búsqueda flexible)
 */
export function buscarTribunales(texto: string): TribunalOption[] {
  const textoLower = texto.toLowerCase();
  return TRIBUNALES_REPUBLICA_DOMINICANA.filter(t => 
    t.label.toLowerCase().includes(textoLower) ||
    t.provincia?.toLowerCase().includes(textoLower)
  );
}
