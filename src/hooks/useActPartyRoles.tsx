import { useMemo } from 'react';
import { LegalActBundle } from '@/lib/legalActsBundle';

export interface PartyRole {
  side: 'actor' | 'demandado' | 'parte_a' | 'parte_b' | 'tercero';
  label: string;
  multiple: boolean;
}

export interface ActPartyConfig {
  roles: PartyRole[];
  requiresLawyers: boolean;
  requiresNotary: boolean;
  requiresOtherProfessionals: string[];
}

/**
 * Hook que determina qué roles de partes debe tener un acto
 * según su materia, naturaleza y slug
 */
export function useActPartyRoles(acto: LegalActBundle | null): ActPartyConfig {
  return useMemo(() => {
    if (!acto) {
      return {
        roles: [],
        requiresLawyers: false,
        requiresNotary: false,
        requiresOtherProfessionals: [],
      };
    }

    const { materia, naturaleza, slug, ejecutor } = acto;
    const isContrato = acto.is_contrato ?? false;

    // Actos Notariales (Extrajudiciales)
    if (naturaleza === 'Extrajudicial' && ejecutor === 'Notario') {
      // Contratos de compraventa
      if (slug.includes('compraventa') || slug.includes('venta')) {
        return {
          roles: [
            { side: 'parte_a', label: 'VENDEDOR(ES)', multiple: true },
            { side: 'parte_b', label: 'COMPRADOR(ES)', multiple: true },
          ],
          requiresLawyers: false,
          requiresNotary: true,
          requiresOtherProfessionals: [],
        };
      }

      // Contratos de préstamo/hipoteca
      if (slug.includes('prestamo') || slug.includes('hipoteca') || slug.includes('credito')) {
        return {
          roles: [
            { side: 'parte_a', label: 'PRESTAMISTA(S)', multiple: true },
            { side: 'parte_b', label: 'DEUDOR(ES)/PRESTATARIO(S)', multiple: true },
          ],
          requiresLawyers: false,
          requiresNotary: true,
          requiresOtherProfessionals: [],
        };
      }

      // Contratos de arrendamiento
      if (slug.includes('arrendamiento') || slug.includes('alquiler')) {
        return {
          roles: [
            { side: 'parte_a', label: 'ARRENDADOR(ES)', multiple: true },
            { side: 'parte_b', label: 'ARRENDATARIO(S)', multiple: true },
          ],
          requiresLawyers: false,
          requiresNotary: true,
          requiresOtherProfessionals: [],
        };
      }

      // Contratos de sociedad
      if (slug.includes('sociedad') || slug.includes('asociacion')) {
        return {
          roles: [
            { side: 'parte_a', label: 'SOCIO(S)', multiple: true },
          ],
          requiresLawyers: false,
          requiresNotary: true,
          requiresOtherProfessionals: [],
        };
      }

      // Poderes notariales
      if (slug.includes('poder')) {
        return {
          roles: [
            { side: 'parte_a', label: 'PODERDANTE(S)', multiple: true },
            { side: 'parte_b', label: 'APODERADO(S)', multiple: true },
          ],
          requiresLawyers: false,
          requiresNotary: true,
          requiresOtherProfessionals: [],
        };
      }

      // Default para otros actos notariales
      return {
        roles: [
          { side: 'parte_a', label: 'PRIMERA PARTE', multiple: true },
          { side: 'parte_b', label: 'SEGUNDA PARTE', multiple: true },
        ],
        requiresLawyers: false,
        requiresNotary: true,
        requiresOtherProfessionals: [],
      };
    }

    // Actos Judiciales
    if (naturaleza === 'Judicial') {
      return {
        roles: [
          { side: 'actor', label: 'DEMANDANTE(S)/ACTOR(ES)', multiple: true },
          { side: 'demandado', label: 'DEMANDADO(S)', multiple: true },
          { side: 'tercero', label: 'TERCERO(S)', multiple: false },
        ],
        requiresLawyers: true, // Siempre requiere abogados en judiciales
        requiresNotary: false,
        requiresOtherProfessionals: ejecutor === 'Alguacil' ? ['alguacil'] : [],
      };
    }

    // Default fallback
    return {
      roles: [
        { side: 'parte_a', label: 'PARTE A', multiple: true },
        { side: 'parte_b', label: 'PARTE B', multiple: true },
      ],
      requiresLawyers: false,
      requiresNotary: ejecutor === 'Notario',
      requiresOtherProfessionals: [],
    };
  }, [acto]);
}
