import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook para verificar acceso a módulos específicos
 * Usa la función de base de datos user_can_access_module
 */
export function useModuleAccess(module: string) {
  const { data: canAccess, isLoading } = useQuery({
    queryKey: ["module_access", module],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('user_can_access_module', {
        p_user_id: user.id,
        p_module: module
      });

      if (error) {
        console.error(`Error checking access to module ${module}:`, error);
        return false;
      }

      // Registrar el acceso al módulo
      try {
        await supabase.rpc('log_module_access', {
          p_module: module,
          p_access_granted: data
        });
      } catch (logError) {
        // No interrumpir el flujo si falla el logging
        console.warn('Failed to log module access:', logError);
      }

      return data as boolean;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    canAccess: canAccess ?? false,
    loading: isLoading,
  };
}

/**
 * Hook para verificar acceso a múltiples módulos
 */
export function useMultipleModuleAccess(modules: string[]) {
  const { data: accessMap, isLoading } = useQuery({
    queryKey: ["modules_access", ...modules],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const results: Record<string, boolean> = {};

      for (const module of modules) {
        const { data, error } = await supabase.rpc('user_can_access_module', {
          p_user_id: user.id,
          p_module: module
        });

        results[module] = error ? false : (data as boolean);
      }

      return results;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    accessMap: accessMap ?? {},
    loading: isLoading,
    canAccess: (module: string) => accessMap?.[module] ?? false,
  };
}
