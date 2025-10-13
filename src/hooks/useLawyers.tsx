import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Lawyer {
  id: string;
  nombre: string;
  cedula: string | null;
  email: string | null;
  telefono: string | null;
  rol: string;
  estado: string;
  user_id: string;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useLawyers = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .eq("user_id", user.id)
        .eq("estado", "activo")
        .order("nombre");

      if (error) throw error;
      setLawyers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los abogados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, []);

  const createLawyer = async (lawyerData: Partial<Lawyer>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase.from("lawyers").insert([
        {
          ...lawyerData,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Abogado creado",
        description: "El abogado ha sido creado exitosamente",
      });

      await fetchLawyers();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el abogado",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    lawyers,
    loading,
    fetchLawyers,
    createLawyer,
  };
};
