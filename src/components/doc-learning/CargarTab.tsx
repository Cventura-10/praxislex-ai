import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDocLearningUploads, useUploadDocument, useAnalyzeDocuments, useDeleteUpload } from "@/hooks/useDocLearning";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'text/html',
  'text/plain',
  'image/jpeg',
  'image/png'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 15;

export function CargarTab() {
  const [uploading, setUploading] = useState(false);
  const [deleteOriginals, setDeleteOriginals] = useState(false);
  const { data: uploads, isLoading } = useDocLearningUploads();
  const uploadMutation = useUploadDocument();
  const analyzeMutation = useAnalyzeDocuments();
  const deleteMutation = useDeleteUpload();

  const queuedUploads = uploads?.filter(u => u.status === 'queued') || [];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (queuedUploads.length + acceptedFiles.length > MAX_FILES) {
      toast.error(`Máximo ${MAX_FILES} archivos por análisis`);
      return;
    }

    setUploading(true);

    for (const file of acceptedFiles) {
      try {
        // Validar tipo
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`Tipo de archivo no soportado: ${file.name}`);
          continue;
        }

        // Validar tamaño
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`Archivo muy grande (máx 20MB): ${file.name}`);
          continue;
        }

        // Subir a Storage
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No autenticado');

        const fileName = `${user.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('legal-source-docs')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('legal-source-docs')
          .getPublicUrl(fileName);

        // Registrar en BD
        await uploadMutation.mutateAsync({
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: publicUrl
        });
      } catch (error) {
        console.error('Error subiendo archivo:', error);
        toast.error(`Error: ${file.name}`);
      }
    }

    setUploading(false);
  }, [queuedUploads.length, uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/rtf': ['.rtf'],
      'application/vnd.oasis.opendocument.text': ['.odt'],
      'text/html': ['.html'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: MAX_FILE_SIZE,
    disabled: uploading || queuedUploads.length >= MAX_FILES
  });

  const handleAnalyze = async () => {
    if (queuedUploads.length === 0) {
      toast.error('No hay documentos para analizar');
      return;
    }

    await analyzeMutation.mutateAsync({
      upload_ids: queuedUploads.map(u => u.id),
      delete_originals: deleteOriginals
    });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subir Documentos</CardTitle>
          <CardDescription>
            Arrastra hasta {MAX_FILES} documentos legales (PDF, DOCX, RTF, ODT, HTML, TXT, imágenes). Máx 20MB por archivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${uploading || queuedUploads.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="h-6 w-6 mx-auto animate-spin" />
                <p>Subiendo archivos...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {queuedUploads.length}/{MAX_FILES} archivos en cola
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="delete-originals" 
              checked={deleteOriginals}
              onCheckedChange={(checked) => setDeleteOriginals(checked as boolean)}
            />
            <Label htmlFor="delete-originals" className="text-sm cursor-pointer">
              Eliminar archivos originales después del análisis
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Archivos en Cola ({queuedUploads.length})</CardTitle>
            <Button
              onClick={handleAnalyze}
              disabled={queuedUploads.length === 0 || analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analizar Ahora
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : queuedUploads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay archivos en cola</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queuedUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{upload.file_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(upload.file_size)}</span>
                        {upload.pages && <span>• {upload.pages} páginas</span>}
                        <span>• {formatDistanceToNow(new Date(upload.created_at), { addSuffix: true, locale: es })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={upload.status === 'queued' ? 'secondary' : 'default'}>
                      {upload.status === 'queued' ? 'En cola' : upload.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(upload.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
