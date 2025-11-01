import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { useDocumentTemplates } from "@/hooks/useDocumentTemplates";

interface TemplateSelectorProps {
  categoria?: "judicial" | "extrajudicial" | "notarial";
  value?: string;
  onChange: (slug: string) => void;
}

export const TemplateSelector = ({ categoria, value, onChange }: TemplateSelectorProps) => {
  const { data: templates, isLoading } = useDocumentTemplates(categoria);

  if (isLoading) {
    return (
      <div>
        <Label>Plantilla del Documento</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div>
        <Label>Plantilla del Documento</Label>
        <p className="text-sm text-muted-foreground mt-2">
          No hay plantillas disponibles para esta categoría
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Plantilla del Documento</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar plantilla..." />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.slug}>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{template.nombre}</span>
                <Badge variant="outline" className="ml-2">
                  v{template.version}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && templates.find(t => t.slug === value)?.descripcion && (
        <p className="text-sm text-muted-foreground">
          {templates.find(t => t.slug === value)?.descripcion}
        </p>
      )}
    </div>
  );
};
