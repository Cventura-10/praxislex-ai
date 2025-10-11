import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { DocumentViewer } from "@/components/DocumentViewer";
import type { LegalAct, LegalMatter, LegalCategory } from "@/lib/legalActsData";

interface IntakeFormFlowProps {
  actInfo: {
    category: LegalCategory;
    matter: LegalMatter;
    act: LegalAct;
  };
}

// Formulario básico genérico - en producción se crearían formularios específicos por acto
const GENERIC_INTAKE_FIELDS = [
  { key: "demandante_nombre", label: "Demandante - Nombre Completo", type: "text", required: true },
  { key: "demandante_cedula", label: "Cédula/RNC", type: "text" },
  { key: "demandante_domicilio", label: "Domicilio", type: "textarea" },
  { key: "demandado_nombre", label: "Demandado - Nombre/Razón Social", type: "text", required: true },
  { key: "demandado_cedula", label: "Cédula/RNC", type: "text" },
  { key: "demandado_domicilio", label: "Domicilio", type: "textarea" },
  { key: "tribunal_nombre", label: "Tribunal/Juzgado", type: "text", required: true },
  { key: "tribunal_ubicacion", label: "Ubicación del Tribunal", type: "textarea" },
  { key: "objeto", label: "Objeto de la acción", type: "textarea", required: true },
  { key: "hechos", label: "Hechos (descripción cronológica)", type: "textarea", required: true },
  { key: "fundamentos", label: "Fundamentos de derecho", type: "textarea" },
  { key: "pretensiones", label: "Pretensiones/Dispositivos", type: "textarea", required: true },
  { key: "monto", label: "Cuantía (si aplica)", type: "text" },
  { key: "anexos", label: "Documentos anexos", type: "textarea" },
];

export function IntakeFormFlow({ actInfo }: IntakeFormFlowProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Agrupar campos en pasos (cada 5 campos)
  const fieldsPerStep = 5;
  const totalSteps = Math.ceil(GENERIC_INTAKE_FIELDS.length / fieldsPerStep);
  const currentFields = GENERIC_INTAKE_FIELDS.slice(
    currentStep * fieldsPerStep,
    (currentStep + 1) * fieldsPerStep
  );

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const canProceedToNext = () => {
    return currentFields.every(
      (field) => !field.required || (formData[field.key] && formData[field.key].trim())
    );
  };

  const handleNext = () => {
    if (!canProceedToNext()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleGenerate = async () => {
    if (!canProceedToNext()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Generar documento con IA
      const { data, error } = await supabase.functions.invoke("generate-legal-doc", {
        body: {
          actType: actInfo.act.id,
          actName: actInfo.act.name,
          materia: actInfo.matter.name,
          category: actInfo.category.name,
          formData: formData,
        },
      });

      if (error) throw error;

      const generatedContent = data.document;
      setGeneratedDocument(generatedContent);
      
      toast({
        title: "✓ Documento generado",
        description: "Revisa el documento y guárdalo en tu repositorio cuando estés listo.",
      });
    } catch (error: any) {
      console.error("Error generating document:", error);
      toast({
        title: "Error al generar",
        description: error.message || "No se pudo generar el documento.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToRepository = async () => {
    if (!generatedDocument) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: savedDoc, error: saveError } = await supabase
        .from("legal_documents")
        .insert({
          user_id: user.id,
          tipo_documento: actInfo.act.id,
          materia: actInfo.matter.name,
          titulo: `${actInfo.act.name} - ${formData.demandante_nombre || 'N/D'} vs ${formData.demandado_nombre || 'N/D'}`,
          contenido: generatedDocument,
          demandante_nombre: formData.demandante_nombre,
          demandado_nombre: formData.demandado_nombre,
          juzgado: formData.tribunal_nombre,
          numero_expediente: formData.numero_expediente || null,
          case_number: formData.case_number || null,
        })
        .select()
        .single();

      if (saveError) throw saveError;

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

  if (generatedDocument) {
    return (
      <div className="space-y-6">
        {/* Vista previa del documento */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Eye className="h-5 w-5 text-primary" />
                  Vista Previa - {actInfo.act.name}
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Documento generado exitosamente. Revisa el contenido antes de descargar.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="h-fit">Generado con IA</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-white dark:bg-gray-900 border-x">
              <DocumentViewer 
                content={generatedDocument}
                title={actInfo.act.name}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información del documento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalles del Documento</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Demandante</p>
              <p className="font-medium">{formData.demandante_nombre || "No especificado"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Demandado</p>
              <p className="font-medium">{formData.demandado_nombre || "No especificado"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Tribunal</p>
              <p className="font-medium">{formData.tribunal_nombre || "No especificado"}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Acciones */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => setGeneratedDocument(null)}
          >
            ← Editar Datos
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSaveToRepository}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar en Repositorio"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedDocument);
                toast({
                  title: "✓ Copiado",
                  description: "Documento copiado al portapapeles.",
                });
              }}
            >
              Copiar Texto
            </Button>
            <Button onClick={async () => {
              try {
                const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import('docx');
                
                const doc = new Document({
                  sections: [{
                    properties: {},
                    children: [
                      new Paragraph({
                        text: actInfo.act.name,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "DEMANDANTE: ",
                            bold: true,
                          }),
                          new TextRun(formData.demandante_nombre || "N/D"),
                        ],
                        spacing: { after: 200 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "DEMANDADO: ",
                            bold: true,
                          }),
                          new TextRun(formData.demandado_nombre || "N/D"),
                        ],
                        spacing: { after: 200 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "TRIBUNAL: ",
                            bold: true,
                          }),
                          new TextRun(formData.tribunal_nombre || "N/D"),
                        ],
                        spacing: { after: 400 },
                      }),
                      ...generatedDocument.split('\n').map(line => 
                        new Paragraph({
                          text: line,
                          spacing: { after: 100 },
                        })
                      ),
                    ],
                  }],
                });

                const blob = await Packer.toBlob(doc);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const fileName = `${new Date().toISOString().split('T')[0]}_${actInfo.act.id}_${formData.demandante_nombre?.replace(/\s+/g, '_') || 'documento'}.docx`;
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
            }} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar Word
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Paso {currentStep + 1} de {totalSteps}
              </span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} />
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del {actInfo.act.name}</CardTitle>
          <CardDescription>
            Completa los siguientes campos para generar el documento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.key}
                  value={formData[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <Input
                  id={field.key}
                  type={field.type}
                  value={formData[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Anterior
        </Button>

        {currentStep < totalSteps - 1 ? (
          <Button onClick={handleNext}>
            Siguiente
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Documento
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
