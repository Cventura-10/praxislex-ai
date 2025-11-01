import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, UserPlus, Scale } from "lucide-react";
import { z } from "zod";

// Schema de validación para abogado contrario
const abogadoContrarioSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre requerido").max(200),
  cedula: z.string().trim().max(50),
  matricula_card: z.string().trim().max(50),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  telefono: z.string().trim().max(50),
  direccion: z.string().trim().max(500),
});

export interface AbogadoContrarioData {
  id: string;
  nombre: string;
  cedula: string;
  matricula_card: string;
  email: string;
  telefono: string;
  direccion: string;
}

interface AbogadoContrarioManagerProps {
  abogados: AbogadoContrarioData[];
  onChange: (abogados: AbogadoContrarioData[]) => void;
  title?: string;
  description?: string;
}

export function AbogadoContrarioManager({
  abogados,
  onChange,
  title = "Abogado(s) de la Contraparte",
  description = "Datos de los abogados que representan a la contraparte"
}: AbogadoContrarioManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  const handleAddAbogado = () => {
    const newAbogado: AbogadoContrarioData = {
      id: crypto.randomUUID(),
      nombre: "",
      cedula: "",
      matricula_card: "",
      email: "",
      telefono: "",
      direccion: "",
    };
    onChange([...abogados, newAbogado]);
    setExpandedIndex(abogados.length);
  };

  const handleRemoveAbogado = (index: number) => {
    onChange(abogados.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
    // Limpiar errores
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const handleFieldChange = (index: number, field: keyof AbogadoContrarioData, value: string) => {
    const updated = [...abogados];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);

    // Validar campo individual
    try {
      const fieldSchema = abogadoContrarioSchema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Limpiar error si la validación pasa
        const newErrors = { ...errors };
        if (newErrors[index]) {
          delete newErrors[index][field];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
          setErrors(newErrors);
        }
      }
    } catch (err: any) {
      // Guardar error de validación
      const newErrors = { ...errors };
      if (!newErrors[index]) newErrors[index] = {};
      newErrors[index][field] = err.errors?.[0]?.message || "Campo inválido";
      setErrors(newErrors);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            {title}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Button onClick={handleAddAbogado} variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar abogado
        </Button>
      </div>

      {abogados.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <Scale className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay abogados contrarios agregados</p>
          <p className="text-sm">Opcional: agrega los datos de los abogados de la contraparte</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {abogados.map((abogado, index) => (
            <Card key={abogado.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="flex-1 text-left"
                >
                  <p className="font-medium">
                    Abogado #{index + 1}
                    {abogado.nombre && `: ${abogado.nombre}`}
                  </p>
                  {abogado.matricula_card && (
                    <p className="text-sm text-muted-foreground">Mat. {abogado.matricula_card}</p>
                  )}
                </button>
                <Button
                  onClick={() => handleRemoveAbogado(index)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {expandedIndex === index && (
                <div className="space-y-4 mt-4 p-4 border border-border rounded-lg bg-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`nombre-${index}`}>Nombre completo *</Label>
                      <Input
                        id={`nombre-${index}`}
                        value={abogado.nombre}
                        onChange={(e) => handleFieldChange(index, "nombre", e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        maxLength={200}
                      />
                      {errors[index]?.nombre && (
                        <p className="text-xs text-destructive">{errors[index].nombre}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`cedula-${index}`}>Cédula</Label>
                      <Input
                        id={`cedula-${index}`}
                        value={abogado.cedula}
                        onChange={(e) => handleFieldChange(index, "cedula", e.target.value)}
                        placeholder="000-0000000-0"
                        maxLength={50}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`matricula-${index}`}>Matrícula CARD</Label>
                      <Input
                        id={`matricula-${index}`}
                        value={abogado.matricula_card}
                        onChange={(e) => handleFieldChange(index, "matricula_card", e.target.value)}
                        placeholder="Ej: 12345"
                        maxLength={50}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`email-${index}`}>Email</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={abogado.email}
                        onChange={(e) => handleFieldChange(index, "email", e.target.value)}
                        placeholder="abogado@ejemplo.com"
                        maxLength={255}
                      />
                      {errors[index]?.email && (
                        <p className="text-xs text-destructive">{errors[index].email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`telefono-${index}`}>Teléfono</Label>
                      <Input
                        id={`telefono-${index}`}
                        value={abogado.telefono}
                        onChange={(e) => handleFieldChange(index, "telefono", e.target.value)}
                        placeholder="809-000-0000"
                        maxLength={50}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`direccion-${index}`}>Dirección del bufete</Label>
                      <Input
                        id={`direccion-${index}`}
                        value={abogado.direccion}
                        onChange={(e) => handleFieldChange(index, "direccion", e.target.value)}
                        placeholder="Calle, número, sector, ciudad"
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
