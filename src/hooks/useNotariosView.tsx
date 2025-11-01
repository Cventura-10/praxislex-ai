import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NotarioView {
  id: string;
  user_id: string;
  tenant_id: string | null;
  nombre: string;
  exequatur: string;
  telefono: string;
  email: string;
  oficina: string;
  municipio_id: number | null;
  municipio_nombre: string | null;
  provincia_id: number | null;
  provincia_nombre: string | null;
  jurisdiccion: string | null;
  cedula_mask: string;
}

export function useNotariosView() {
  return useQuery({
    queryKey: ["notarios_view"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_notarios")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      return data as NotarioView[];
    },
  });
}
