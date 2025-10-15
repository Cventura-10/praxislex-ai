import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotarialActs } from "@/hooks/useNotarialActs";
import { NotarialActTemplate, NotarialActField } from "@/lib/notarialTemplates";
import { NotarioSelector } from "@/components/legal-acts/ProfessionalSelectors";
import { ArrowLeft, Save, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface NotarialActWizardProps {
  template: NotarialActTemplate;
  onCancel: () => void;
  onSuccess: () => void;
}

export function NotarialActWizard({ template, onCancel, onSuccess }: NotarialActWizardProps) {
  const [formData, setFormData] = useState<Record<string, any>>({
    notario_colegio: 'Colegio de Notarios de la República Dominicana'
  });
  const [selectedNotario, setSelectedNotario] = useState<string | null>(null);
  const { createAct } = useNotarialActs();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autorelleno de datos del notario
  const handleNotarioChange = (notario: any) => {
    if (notario) {
      setSelectedNotario(notario.id);
    } else {
      setSelectedNotario(null);
    }
  };

  const handleNotarioFieldsUpdate = (fields: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      notario_nombre: fields.notario_nombre || '',
      notario_matricula: fields.notario_matricula || '',
      notario_colegio: fields.notario_colegio || 'Colegio de Notarios de la República Dominicana',
      notario_estudio: fields.notario_oficina || '',
    }));
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const shouldShowField = (field: NotarialActField): boolean => {
    if (!field.showIf) return true;
    return field.showIf(formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar campos requeridos
      const missingFields = template.fields
        .filter(f => f.required && shouldShowField(f))
        .filter(f => !formData[f.id] || formData[f.id] === '');

      if (missingFields.length > 0) {
        toast({
          title: "Campos requeridos faltantes",
          description: `Por favor complete: ${missingFields.map(f => f.label).join(', ')}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Crear el acto notarial
      const actData = {
        tipo_acto: template.tipo_acto,
        acto_especifico: template.actId,
        titulo: formData.titulo || template.titulo,
        numero_acto: formData.numero_acto,
        numero_protocolo: formData.numero_protocolo || formData.numero_acta,
        folios: formData.folios ? parseInt(formData.folios) : 1,
        fecha_instrumentacion: formData.fecha_instrumentacion || formData.fecha || new Date().toISOString(),
        ciudad: formData.ciudad,
        provincia: formData.provincia,
        comparecientes: extractComparecientes(formData),
        testigos: template.requiere_testigos ? extractTestigos(formData) : null,
        objeto: formData.objeto_declaracion || formData.objeto_venta || formData.finalidad || '',
        contenido_completo: JSON.stringify(formData),
        firmado: false,
        notario_id: selectedNotario || null,
      };

      await createAct(actData);
      
      toast({
        title: "Acto notarial creado",
        description: "El acto ha sido guardado exitosamente.",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error creating notarial act:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el acto notarial",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractComparecientes = (data: Record<string, any>): any[] => {
    const comparecientes: any[] = [];
    
    // Extraer según el tipo de acto
    if (data.solicitante_nombre) {
      comparecientes.push({
        rol: 'solicitante',
        nombre: data.solicitante_nombre,
        cedula: data.solicitante_cedula,
        domicilio: data.solicitante_domicilio,
      });
    }

    if (data.prestamista_nombre) {
      comparecientes.push({
        rol: 'prestamista',
        nombre: data.prestamista_nombre,
        cedula: data.prestamista_cedula,
        estado_civil: data.prestamista_estado_civil,
      });
    }

    if (data.prestatario_nombre) {
      comparecientes.push({
        rol: 'prestatario',
        nombre: data.prestatario_nombre,
        cedula: data.prestatario_cedula,
      });
    }

    if (data.vendedor_nombre) {
      comparecientes.push({
        rol: 'vendedor',
        nombre: data.vendedor_nombre,
        cedula: data.vendedor_cedula,
      });
    }

    if (data.comprador_nombre) {
      comparecientes.push({
        rol: 'comprador',
        nombre: data.comprador_nombre,
        cedula: data.comprador_cedula,
      });
    }

    if (data.declarante_nombre) {
      comparecientes.push({
        rol: 'declarante',
        nombre: data.declarante_nombre,
        cedula: data.declarante_cedula,
        domicilio: data.declarante_domicilio,
      });
    }

    return comparecientes;
  };

  const extractTestigos = (data: Record<string, any>): any[] => {
    const testigos: any[] = [];
    
    if (data.testigo1_nombre) {
      testigos.push({
        nombre: data.testigo1_nombre,
        cedula: data.testigo1_cedula,
      });
    }

    if (data.testigo2_nombre) {
      testigos.push({
        nombre: data.testigo2_nombre,
        cedula: data.testigo2_cedula,
      });
    }

    if (data.testigo3_nombre) {
      testigos.push({
        nombre: data.testigo3_nombre,
        cedula: data.testigo3_cedula,
      });
    }

    return testigos;
  };

  const renderField = (field: NotarialActField) => {
    if (!shouldShowField(field)) return null;

    const commonProps = {
      id: field.id,
      required: field.required,
    };

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'money':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              {...commonProps}
              type={field.type === 'money' || field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              placeholder={field.placeholder}
              value={formData[field.id] || (field.placeholder && field.id === 'notario_colegio' ? field.placeholder : '')}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              step={field.type === 'money' ? '0.01' : undefined}
            />
            {field.helpText && (
              <p className="text-sm text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              rows={4}
            />
            {field.helpText && (
              <p className="text-sm text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={formData[field.id] || ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Seleccione ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-sm text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'array':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              placeholder={field.placeholder || "Ingrese la información, uno por línea"}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              rows={5}
            />
            {field.helpText && (
              <p className="text-sm text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{template.titulo}</h2>
          <p className="text-muted-foreground">{template.descripcion}</p>
        </div>
      </div>

      {/* Badge de tipo de acto */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {template.tipo_acto.replace('_', ' ')}
        </Badge>
        {template.requiere_testigos && (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
            Requiere Testigos Instrumentales
          </Badge>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              <FileText className="h-5 w-5 inline mr-2" />
              Datos del Acto Notarial
            </CardTitle>
            <CardDescription>
              Complete todos los campos requeridos (marcados con *)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {/* Selector de Notario (Autorelleno) */}
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                  <Label>Notario Actuante</Label>
                  <NotarioSelector
                    value={selectedNotario}
                    onChange={handleNotarioChange}
                    onFieldUpdate={handleNotarioFieldsUpdate}
                  />
                  <p className="text-xs text-muted-foreground">
                    Al seleccionar un notario, sus datos se autocompletarán en el acto
                  </p>
                </div>

                {/* Campos dinámicos */}
                {template.fields.map(field => renderField(field))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Guardar Acto Notarial'}
          </Button>
        </div>
      </form>
    </div>
  );
}
