import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Provincia {
  id: number;
  nombre: string;
}

interface Municipio {
  id: number;
  provincia_id: number;
  nombre: string;
}

interface Sector {
  id: number;
  municipio_id: number;
  nombre: string;
}

export function useProvincias() {
  return useQuery({
    queryKey: ["provincias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provincias")
        .select("id, nombre")
        .order("nombre");
      
      if (error) throw error;
      return data as Provincia[];
    },
    staleTime: 1000 * 60 * 60, // 1 hora (datos estáticos)
  });
}

export function useMunicipios(provinciaId: number | null | undefined) {
  return useQuery({
    queryKey: ["municipios", provinciaId],
    queryFn: async () => {
      if (!provinciaId) return [];
      
      const { data, error } = await supabase
        .from("municipios")
        .select("id, provincia_id, nombre")
        .eq("provincia_id", provinciaId)
        .order("nombre");
      
      if (error) throw error;
      return data as Municipio[];
    },
    enabled: !!provinciaId,
    staleTime: 1000 * 60 * 60,
  });
}

export function useSectores(municipioId: number | null | undefined) {
  return useQuery({
    queryKey: ["sectores", municipioId],
    queryFn: async () => {
      if (!municipioId) return [];
      
      const { data, error } = await supabase
        .from("sectores")
        .select("id, municipio_id, nombre")
        .eq("municipio_id", municipioId)
        .order("nombre");
      
      if (error) throw error;
      return data as Sector[];
    },
    enabled: !!municipioId,
    staleTime: 1000 * 60 * 60,
  });
}
