import bundleData from '@/data/praxislex_bundle_v1_3_1.json';

export interface ActFieldSchema {
  name: string;
  label: string;
  type: 'party' | 'professional' | 'text' | 'textarea' | 'select' | 'list' | 'currency' | 'date' | 'time' | 'boolean' | 'integer' | 'number' | 'address' | 'object';
  required: boolean;
  autofill?: string;
  source?: string;
  subtype?: string;
  default?: any;
  options?: string[];
  item_type?: string;
  schema?: {
    fields: ActFieldSchema[];
  };
}

export interface LegalActBundle {
  materia: string;
  naturaleza: 'Judicial' | 'Extrajudicial';
  ejecutor: 'Abogado' | 'Alguacil' | 'Notario';
  slug: string;
  title?: string;
  is_contrato?: boolean;
  input_schema_json: {
    fields: ActFieldSchema[];
  };
  plantilla_md: string;
}

export interface BundleData {
  version: string;
  generated_at: string;
  actos: LegalActBundle[];
  global_clauses: {
    confidencialidad: string;
    aml_155_17: string;
    injection_policy: {
      apply_to: string;
      except_slugs: string[];
      position: string;
    };
  };
  prompt_addendums: string[];
}

export const praxisLexBundle: BundleData = bundleData as BundleData;

export function getActBySlug(slug: string): LegalActBundle | null {
  return praxisLexBundle.actos.find(act => act.slug === slug) || null;
}

export function getActsByMateria(materia: string): LegalActBundle[] {
  return praxisLexBundle.actos.filter(act => act.materia === materia);
}

export function getActsByNaturaleza(naturaleza: 'Judicial' | 'Extrajudicial'): LegalActBundle[] {
  return praxisLexBundle.actos.filter(act => act.naturaleza === naturaleza);
}

export function getActsByEjecutor(ejecutor: string): LegalActBundle[] {
  return praxisLexBundle.actos.filter(act => act.ejecutor === ejecutor);
}

export function getAllMaterias(): string[] {
  return [...new Set(praxisLexBundle.actos.map(act => act.materia))];
}

export function getAllSlugs(): string[] {
  return praxisLexBundle.actos.map(act => act.slug);
}

// Helper to check if global clauses should be injected
export function shouldInjectGlobalClauses(slug: string): boolean {
  const act = getActBySlug(slug);
  if (!act?.is_contrato) return false;
  
  const { except_slugs } = praxisLexBundle.global_clauses.injection_policy;
  return !except_slugs.includes(slug);
}

// Get global clauses text
export function getGlobalClausesText(): string {
  const { confidencialidad, aml_155_17 } = praxisLexBundle.global_clauses;
  return `${confidencialidad}\n\n${aml_155_17}`;
}
