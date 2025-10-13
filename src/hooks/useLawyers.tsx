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
  matricula_card: string | null;
  firma_digital_url: string | null;
  despacho_direccion: string | null;
}

type CreateLawyerData = Omit<Lawyer, "id" | "created_at" | "updated_at" | "user_id" | "tenant_id" | "matricula_card" | "firma_digital_url" | "despacho_direccion"> & {
  matricula_card?: string | null;
  firma_digital_url?: string | null;
  despacho_direccion?: string | null;
};

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

  const createLawyer = async (lawyerData: CreateLawyerData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      if (!lawyerData.nombre) {
        throw new Error("El nombre del abogado es requerido");
      }

      // Get user's tenant_id
      const { data: tenantData } = await supabase.rpc('get_user_tenant_id', {
        p_user_id: user.id
      });

      const { error } = await supabase.from("lawyers").insert([
        {
          nombre: lawyerData.nombre,
          cedula: lawyerData.cedula || null,
          email: lawyerData.email || null,
          telefono: lawyerData.telefono || null,
          rol: lawyerData.rol || 'abogado',
          estado: lawyerData.estado || 'activo',
          matricula_card: lawyerData.matricula_card || null,
          firma_digital_url: lawyerData.firma_digital_url || null,
          despacho_direccion: lawyerData.despacho_direccion || null,
          user_id: user.id,
          tenant_id: tenantData || null,
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
