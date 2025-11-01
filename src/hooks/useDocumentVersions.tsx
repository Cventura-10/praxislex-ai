import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DocumentVersion {
  id: string;
  generated_act_id: string;
  user_id: string;
  tenant_id: string | null;
  version_number: number;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useDocumentVersions = (actId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener versiones de un acto específico
  const { data: versions, isLoading } = useQuery({
    queryKey: ["document-versions", actId],
    queryFn: async () => {
      if (!actId) return [];
      
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("generated_act_id", actId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return data as DocumentVersion[];
    },
    enabled: !!actId,
  });

  // Crear nueva versión
  const createVersion = useMutation({
    mutationFn: async ({
      actId,
      fileName,
      storagePath,
      fileSize,
      metadata,
    }: {
      actId: string;
      fileName: string;
      storagePath: string;
      fileSize: number;
      metadata?: Record<string, any>;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error("No autenticado");

      // Obtener siguiente número de versión
      const { data: nextVersion, error: versionError } = await supabase
        .rpc("get_next_document_version", { p_act_id: actId });

      if (versionError) throw versionError;

      // Insertar versión
      const { data, error } = await supabase
        .from("document_versions")
        .insert({
          generated_act_id: actId,
          user_id: user.user.id,
          version_number: nextVersion,
          storage_path: storagePath,
          file_name: fileName,
          file_size: fileSize,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-versions"] });
      toast({
        title: "Versión creada",
        description: "Nueva versión del documento guardada",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Descargar versión específica
  const downloadVersion = async (version: DocumentVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from("generated_documents")
        .download(version.storage_path);

      if (error) throw error;

      // Crear blob URL y descargar
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = version.file_name;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Descarga iniciada",
        description: `Descargando ${version.file_name}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al descargar",
        description: error.message,
      });
    }
  };

  // Eliminar versión
  const deleteVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const version = versions?.find((v) => v.id === versionId);
      if (!version) throw new Error("Versión no encontrada");

      // Eliminar del storage
      const { error: storageError } = await supabase.storage
        .from("generated_documents")
        .remove([version.storage_path]);

      if (storageError) throw storageError;

      // Eliminar registro de BD
      const { error } = await supabase
        .from("document_versions")
        .delete()
        .eq("id", versionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-versions"] });
      toast({
        title: "Versión eliminada",
        description: "La versión ha sido eliminada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return {
    versions: versions || [],
    isLoading,
    createVersion: createVersion.mutateAsync,
    downloadVersion,
    deleteVersion: deleteVersion.mutateAsync,
  };
};
