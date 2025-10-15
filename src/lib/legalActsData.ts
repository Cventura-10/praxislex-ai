// ============================================
// CLASIFICACIÓN JERÁRQUICA DE ACTOS PROCESALES
// República Dominicana
// ============================================

export type ActType = 'judicial' | 'extrajudicial';

export interface LegalAct {
  id: string;
  name: string;
  description?: string;
  type: ActType;
  hasIntake: boolean; // Tiene formulario de intake?
  hasManual: boolean; // Tiene plantilla manual?
}

export interface LegalMatter {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  acts: LegalAct[];
}

export interface LegalCategory {
  id: string;
  name: string;
  type: ActType;
  matters: LegalMatter[];
}

// ============================================
// ACTOS JUDICIALES
// ============================================

const civilJudicialActs: LegalAct[] = [
  // ACTOS DE TRASLADO (estructura: Alguacil + Emplazamiento)
  { id: 'emplazamiento', name: 'Emplazamiento Civil', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'citacion_civil', name: 'Citación Civil', type: 'judicial', hasIntake: true, hasManual: true },
  
  // ACTOS DE FONDO (estructura: Demanda completa)
  { id: 'demanda_civil', name: 'Demanda Civil', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'cobro_pesos', name: 'Demanda en Cobro de Pesos', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'responsabilidad_civil', name: 'Demanda en Responsabilidad Civil', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'resolucion_contrato', name: 'Demanda en Resolución de Contrato', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'desalojo', name: 'Demanda en Desalojo', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'interdiccion', name: 'Demanda en Interdicción', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'particion_bienes', name: 'Demanda en Partición de Bienes', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'saneamiento_titulo', name: 'Demanda en Saneamiento de Título', type: 'judicial', hasIntake: true, hasManual: true },
  
  // ESCRITOS Y DILIGENCIAS
  { id: 'conclusiones', name: 'Conclusiones', type: 'judicial', hasIntake: false, hasManual: true },
  { id: 'acto_apelacion', name: 'Acto de Apelación', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'mandamiento_pago', name: 'Mandamiento de Pago', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'embargo_ejecutivo', name: 'Solicitud de Embargo Ejecutivo', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'referimiento', name: 'Instancia de Referimiento', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'inventario_documentos', name: 'Inventario de Documentos', type: 'judicial', hasIntake: false, hasManual: true },
  { id: 'fijacion_audiencia', name: 'Solicitud de Fijación de Audiencia', type: 'judicial', hasIntake: false, hasManual: true },
];

const penalJudicialActs: LegalAct[] = [
  // ESCRITOS/INSTANCIAS (NO son actos de alguacil)
  { id: 'querella_penal', name: 'Querella con Constitución Actor Civil', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'querella_simple', name: 'Querella Simple', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'denuncia', name: 'Denuncia', type: 'judicial', hasIntake: true, hasManual: true },
  
  // SOLICITUDES
  { id: 'medidas_coercion', name: 'Solicitud de Medidas de Coerción', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'solicitud_libertad', name: 'Solicitud de Libertad', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'solicitud_archivo', name: 'Solicitud de Archivo', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'oposicion_no_ha_lugar', name: 'Oposición a No Ha Lugar', type: 'judicial', hasIntake: true, hasManual: true },
  
  // RECURSOS
  { id: 'recurso_apelacion_penal', name: 'Recurso de Apelación Penal', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'recurso_casacion_penal', name: 'Recurso de Casación Penal', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'recurso_revision', name: 'Recurso de Revisión de Sentencia', type: 'judicial', hasIntake: true, hasManual: true },
];

const laboralJudicialActs: LegalAct[] = [
  // ACTOS DE TRASLADO
  { id: 'citacion_laboral', name: 'Citación Laboral', type: 'judicial', hasIntake: true, hasManual: true },
  
  // DEMANDAS DE FONDO
  { id: 'demanda_laboral', name: 'Demanda Laboral por Despido Injustificado', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'demanda_dimision_justificada', name: 'Demanda por Dimisión Justificada', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'demanda_prestaciones', name: 'Demanda en Cobro de Prestaciones', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'demanda_reenganche', name: 'Demanda en Reenganche', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'demanda_accidente_trabajo', name: 'Demanda por Accidente de Trabajo', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'demanda_hostigamiento', name: 'Demanda por Hostigamiento Laboral', type: 'judicial', hasIntake: true, hasManual: true },
  
  // RECURSOS Y DILIGENCIAS
  { id: 'recurso_apelacion_laboral', name: 'Recurso de Apelación Laboral', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'terceria_laboral', name: 'Tercería Laboral', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'solicitud_desahucio', name: 'Solicitud de Desahucio', type: 'judicial', hasIntake: true, hasManual: true },
];

const administrativoJudicialActs: LegalAct[] = [
  // ACCIONES CONSTITUCIONALES Y ADMINISTRATIVAS
  { id: 'amparo', name: 'Acción de Amparo', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'contencioso_administrativo', name: 'Recurso Contencioso de Plena Jurisdicción', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'recurso_anulacion', name: 'Recurso de Anulación', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'medida_cautelar_admin', name: 'Solicitud de Medida Cautelar (Administrativo)', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'suspension_acto_admin', name: 'Demanda en Suspensión de Acto Administrativo', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'recurso_casacion_admin', name: 'Recurso de Casación Administrativo', type: 'judicial', hasIntake: true, hasManual: true },
];

// ============================================
// ACTOS EXTRAJUDICIALES
// ============================================

const civilExtraJudicialActs: LegalAct[] = [
  { id: 'contrato_venta_inmueble', name: 'Contrato de Compraventa de Inmueble', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'contrato_venta_mueble', name: 'Contrato de Compraventa de Mueble', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'contrato_alquiler', name: 'Contrato de Alquiler', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'poder_general', name: 'Poder General', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'poder_especial', name: 'Poder Especial', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'testamento', name: 'Testamento', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'declaracion_jurada', name: 'Declaración Jurada', type: 'extrajudicial', hasIntake: false, hasManual: true },
  { id: 'intimacion_pago', name: 'Intimación de Pago', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'notificacion_desalojo', name: 'Notificación de Desalojo', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'carta_cobranza', name: 'Carta de Cobranza', type: 'extrajudicial', hasIntake: true, hasManual: true },
];

const laboralExtraJudicialActs: LegalAct[] = [
  { id: 'contrato_trabajo', name: 'Contrato de Trabajo', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'carta_despido', name: 'Carta de Despido (Causa Justa)', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'carta_renuncia', name: 'Carta de Renuncia', type: 'extrajudicial', hasIntake: false, hasManual: true },
  { id: 'acta_conciliacion', name: 'Acta de Conciliación Laboral', type: 'extrajudicial', hasIntake: true, hasManual: true },
];

const administrativoExtraJudicialActs: LegalAct[] = [
  { id: 'solicitud_admin', name: 'Solicitud a la Administración', type: 'extrajudicial', hasIntake: false, hasManual: true },
  { id: 'recurso_reconsideracion', name: 'Recurso de Reconsideración', type: 'extrajudicial', hasIntake: true, hasManual: true },
];

// NUEVAS MATERIAS: Inmobiliaria, Juzgado de Paz, Municipal/Ambiental

const inmobiliariaJudicialActs: LegalAct[] = [
  { id: 'litis_derechos_registrados', name: 'Litis sobre Derechos Registrados', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'saneamiento_inmobiliario', name: 'Saneamiento (Ley 108-05)', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'deslinde', name: 'Deslinde', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'reclamacion_derechos_inmob', name: 'Reclamación de Derechos', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'fijacion_indemnizacion', name: 'Fijación de Indemnización', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'oposicion_saneamiento', name: 'Oposición a Saneamiento', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'recurso_revision_engan', name: 'Recurso de Revisión por Causa de Engaño', type: 'judicial', hasIntake: true, hasManual: true },
];

const juzgadoPazJudicialActs: LegalAct[] = [
  { id: 'desalojo_falta_pago', name: 'Desalojo por Falta de Pago', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'danos_propiedad', name: 'Daños a Propiedad', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'cobro_pesos_paz', name: 'Cobro de Pesos (Juzgado de Paz)', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'conciliacion', name: 'Solicitud de Conciliación', type: 'judicial', hasIntake: true, hasManual: true },
];

const juzgadoPazExtraJudicialActs: LegalAct[] = [
  { id: 'acta_notoriedad', name: 'Acta de Notoriedad', type: 'extrajudicial', hasIntake: true, hasManual: true },
];

const municipalAmbientalJudicialActs: LegalAct[] = [
  { id: 'contencioso_municipal', name: 'Recurso Contencioso Municipal', type: 'judicial', hasIntake: true, hasManual: true },
];

const municipalAmbientalExtraJudicialActs: LegalAct[] = [
  { id: 'denuncia_ambiental', name: 'Denuncia Ambiental', type: 'extrajudicial', hasIntake: true, hasManual: true },
  { id: 'recurso_jerarquico_municipal', name: 'Recurso Jerárquico ante Concejo Municipal', type: 'extrajudicial', hasIntake: true, hasManual: true },
];

// ============================================
// ESTRUCTURA JERÁRQUICA COMPLETA
// ============================================

export const LEGAL_CATEGORIES: LegalCategory[] = [
  {
    id: 'judicial',
    name: 'Actos Judiciales',
    type: 'judicial',
    matters: [
      { id: 'civil_comercial', name: 'Civil y Comercial', icon: 'Scale', acts: civilJudicialActs },
      { id: 'penal', name: 'Penal', icon: 'Gavel', acts: penalJudicialActs },
      { id: 'laboral', name: 'Laboral', icon: 'Briefcase', acts: laboralJudicialActs },
      { id: 'administrativo', name: 'Administrativo', icon: 'Building2', acts: administrativoJudicialActs },
      { id: 'inmobiliaria', name: 'Inmobiliaria y Tierras', icon: 'Home', acts: inmobiliariaJudicialActs },
      { id: 'juzgado_paz', name: 'Juzgado de Paz', icon: 'Scale', acts: juzgadoPazJudicialActs },
      { id: 'municipal_ambiental', name: 'Municipal y Ambiental', icon: 'TreePine', acts: municipalAmbientalJudicialActs },
    ],
  },
  {
    id: 'extrajudicial',
    name: 'Actos Extrajudiciales',
    type: 'extrajudicial',
    matters: [
      { id: 'civil_comercial_extra', name: 'Civil y Comercial', icon: 'FileText', acts: civilExtraJudicialActs },
      { id: 'laboral_extra', name: 'Laboral', icon: 'UserCheck', acts: laboralExtraJudicialActs },
      { id: 'administrativo_extra', name: 'Administrativo', icon: 'ClipboardList', acts: administrativoExtraJudicialActs },
      { id: 'juzgado_paz_extra', name: 'Juzgado de Paz', icon: 'FileCheck', acts: juzgadoPazExtraJudicialActs },
      { id: 'municipal_ambiental_extra', name: 'Municipal y Ambiental', icon: 'Leaf', acts: municipalAmbientalExtraJudicialActs },
    ],
  },
];

// Función helper para buscar actos
export function searchLegalActs(query: string): { category: string; matter: string; act: LegalAct }[] {
  const results: { category: string; matter: string; act: LegalAct }[] = [];
  const lowerQuery = query.toLowerCase();

  LEGAL_CATEGORIES.forEach((category) => {
    category.matters.forEach((matter) => {
      matter.acts.forEach((act) => {
        if (act.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            category: category.name,
            matter: matter.name,
            act,
          });
        }
      });
    });
  });

  return results;
}

// Función para obtener un acto específico por ID
export function findActById(actId: string): { category: LegalCategory; matter: LegalMatter; act: LegalAct } | null {
  for (const category of LEGAL_CATEGORIES) {
    for (const matter of category.matters) {
      const act = matter.acts.find((a) => a.id === actId);
      if (act) {
        return { category, matter, act };
      }
    }
  }
  return null;
}
