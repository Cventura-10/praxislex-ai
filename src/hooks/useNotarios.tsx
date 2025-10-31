import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Notario {
  id: string;
  user_id: string;
  tenant_id?: string;
  nombre: string;
  cedula_encrypted?: string;
  matricula_cdn?: string;
  colegio_notarial?: string;
  jurisdiccion?: string;
  oficina_direccion?: string;
  telefono?: string;
  email?: string;
  firma_digital_url?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
  nacionalidad?: string;
  estado_civil?: string;
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  pasaporte?: string;
}

export function useNotarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notarios = [], isLoading } = useQuery({
    queryKey: ["notarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notarios")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      return data as Notario[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (notario: Partial<Notario>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("notarios")
        .insert([{ ...notario, user_id: user.id } as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notarios"] });
      toast({
        title: "Notario creado",
        description: "El notario ha sido registrado exitosamente.",
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
    mutationFn: async ({ id, ...updates }: Partial<Notario> & { id: string }) => {
      const { data, error } = await supabase
        .from("notarios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notarios"] });
      toast({
        title: "Notario actualizado",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notarios")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notarios"] });
      toast({
        title: "Notario eliminado",
        description: "El notario ha sido eliminado del sistema.",
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
    notarios,
    loading: isLoading,
    createNotario: createMutation.mutateAsync,
    updateNotario: updateMutation.mutateAsync,
    deleteNotario: deleteMutation.mutateAsync,
  };
}
