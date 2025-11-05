import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocLearningUpload {
  id: string;
  tenant_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  pages?: number;
  ocr_used: boolean;
  checksum_sha256?: string;
  extracted_text?: string;
  status: 'queued' | 'processed' | 'failed';
  warnings: any[];
  created_at: string;
  updated_at: string;
}

export interface DocLearningRun {
  id: string;
  tenant_id: string;
  user_id: string;
  status: 'running' | 'completed' | 'failed';
  docs_count: number;
  summary: any;
  metrics: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DocLearningVariable {
  id: string;
  tenant_id: string;
  run_id: string;
  name: string;
  pattern?: string;
  examples: any[];
  required: boolean;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface DocLearningClause {
  id: string;
  tenant_id: string;
  run_id: string;
  title: string;
  body: string;
  hash: string;
  frequency: number;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export const useDocLearningUploads = () => {
  return useQuery({
    queryKey: ['doc-learning-uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doc_learning_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocLearningUpload[];
    }
  });
};

export const useDocLearningRuns = () => {
  return useQuery({
    queryKey: ['doc-learning-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doc_learning_runs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocLearningRun[];
    }
  });
};

export const useDocLearningVariables = (runId?: string) => {
  return useQuery({
    queryKey: ['doc-learning-variables', runId],
    queryFn: async () => {
      let query = supabase
        .from('doc_learning_variables')
        .select('*');

      if (runId) {
        query = query.eq('run_id', runId);
      }

      const { data, error } = await query.order('confidence', { ascending: false });

      if (error) throw error;
      return data as DocLearningVariable[];
    },
    enabled: !!runId
  });
};

export const useDocLearningClauses = (runId?: string) => {
  return useQuery({
    queryKey: ['doc-learning-clauses', runId],
    queryFn: async () => {
      let query = supabase
        .from('doc_learning_clauses')
        .select('*');

      if (runId) {
        query = query.eq('run_id', runId);
      }

      const { data, error } = await query.order('frequency', { ascending: false });

      if (error) throw error;
      return data as DocLearningClause[];
    },
    enabled: !!runId
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      file_name: string;
      file_type: string;
      file_size: number;
      file_url: string;
      pages?: number;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const response = await supabase.functions.invoke('doc-learning-upload', {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc-learning-uploads'] });
      toast.success('Documento cargado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al cargar documento: ' + error.message);
    }
  });
};

export const useAnalyzeDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      upload_ids: string[];
      delete_originals?: boolean;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const response = await supabase.functions.invoke('doc-learning-analyze', {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc-learning-runs'] });
      queryClient.invalidateQueries({ queryKey: ['doc-learning-uploads'] });
      toast.success('Análisis completado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al analizar documentos: ' + error.message);
    }
  });
};

export const useDeleteUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uploadId: string) => {
      const { error } = await supabase
        .from('doc_learning_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc-learning-uploads'] });
      toast.success('Documento eliminado');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar: ' + error.message);
    }
  });
};

export const useUpdateVariable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<DocLearningVariable> 
    }) => {
      const { error } = await supabase
        .from('doc_learning_variables')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc-learning-variables'] });
      toast.success('Variable actualizada');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar: ' + error.message);
    }
  });
};
