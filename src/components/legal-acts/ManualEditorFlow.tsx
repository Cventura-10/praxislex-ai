import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Save, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { LegalAct, LegalMatter, LegalCategory } from "@/lib/legalActsData";

interface ManualEditorFlowProps {
  actInfo: {
    category: LegalCategory;
    matter: LegalMatter;
    act: LegalAct;
  };
}

// Plantillas genéricas - en producción se cargarían desde el backend o archivos
const getTemplate = (actInfo: ManualEditorFlowProps["actInfo"]): string => {
  const { act, matter, category } = actInfo;
  
  return `
═══════════════════════════════════════════════════════════════
${act.name.toUpperCase()}
${matter.name} - ${category.name}
═══════════════════════════════════════════════════════════════

[NOTA: Esta es una plantilla base. Complete los campos entre corchetes y elimine las notas explicativas antes de generar el documento final.]

DATOS DEL ACTO
────────────────────────────────────────────────────────────────
No. Acto: [Número de acto]
Folios: [Número de folios]
Ciudad: [Ciudad de actuación]
Alguacil: [Nombre completo del alguacil]


PARTE ACTORA / DEMANDANTE
────────────────────────────────────────────────────────────────
Nombre: [Nombre completo]
Nacionalidad: [Nacionalidad]
Edad: [Edad]
Estado Civil: [Estado civil]
Profesión: [Profesión u ocupación]
Cédula/RNC: [Número de cédula o RNC]
Domicilio: [Dirección completa]


ABOGADO APODERADO
────────────────────────────────────────────────────────────────
Nombre: [Nombre completo del abogado]
Cédula: [Número de cédula]
Matrícula: [Número de matrícula/CARD]
Dirección: [Dirección del despacho]
Teléfono: [Teléfono de contacto]
Email: [Correo electrónico]


PARTE DEMANDADA
────────────────────────────────────────────────────────────────
Nombre: [Nombre completo o razón social]
Nacionalidad: [Nacionalidad]
Cédula/RNC: [Número de cédula o RNC]
Domicilio: [Dirección completa]


TRIBUNAL
────────────────────────────────────────────────────────────────
Nombre: [Nombre del tribunal o juzgado]
Sala: [Sala correspondiente]
Materia: [Materia del tribunal]
Ubicación: [Dirección del tribunal]
Expediente: [Número de expediente si aplica]


OBJETO DE LA ACCIÓN
────────────────────────────────────────────────────────────────
[Descripción breve y precisa del objeto de la demanda o acción]


HECHOS
────────────────────────────────────────────────────────────────
[NOTA: Narrar los hechos en orden cronológico. Incluir fechas exactas, documentos, comunicaciones y circunstancias relevantes.]

PRIMERO: [Primer hecho relevante]

SEGUNDO: [Segundo hecho relevante]

TERCERO: [Continuar según sea necesario]


FUNDAMENTOS DE DERECHO
────────────────────────────────────────────────────────────────
[NOTA: Citar los artículos de ley aplicables y al menos 2 precedentes jurisprudenciales con sus datos completos: órgano, sala, número de sentencia, fecha y URL oficial si está disponible.]

[Fundamento legal y jurisprudencial]


PRETENSIONES
────────────────────────────────────────────────────────────────
[NOTA: Enumerar claramente las peticiones al tribunal]

PRIMERO: [Primera pretensión]

SEGUNDO: [Segunda pretensión]

TERCERO: [Continuar según sea necesario]


DOCUMENTOS ANEXOS
────────────────────────────────────────────────────────────────
[Listar los documentos que se anexan como prueba]

1. [Documento 1]
2. [Documento 2]
3. [Continuar según sea necesario]


CUANTÍA
────────────────────────────────────────────────────────────────
[Si aplica, indicar el monto reclamado en RD$ y en letras]


═══════════════════════════════════════════════════════════════
FIRMA Y SELLO DEL ABOGADO
[Nombre del abogado]
[Matrícula No.]
════════════════════════════════════════════════════════════════
`.trim();
};

export function ManualEditorFlow({ actInfo }: ManualEditorFlowProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState(() => getTemplate(actInfo));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Extraer datos básicos del contenido
      const demandanteMatch = content.match(/PARTE ACTORA[\s\S]*?Nombre:\s*\[?([^\]]+?)\]?/);
      const demandadoMatch = content.match(/PARTE DEMANDADA[\s\S]*?Nombre:\s*\[?([^\]]+?)\]?/);
      const tribunalMatch = content.match(/TRIBUNAL[\s\S]*?Nombre:\s*\[?([^\]]+?)\]?/);

      const demandanteNombre = demandanteMatch?.[1]?.trim() || "N/D";
      const demandadoNombre = demandadoMatch?.[1]?.trim() || "N/D";
      const juzgado = tribunalMatch?.[1]?.trim() || "N/D";

      const { data, error } = await supabase
        .from("legal_documents")
        .insert({
          user_id: user.id,
          tipo_documento: actInfo.act.id,
          materia: actInfo.matter.name,
          titulo: `${actInfo.act.name} - ${demandanteNombre} vs ${demandadoNombre}`,
          contenido: content,
          demandante_nombre: demandanteNombre,
          demandado_nombre: demandadoNombre,
          juzgado: juzgado,
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Document saved:", data);
      
      toast({
        title: "✓ Guardado",
        description: "El documento ha sido guardado en tu repositorio.",
      });
    } catch (error: any) {
      console.error("Error saving document:", error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el documento.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      
      // Dividir contenido en líneas y crear párrafos
      const lines = content.split('\n');
      const paragraphs = lines.map(line => {
        // Detectar encabezados (líneas en mayúsculas o con separadores)
        if (line.match(/^═+$/) || line.match(/^─+$/)) {
          return new Paragraph({ text: '' }); // Salto de línea
        }
        
        if (line === line.toUpperCase() && line.trim().length > 0 && !line.startsWith('[')) {
          return new Paragraph({
            text: line.trim(),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          });
        }
        
        return new Paragraph({
          text: line,
          spacing: { after: 100 },
        });
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `${new Date().toISOString().split('T')[0]}_${actInfo.act.id}_manual.docx`;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "✓ Descargado",
        description: "Documento descargado en formato Word.",
      });
    } catch (error) {
      console.error("Error downloading:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento.",
        variant: "destructive",
      });
    }
  };

  const wordCount = content.trim().split(/\s+/).length;
  const charCount = content.length;

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Plantilla con instrucciones</AlertTitle>
        <AlertDescription>
          Esta plantilla incluye notas entre corchetes []. Complete los campos necesarios y
          elimine las notas explicativas antes de generar el documento final.
        </AlertDescription>
      </Alert>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Editor de {actInfo.act.name}
          </CardTitle>
          <CardDescription>
            Edita libremente el contenido. Las secciones marcadas son sugerencias que puedes modificar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="font-mono text-sm min-h-[600px] resize-none"
            placeholder="Escribe aquí el contenido del documento..."
          />
          
          {/* Stats */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{wordCount.toLocaleString()} palabras</span>
            <span>{charCount.toLocaleString()} caracteres</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setContent(getTemplate(actInfo))}
        >
          Restablecer plantilla
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Guardando..." : "Guardar borrador"}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Descargar Word
          </Button>
        </div>
      </div>
    </div>
  );
}
