import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GeneratedAct {
  id: string;
  user_id: string;
  tenant_id: string;
  case_id?: string;
  client_id?: string;
  tipo_acto: string;
  materia: string;
  titulo: string;
  ciudad: string;
  provincia?: string;
  contenido: string;
  documento_url?: string;
  formato_exportado?: string;
  numero_acto?: string;
  numero_acta?: string;
  fecha_actuacion: string;
  vendedores?: any[];
  compradores?: any[];
  testigos?: any[];
  notario_id?: string;
  abogado_id?: string;
  tasador_id?: string;
  perito_id?: string;
  clausulas?: any;
  firmado: boolean;
  fecha_firma?: string;
  numero_folios?: number;
  audio_dictado_url?: string;
  created_at: string;
  updated_at: string;
}

export function useGeneratedActs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: acts = [], isLoading, error } = useQuery({
    queryKey: ["generated_acts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("generated_acts")
        .select(`
          *,
          clients (
            nombre_completo
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching generated acts:", error);
        throw error;
      }
      return data as (GeneratedAct & { clients?: { nombre_completo: string } })[];
    },
  });

  if (error) {
    toast({
      title: "Error al cargar actos",
      description: error.message,
      variant: "destructive",
    });
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("generated_acts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated_acts"] });
      toast({
        title: "Acto eliminado",
        description: "El acto ha sido eliminado del sistema.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GeneratedAct> & { id: string }) => {
      const { data, error } = await supabase
        .from("generated_acts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated_acts"] });
      toast({
        title: "Acto actualizado",
        description: "Los cambios han sido guardados.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    acts,
    loading: isLoading,
    deleteAct: deleteMutation.mutateAsync,
    updateAct: updateMutation.mutateAsync,
  };
}
