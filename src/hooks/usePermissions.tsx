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

      // Obtener rol del usuario usando el nuevo sistema
      const { data: userRole, error: roleError } = await supabase.rpc('get_user_role', {
        p_user_id: user.id
      });

      if (roleError || !userRole) {
        console.error("Error fetching user role:", roleError);
        return {};
      }

      // Mapeo de permisos basado en roles
      const permissionsMap: Record<string, boolean> = {};
      const role = userRole as string;

      // generate_legal_acts: todos excepto asistente
      permissionsMap['generate_legal_acts'] = 
        role !== 'asistente';

      // create_invoices: admin, desarrollador, abogado
      permissionsMap['create_invoices'] = 
        ['admin', 'desarrollador', 'abogado'].includes(role);

      // manage_professionals: admin, desarrollador, abogado
      permissionsMap['manage_professionals'] = 
        ['admin', 'desarrollador', 'abogado'].includes(role);

      // access_security: admin, desarrollador
      permissionsMap['access_security'] = 
        ['admin', 'desarrollador'].includes(role);

      // full_access: admin, desarrollador
      permissionsMap['full_access'] = 
        ['admin', 'desarrollador'].includes(role);

      // notarial_acts: admin, desarrollador, notario, abogado
      permissionsMap['notarial_acts'] = 
        ['admin', 'desarrollador', 'notario', 'abogado'].includes(role);

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
