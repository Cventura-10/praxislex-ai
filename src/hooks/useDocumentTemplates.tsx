import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentTemplate {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  categoria: "judicial" | "extrajudicial" | "notarial";
  storage_path: string;
  version: string;
  activo: boolean;
  requiere_notario: boolean;
  requiere_contrato: boolean;
  roles_partes: any[];
  campos_adicionales: any[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useDocumentTemplates = (categoria?: string) => {
  return useQuery({
    queryKey: ["document-templates", categoria],
    queryFn: async () => {
      let query = supabase
        .from("document_templates")
        .select("*")
        .eq("activo", true)
        .order("nombre");

      if (categoria) {
        query = query.eq("categoria", categoria);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DocumentTemplate[];
    },
  });
};

export const useDocumentTemplate = (slug: string) => {
  return useQuery({
    queryKey: ["document-template", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("slug", slug)
        .eq("activo", true)
        .single();

      if (error) throw error;
      return data as DocumentTemplate;
    },
    enabled: !!slug,
  });
};
