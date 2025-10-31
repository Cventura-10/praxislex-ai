import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LegalActBundle, ActFieldSchema } from "@/lib/legalActsBundle";
import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import { ClientSelector } from "./ClientSelector";
import { TribunalSelector } from "./TribunalSelector";
import { useClients } from "@/hooks/useClients";
import { useLawyers } from "@/hooks/useLawyers";
import { useNotarios } from "@/hooks/useNotarios";
import { useAlguaciles } from "@/hooks/useAlguaciles";
import { usePeritos } from "@/hooks/usePeritos";
import { useTasadores } from "@/hooks/useTasadores";
import { Document, Packer, Paragraph, TextRun } from "docx";

interface BundleIntakeFormProps {
  actBundle: LegalActBundle;
}

export function BundleIntakeForm({ actBundle }: BundleIntakeFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string>("");

  const { clients } = useClients();
  const { lawyers } = useLawyers();
  const { notarios } = useNotarios();
  const { alguaciles } = useAlguaciles();
  const { peritos } = usePeritos();
  const { tasadores } = useTasadores();

  // Initialize form with defaults
  useEffect(() => {
    const defaults: Record<string, any> = {};
    actBundle.input_schema_json.fields.forEach(field => {
      if (field.default !== undefined) {
        defaults[field.name] = field.default;
      }
    });
    setFormData(prev => ({ ...prev, ...defaults }));
  }, [actBundle]);

  const fields = actBundle.input_schema_json.fields;
  const fieldsPerStep = 5;
  const totalSteps = Math.ceil(fields.length / fieldsPerStep);
  const currentFields = fields.slice(currentStep * fieldsPerStep, (currentStep + 1) * fieldsPerStep);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleListAdd = (fieldName: string) => {
    const currentList = formData[fieldName] || [];
    setFormData(prev => ({ ...prev, [fieldName]: [...currentList, ""] }));
  };

  const handleListChange = (fieldName: string, index: number, value: string) => {
    const currentList = [...(formData[fieldName] || [])];
    currentList[index] = value;
    setFormData(prev => ({ ...prev, [fieldName]: currentList }));
  };

  const handleListRemove = (fieldName: string, index: number) => {
    const currentList = [...(formData[fieldName] || [])];
    currentList.splice(index, 1);
    setFormData(prev => ({ ...prev, [fieldName]: currentList }));
  };

  const canProceedToNext = () => {
    return currentFields.every(field => {
      if (!field.required) return true;
      const value = formData[field.name];
      if (field.type === 'list') return value && value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleGenerate();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const response = await supabase.functions.invoke("generate-legal-doc", {
        body: {
          actSlug: actBundle.slug,
          formData,
          template: actBundle.plantilla_md,
          materia: actBundle.materia,
          naturaleza: actBundle.naturaleza,
          ejecutor: actBundle.ejecutor,
        }
      });

      if (response.error) throw response.error;
      
      setGeneratedDocument(response.data.content);
      toast.success("Documento generado exitosamente");
    } catch (error: any) {
      console.error("Error generating document:", error);
      toast.error(error.message || "Error al generar el documento");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = async () => {
    try {
      const doc = new Document({
        sections: [{
          children: generatedDocument.split('\n').map(line => 
            new Paragraph({ children: [new TextRun(line)] })
          )
        }]
      });

      const blob = await Packer.toBlob(doc);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${actBundle.slug}-${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Documento descargado");
    } catch (error: any) {
      toast.error("Error al descargar el documento");
    }
  };

  const renderField = (field: ActFieldSchema) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'party':
        return (
          <ClientSelector
            label={field.label}
            fieldPrefix={field.name.replace(/_id$/, '')}
            value={value}
            onChange={(val) => handleFieldChange(field.name, val)}
            onFieldUpdate={(fields) => setFormData(prev => ({ ...prev, ...fields }))}
            required={field.required}
          />
        );

      case 'professional':
        const profData = field.subtype === 'abogado' ? lawyers :
                        field.subtype === 'notario' ? notarios :
                        field.subtype === 'alguacil' ? alguaciles :
                        field.subtype === 'perito' ? peritos :
                        field.subtype === 'tasador' ? tasadores : [];
        
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleccionar ${field.subtype}`} />
            </SelectTrigger>
            <SelectContent>
              {profData.map((prof: any) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.nombre} {prof.matricula ? `(${prof.matricula})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'select':
        if (field.name === 'tribunal') {
          return <TribunalSelector value={value} onChange={(val) => handleFieldChange(field.name, val)} required={field.required} />;
        }
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={4}
            placeholder={field.label}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label>{field.label}</Label>
          </div>
        );

      case 'list':
        const list = value || [];
        return (
          <div className="space-y-2">
            {list.map((item: string, idx: number) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => handleListChange(field.name, idx, e.target.value)}
                  placeholder={`${field.label} #${idx + 1}`}
                />
                <Button variant="destructive" size="sm" onClick={() => handleListRemove(field.name, idx)}>
                  Eliminar
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => handleListAdd(field.name)}>
              + Agregar {field.label}
            </Button>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case 'currency':
      case 'number':
      case 'integer':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
          />
        );
    }
  };

  if (generatedDocument) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setGeneratedDocument("")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver a editar
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleDownloadWord}>
              <FileText className="mr-2 h-4 w-4" />
              Descargar Word
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="prose prose-sm max-w-none p-6">
            <pre className="whitespace-pre-wrap font-serif">{generatedDocument}</pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{actBundle.title || actBundle.slug}</h2>
        <div className="text-sm text-muted-foreground">
          Paso {currentStep + 1} de {totalSteps}
        </div>
      </div>

      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {actBundle.materia} • {actBundle.naturaleza} • {actBundle.ejecutor}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceedToNext() || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : currentStep === totalSteps - 1 ? (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generar Documento
            </>
          ) : (
            <>
              Siguiente
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
