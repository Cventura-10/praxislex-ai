import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface NotarialAct {
  id: string;
  user_id: string;
  tenant_id: string;
  notario_id?: string;
  tipo_acto: 'autentico' | 'firma_privada' | 'declaracion_unilateral';
  acto_especifico: string;
  titulo: string;
  numero_protocolo?: string;
  fecha_instrumentacion: string;
  ciudad: string;
  provincia?: string;
  comparecientes: any[];
  testigos?: any[];
  objeto: string;
  clausulas?: any[];
  contenido_completo?: string;
  firmado: boolean;
  fecha_firma?: string;
  firma_digital_url?: string;
  documento_url?: string;
  formato_exportado?: 'docx' | 'pdf';
  case_id?: string;
  client_id?: string;
  created_at: string;
  updated_at: string;
}

export function useNotarialActs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: acts = [], isLoading } = useQuery({
    queryKey: ["notarial_acts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notarial_acts")
        .select("*")
        .order("fecha_instrumentacion", { ascending: false });
      
      if (error) throw error;
      return data as NotarialAct[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (act: Partial<NotarialAct>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("notarial_acts")
        .insert([{ ...act, user_id: user.id } as any])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notarial_acts"] });
      toast({
        title: "Acto notarial creado",
        description: "El acto ha sido registrado exitosamente.",
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
    mutationFn: async ({ id, ...updates }: Partial<NotarialAct> & { id: string }) => {
      const { data, error } = await supabase
        .from("notarial_acts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notarial_acts"] });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notarial_acts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notarial_acts"] });
      toast({
        title: "Acto eliminado",
        description: "El acto notarial ha sido eliminado del sistema.",
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
    createAct: createMutation.mutateAsync,
    updateAct: updateMutation.mutateAsync,
    deleteAct: deleteMutation.mutateAsync,
  };
}
