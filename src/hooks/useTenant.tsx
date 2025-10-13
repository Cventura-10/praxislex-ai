import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  max_users: number;
  max_documents_per_month: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

/**
 * Hook to access current user's tenant information
 */
export function useTenant() {
  const { data: tenant, isLoading, error, refetch } = useQuery({
    queryKey: ["current-tenant"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("current_user_tenant")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as Tenant | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    tenant,
    isLoading,
    error,
    refetch,
    isPro: tenant?.plan === 'pro' || tenant?.plan === 'enterprise',
    isEnterprise: tenant?.plan === 'enterprise',
    isFree: tenant?.plan === 'free',
  };
}

/**
 * Hook to get tenant users (simplified - just return the tenant_users data)
 * Note: tenant_id is auto-assigned by database triggers, no need to set it in code
 */
export function useTenantUsers() {
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ["tenant-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return {
    users,
    isLoading,
    error,
    refetch,
  };
}
