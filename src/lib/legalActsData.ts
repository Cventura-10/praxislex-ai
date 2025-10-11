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
  { id: 'demanda_civil', name: 'Demanda Civil', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'emplazamiento', name: 'Emplazamiento', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'conclusiones', name: 'Conclusiones', type: 'judicial', hasIntake: false, hasManual: true },
  { id: 'acto_apelacion', name: 'Acto de Apelación', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'mandamiento_pago', name: 'Mandamiento de Pago', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'embargo_ejecutivo', name: 'Solicitud de Embargo Ejecutivo', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'referimiento', name: 'Instancia de Referimiento', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'desalojo', name: 'Demanda en Desalojo', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'interdiccion', name: 'Demanda en Interdicción', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'cobro_pesos', name: 'Demanda en Cobro de Pesos', type: 'judicial', hasIntake: true, hasManual: true },
];

const penalJudicialActs: LegalAct[] = [
  { id: 'querella_actor_civil', name: 'Querella con Actor Civil', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'acto_acusacion', name: 'Acto de Acusación', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'medidas_coercion', name: 'Solicitud de Medidas de Coerción', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'recurso_apelacion_penal', name: 'Recurso de Apelación Penal', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'recurso_casacion_penal', name: 'Recurso de Casación Penal', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'solicitud_libertad', name: 'Solicitud de Libertad', type: 'judicial', hasIntake: true, hasManual: true },
];

const laboralJudicialActs: LegalAct[] = [
  { id: 'demanda_laboral', name: 'Demanda Laboral', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'citacion_laboral', name: 'Acto de Citación Laboral', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'recurso_apelacion_laboral', name: 'Recurso de Apelación Laboral', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'terceria_laboral', name: 'Tercería Laboral', type: 'judicial', hasIntake: true, hasManual: true },
];

const administrativoJudicialActs: LegalAct[] = [
  { id: 'contencioso_administrativo', name: 'Demanda Contencioso-Administrativa', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'recurso_anulacion', name: 'Recurso de Anulación', type: 'judicial', hasIntake: true, hasManual: true },
  { id: 'amparo', name: 'Acción de Amparo', type: 'judicial', hasIntake: true, hasManual: true },
];

// ============================================
// ACTOS EXTRAJUDICIALES
// ============================================

const civilExtraJudicialActs: LegalAct[] = [
  { id: 'contrato_venta', name: 'Contrato de Venta', type: 'extrajudicial', hasIntake: true, hasManual: true },
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
