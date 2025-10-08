import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Download, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LegalModelUploader } from "@/components/LegalModelUploader";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LegalTemplate {
  id: string;
  template_id: string;
  titulo: string;
  materia: string;
  tipo_documento: string;
  storage_path: string;
  fields_schema: any;
  created_at: string;
}

export default function LegalModels() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_model_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as LegalTemplate[]);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error al cargar modelos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (template: LegalTemplate) => {
    try {
      const { data, error } = await supabase.storage
        .from('legal-models')
        .download(template.storage_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.template_id}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Descarga iniciada",
        description: `Descargando ${template.titulo}`,
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error al descargar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (template: LegalTemplate) => {
    setDeleting(template.id);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('legal-models')
        .remove([template.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('legal_model_templates')
        .delete()
        .eq('id', template.id);

      if (dbError) throw dbError;

      toast({
        title: "Modelo eliminado",
        description: `${template.titulo} ha sido eliminado`,
      });

      // Reload templates
      loadTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Modelos Jurídicos</h1>
            <p className="text-muted-foreground">
              Administra tus plantillas de documentos legales
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Form */}
          <div>
            <LegalModelUploader />
          </div>

          {/* Templates List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Modelos Registrados</CardTitle>
                <CardDescription>
                  {templates.length} {templates.length === 1 ? 'modelo' : 'modelos'} disponible{templates.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay modelos registrados</p>
                    <p className="text-sm">Sube tu primer modelo .docx</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{template.titulo}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                ID: {template.template_id}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">{template.materia}</Badge>
                            <Badge variant="secondary">{template.tipo_documento}</Badge>
                          </div>
                          
                          {template.fields_schema && Array.isArray(template.fields_schema) && template.fields_schema.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {template.fields_schema.length} campos definidos
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Creado: {format(new Date(template.created_at), 'PPp', { locale: es })}
                          </p>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(template)}
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Descargar
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={deleting === template.id}
                                >
                                  {deleting === template.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar modelo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará el archivo y todos los datos asociados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(template)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
