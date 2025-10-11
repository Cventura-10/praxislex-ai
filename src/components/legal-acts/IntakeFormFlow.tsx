import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

      setGeneratedDocument(data.document);
      
      toast({
        title: "✓ Documento generado",
        description: "El documento ha sido generado exitosamente.",
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

  if (generatedDocument) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Documento Generado
            </CardTitle>
            <CardDescription>
              Revisa el documento generado y descárgalo en formato Word
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentViewer 
              content={generatedDocument}
              title={actInfo.act.name}
            />
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setGeneratedDocument(null)}
              >
                Editar datos
              </Button>
              <Button onClick={() => {
                // TODO: Implementar descarga
                toast({
                  title: "Descarga",
                  description: "Funcionalidad de descarga en desarrollo.",
                });
              }}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Word
              </Button>
            </div>
          </CardContent>
        </Card>
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
