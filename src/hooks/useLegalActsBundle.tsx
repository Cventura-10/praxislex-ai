import { useMemo } from "react";
import { 
  praxisLexBundle, 
  getActBySlug, 
  getActsByMateria, 
  getActsByNaturaleza,
  getActsByEjecutor,
  getAllMaterias,
  shouldInjectGlobalClauses,
  getGlobalClausesText,
  type LegalActBundle,
  type ActFieldSchema
} from "@/lib/legalActsBundle";

export function useLegalActsBundle() {
  const bundle = useMemo(() => praxisLexBundle, []);

  const getActoBySlug = (slug: string): LegalActBundle | null => {
    return getActBySlug(slug);
  };

  const getActosByMateria = (materia: string): LegalActBundle[] => {
    return getActsByMateria(materia);
  };

  const getActosByNaturaleza = (naturaleza: 'Judicial' | 'Extrajudicial'): LegalActBundle[] => {
    return getActsByNaturaleza(naturaleza);
  };

  const getActosByEjecutor = (ejecutor: string): LegalActBundle[] => {
    return getActsByEjecutor(ejecutor);
  };

  const getMaterias = (): string[] => {
    return getAllMaterias();
  };

  const shouldInjectClauses = (slug: string): boolean => {
    return shouldInjectGlobalClauses(slug);
  };

  const getGlobalClauses = (): string => {
    return getGlobalClausesText();
  };

  const getFieldsByActo = (slug: string): ActFieldSchema[] => {
    const acto = getActBySlug(slug);
    return acto?.input_schema_json?.fields || [];
  };

  const getActoTemplate = (slug: string): string => {
    const acto = getActBySlug(slug);
    return acto?.plantilla_md || '';
  };

  return {
    bundle,
    actos: bundle.actos,
    globalCatalogs: bundle.global_catalogs,
    getActoBySlug,
    getActosByMateria,
    getActosByNaturaleza,
    getActosByEjecutor,
    getMaterias,
    shouldInjectClauses,
    getGlobalClauses,
    getFieldsByActo,
    getActoTemplate,
  };
}
