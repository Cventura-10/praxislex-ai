import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MATERIAS_JURIDICAS, TIPOS_DOCUMENTO } from "@/lib/constants";
import { sanitizeFilename, sanitizeText } from "@/lib/sanitization";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LegalModelUploader() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [materia, setMateria] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [campos, setCampos] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.docx') && !selectedFile.name.endsWith('.doc')) {
        toast({
          title: "Archivo inválido",
          description: "Solo se permiten archivos .docx",
          variant: "destructive",
        });
        return;
      }
      if (selectedFile.size > 10485760) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no debe superar 10MB",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      
      // Auto-generate template ID from filename
      const baseName = selectedFile.name.replace(/\.(docx|doc)$/i, '');
      const cleanId = baseName
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '_')
        .replace(/_+/g, '_');
      setTemplateId(cleanId);
      
      if (!titulo) {
        setTitulo(baseName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !templateId || !titulo || !materia || !tipoDocumento) {
      toast({
        title: "Campos requeridos",
        description: "Completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autenticado');
      }

      // Parse campos as JSON fields schema
      let fieldsSchema = [];
      if (campos.trim()) {
        try {
          // Try to parse as JSON array
          fieldsSchema = JSON.parse(campos);
        } catch {
          // If not JSON, split by lines and create basic schema
          fieldsSchema = campos.split('\n')
            .filter(line => line.trim())
            .map(field => ({
              key: field.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
              label: field.trim(),
              type: 'text',
              required: false
            }));
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateId', sanitizeText(templateId));
      formData.append('titulo', sanitizeText(titulo));
      formData.append('materia', sanitizeText(materia));
      formData.append('tipoDocumento', sanitizeText(tipoDocumento));
      formData.append('fieldsSchema', JSON.stringify(fieldsSchema));

      const { data, error } = await supabase.functions.invoke('process-legal-model', {
        body: formData,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error al procesar el modelo');
      }

      toast({
        title: "✅ Modelo registrado",
        description: `El modelo "${titulo}" ha sido registrado exitosamente`,
      });

      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setFile(null);
        setTemplateId("");
        setTitulo("");
        setMateria("");
        setTipoDocumento("");
        setCampos("");
        setSuccess(false);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }, 2000);

    } catch (error: any) {
      console.error('Error uploading model:', error);
      toast({
        title: "Error al subir modelo",
        description: error.message || 'Ocurrió un error al procesar el archivo',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Registrar Modelo Jurídico (.docx)
        </CardTitle>
        <CardDescription>
          Sube un archivo .docx para crear un nuevo modelo de documento legal reutilizable
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Archivo .docx *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".docx,.doc"
                onChange={handleFileChange}
                disabled={loading}
                className="cursor-pointer"
              />
              {file && (
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              )}
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Template ID */}
          <div className="space-y-2">
            <Label htmlFor="templateId">ID del Template *</Label>
            <Input
              id="templateId"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value.toUpperCase())}
              placeholder="CIVIL_COBRO_PESOS"
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Identificador único (solo mayúsculas, números y guiones bajos)
            </p>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Demanda en cobro de pesos"
              disabled={loading}
              required
            />
          </div>

          {/* Materia */}
          <div className="space-y-2">
            <Label htmlFor="materia">Materia *</Label>
            <Select value={materia} onValueChange={setMateria} disabled={loading} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una materia" />
              </SelectTrigger>
              <SelectContent>
                {MATERIAS_JURIDICAS.map((m) => (
                  <SelectItem key={typeof m === 'string' ? m : m.value} value={typeof m === 'string' ? m : m.value}>
                    {typeof m === 'string' ? m : m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
            <Select value={tipoDocumento} onValueChange={setTipoDocumento} disabled={loading} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOCUMENTO.map((t) => (
                  <SelectItem key={typeof t === 'string' ? t : t.value} value={typeof t === 'string' ? t : t.value}>
                    {typeof t === 'string' ? t : t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campos (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="campos">Campos del Formulario (opcional)</Label>
            <Textarea
              id="campos"
              value={campos}
              onChange={(e) => setCampos(e.target.value)}
              placeholder="Lista de campos (uno por línea) o JSON array"
              rows={5}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Ejemplo: demandante_nombre, demandado_nombre, monto, etc.
            </p>
          </div>

          {success && (
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                Modelo registrado exitosamente
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading || !file} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Registrar Modelo
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
