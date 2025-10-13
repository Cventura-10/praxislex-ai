import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Tasador {
  id: string;
  user_id: string;
  tenant_id?: string;
  nombre: string;
  cedula_encrypted?: string;
  matricula?: string;
  especialidad?: string;
  certificaciones?: any[];
  direccion?: string;
  telefono?: string;
  email?: string;
  firma_digital_url?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export function useTasadores() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasadores = [], isLoading } = useQuery({
    queryKey: ["tasadores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasadores")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      return data as Tasador[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (tasador: Partial<Tasador>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("tasadores")
        .insert([{ ...tasador, user_id: user.id } as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasadores"] });
      toast({
        title: "Tasador creado",
        description: "El tasador ha sido registrado exitosamente.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tasador> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasadores")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasadores"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasadores")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasadores"] });
    },
  });

  return {
    tasadores,
    loading: isLoading,
    createTasador: createMutation.mutateAsync,
    updateTasador: updateMutation.mutateAsync,
    deleteTasador: deleteMutation.mutateAsync,
  };
}
