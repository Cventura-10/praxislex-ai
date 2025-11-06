// ============================================
// GENERADOR AUTOMÁTICO DE CATÁLOGO DE ACTOS
// Desde praxislex_bundle_v1_3_1.json
// ============================================

import { praxisLexBundle, getAllSlugs, type LegalActBundle } from './legalActsBundle';

export type ActType = 'judicial' | 'extrajudicial';

export interface LegalAct {
  id: string; // slug del acto
  name: string;
  description?: string;
  type: ActType;
  hasIntake: boolean;
  hasManual: boolean;
  materia: string;
  ejecutor: string;
}

export interface LegalMatter {
  id: string;
  name: string;
  icon: string;
  acts: LegalAct[];
}

export interface LegalCategory {
  id: string;
  name: string;
  type: ActType;
  matters: LegalMatter[];
}

// Mapeo de materias a iconos
const MATERIA_ICONS: Record<string, string> = {
  'Civil y Comercial': 'Scale',
  'Penal': 'Gavel',
  'Laboral': 'Briefcase',
  'Administrativo': 'Building2',
  'Inmobiliaria y Tierras': 'Home',
  'Juzgado de Paz': 'FileCheck',
  'Municipal y Ambiental': 'TreePine',
  'Familia': 'Heart',
  'Constitucional': 'BookOpen',
  'Marítimo': 'Anchor',
  'Notarial': 'FileSignature',
};

// Convertir LegalActBundle a LegalAct
function bundleActToLegalAct(bundleAct: LegalActBundle): LegalAct {
  return {
    id: bundleAct.slug,
    name: bundleAct.title || bundleAct.slug,
    materia: bundleAct.materia,
    ejecutor: bundleAct.ejecutor,
    type: bundleAct.naturaleza === 'Judicial' ? 'judicial' : 'extrajudicial',
    hasIntake: bundleAct.input_schema_json?.fields?.length > 0,
    hasManual: bundleAct.plantilla_md?.length > 0,
  };
}

// Generar categorías dinámicamente desde el bundle
function generateLegalCategories(): LegalCategory[] {
  const categories: LegalCategory[] = [
    {
      id: 'judicial',
      name: 'Actos Judiciales',
      type: 'judicial',
      matters: [],
    },
    {
      id: 'extrajudicial',
      name: 'Actos Extrajudiciales',
      type: 'extrajudicial',
      matters: [],
    },
  ];

  // Agrupar actos por naturaleza y materia
  const materiaMap = new Map<string, Map<string, LegalAct[]>>();

  praxisLexBundle.actos.forEach((bundleAct) => {
    const naturaleza = bundleAct.naturaleza === 'Judicial' ? 'judicial' : 'extrajudicial';
    const materia = bundleAct.materia;

    if (!materiaMap.has(naturaleza)) {
      materiaMap.set(naturaleza, new Map());
    }

    const naturMap = materiaMap.get(naturaleza)!;
    if (!naturMap.has(materia)) {
      naturMap.set(materia, []);
    }

    naturMap.get(materia)!.push(bundleActToLegalAct(bundleAct));
  });

  // Construir la estructura de categorías
  materiaMap.forEach((naturMap, naturaleza) => {
    const category = categories.find((c) => c.id === naturaleza);
    if (!category) return;

    naturMap.forEach((acts, materiaName) => {
      const matterId = materiaName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');

      category.matters.push({
        id: `${matterId}_${naturaleza}`,
        name: materiaName,
        icon: MATERIA_ICONS[materiaName] || 'FileText',
        acts: acts.sort((a, b) => a.name.localeCompare(b.name)),
      });
    });

    // Ordenar materias alfabéticamente
    category.matters.sort((a, b) => a.name.localeCompare(b.name));
  });

  return categories;
}

export const LEGAL_CATEGORIES: LegalCategory[] = generateLegalCategories();

// Función helper para buscar actos
export function searchLegalActs(query: string): { category: string; matter: string; act: LegalAct }[] {
  const results: { category: string; matter: string; act: LegalAct }[] = [];
  const lowerQuery = query.toLowerCase();

  LEGAL_CATEGORIES.forEach((category) => {
    category.matters.forEach((matter) => {
      matter.acts.forEach((act) => {
        if (
          act.name.toLowerCase().includes(lowerQuery) ||
          act.id.toLowerCase().includes(lowerQuery) ||
          act.materia.toLowerCase().includes(lowerQuery)
        ) {
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

// Función para obtener un acto específico por ID (slug)
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
