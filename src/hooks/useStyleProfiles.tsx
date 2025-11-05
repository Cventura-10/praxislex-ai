import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StyleProfile {
  id: string;
  tenant_id: string;
  user_id: string;
  run_id?: string;
  version: number;
  layout_json: any;
  lexicon_json: any;
  clause_library_json: any[];
  variable_map_json: any[];
  metrics_json: any;
  published_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useStyleProfiles = () => {
  return useQuery({
    queryKey: ['style-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_profiles')
        .select('*')
        .order('version', { ascending: false });

      if (error) throw error;
      return data as StyleProfile[];
    }
  });
};

export const useActiveStyleProfile = () => {
  return useQuery({
    queryKey: ['style-profile-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as StyleProfile | null;
    }
  });
};

export const usePublishStyleProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (run_id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const response = await supabase.functions.invoke('doc-learning-publish', {
        body: { run_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['style-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['style-profile-active'] });
      toast.success(data.message || 'Perfil publicado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al publicar perfil: ' + error.message);
    }
  });
};

export const useDeactivateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('style_profiles')
        .update({ active: false })
        .eq('id', profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['style-profile-active'] });
      toast.success('Perfil desactivado');
    },
    onError: (error: Error) => {
      toast.error('Error al desactivar: ' + error.message);
    }
  });
};
