import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Perito {
  id: string;
  user_id: string;
  tenant_id?: string;
  nombre: string;
  cedula?: string;
  matricula?: string;
  especialidad: string;
  certificaciones?: any[];
  institucion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  firma_digital_url?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export function usePeritos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: peritos = [], isLoading } = useQuery({
    queryKey: ["peritos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peritos")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      return data as Perito[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (perito: Partial<Perito>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("peritos")
        .insert([{ ...perito, user_id: user.id } as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peritos"] });
      toast({
        title: "Perito creado",
        description: "El perito ha sido registrado exitosamente.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Perito> & { id: string }) => {
      const { data, error } = await supabase
        .from("peritos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peritos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("peritos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peritos"] });
    },
  });

  return {
    peritos,
    loading: isLoading,
    createPerito: createMutation.mutateAsync,
    updatePerito: updateMutation.mutateAsync,
    deletePerito: deleteMutation.mutateAsync,
  };
}
