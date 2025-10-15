import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Permission = 
  | 'generate_legal_acts' 
  | 'create_invoices' 
  | 'manage_professionals'
  | 'access_security'
  | 'full_access'
  | 'notarial_acts';

export function usePermissions() {
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["user_permissions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      // Verificar cada permiso usando la función de base de datos
      const permissionTypes: Permission[] = [
        'generate_legal_acts',
        'create_invoices', 
        'manage_professionals',
        'access_security',
        'full_access',
        'notarial_acts'
      ];

      const permissionsMap: Record<string, boolean> = {};

      for (const perm of permissionTypes) {
        const { data, error } = await supabase.rpc('user_has_permission', {
          p_user_id: user.id,
          p_permission: perm
        });

        if (!error && data !== null) {
          permissionsMap[perm] = data;
        }
      }

      return permissionsMap;
    },
  });

  const hasPermission = (permission: Permission): boolean => {
    return permissions?.[permission] || false;
  };

  const canGenerateLegalActs = hasPermission('generate_legal_acts');
  const canCreateInvoices = hasPermission('create_invoices');
  const canManageProfessionals = hasPermission('manage_professionals');
  const canAccessSecurity = hasPermission('access_security');
  const hasFullAccess = hasPermission('full_access');
  const canAccessNotarialActs = hasPermission('notarial_acts');

  return {
    permissions: permissions || {},
    hasPermission,
    canGenerateLegalActs,
    canCreateInvoices,
    canManageProfessionals,
    canAccessSecurity,
    hasFullAccess,
    canAccessNotarialActs,
    loading: isLoading,
  };
}
