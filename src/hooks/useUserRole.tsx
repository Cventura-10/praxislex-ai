import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 
  | "admin"
  | "desarrollador"
  | "abogado"
  | "notario"
  | "asistente"
  | "alguacil"
  | "perito"
  | "tasador";

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        // Usar la nueva función get_user_role
        const { data, error } = await supabase.rpc('get_user_role', {
          p_user_id: user.id
        });

        if (error) {
          console.error("Error fetching user role:", error);
          setRole("asistente"); // Default a asistente si hay error
        } else {
          setRole(data as AppRole);
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        setRole("asistente");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { 
    role, 
    loading, 
    isAdmin: role === "admin",
    isDeveloper: role === "desarrollador",
    isLawyer: role === "abogado",
    isNotary: role === "notario",
    isAssistant: role === "asistente",
    isAlguacil: role === "alguacil",
    isPerito: role === "perito",
    isTasador: role === "tasador",
    // Agrupaciones de permisos
    hasAdminAccess: role === "admin" || role === "desarrollador",
    canManageFinances: role === "admin" || role === "desarrollador" || role === "abogado",
    canGenerateLegalActs: role !== "asistente",
    // Compatibilidad con código legacy (basado en planes)
    isPro: role === "abogado" || role === "admin" || role === "desarrollador",
    isFree: role === "asistente",
  };
}
