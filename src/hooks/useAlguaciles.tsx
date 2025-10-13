import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Alguacil {
  id: string;
  user_id: string;
  tenant_id?: string;
  nombre: string;
  cedula?: string;
  matricula?: string;
  jurisdiccion: string;
  tribunal_asignado?: string;
  direccion_notificaciones?: string;
  telefono?: string;
  email?: string;
  firma_digital_url?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export function useAlguaciles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alguaciles = [], isLoading } = useQuery({
    queryKey: ["alguaciles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alguaciles")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      return data as Alguacil[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (alguacil: Partial<Alguacil>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("alguaciles")
        .insert([{ ...alguacil, user_id: user.id } as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alguaciles"] });
      toast({
        title: "Alguacil creado",
        description: "El alguacil ha sido registrado exitosamente.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Alguacil> & { id: string }) => {
      const { data, error } = await supabase
        .from("alguaciles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alguaciles"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alguaciles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alguaciles"] });
    },
  });

  return {
    alguaciles,
    loading: isLoading,
    createAlguacil: createMutation.mutateAsync,
    updateAlguacil: updateMutation.mutateAsync,
    deleteAlguacil: deleteMutation.mutateAsync,
  };
}
