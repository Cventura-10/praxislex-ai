import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, isPast } from "date-fns";

interface PlazoProcesal {
  id: string;
  case_id: string;
  tipo_plazo: string;
  descripcion: string;
  fecha_vencimiento: string;
  estado: string;
  prioridad: string;
}

/**
 * Hook para obtener plazos procesales del usuario actual
 * con alertas de vencimiento
 */
export function usePlazosProcessales() {
  const { data: plazos, isLoading, error } = useQuery({
    queryKey: ['plazos-procesales-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plazos_procesales')
        .select(`
          id,
          case_id,
          tipo_plazo,
          descripcion,
          fecha_vencimiento,
          estado,
          prioridad,
          cases:case_id (
            titulo,
            numero_expediente
          )
        `)
        .eq('estado', 'pendiente')
        .order('fecha_vencimiento', { ascending: true });

      if (error) throw error;
      return data as (PlazoProcesal & { cases: { titulo: string; numero_expediente: string } })[];
    },
    refetchInterval: 60000, // Refrescar cada minuto
  });

  // Clasificar plazos por urgencia
  const plazosCriticos = plazos?.filter(p => {
    const daysRemaining = differenceInDays(new Date(p.fecha_vencimiento), new Date());
    return daysRemaining <= 3 && daysRemaining >= 0;
  }) || [];

  const plazosProximos = plazos?.filter(p => {
    const daysRemaining = differenceInDays(new Date(p.fecha_vencimiento), new Date());
    return daysRemaining > 3 && daysRemaining <= 7;
  }) || [];

  const plazosVencidos = plazos?.filter(p => 
    isPast(new Date(p.fecha_vencimiento))
  ) || [];

  return {
    plazos: plazos || [],
    plazosCriticos,
    plazosProximos,
    plazosVencidos,
    isLoading,
    error,
    totalCriticos: plazosCriticos.length,
    totalProximos: plazosProximos.length,
    totalVencidos: plazosVencidos.length,
  };
}
