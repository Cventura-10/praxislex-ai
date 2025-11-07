import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2, UserPlus, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { LocationSelect } from "@/components/legal-acts/LocationSelect";
import { z } from "zod";
import { SimpleLocationSelect } from "@/components/legal-acts/SimpleLocationSelect";

// Schema de validación mejorado para abogado contrario
const abogadoContrarioSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre requerido").max(200, "Máximo 200 caracteres"),
  cedula: z.string().trim().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  matricula_card: z.string().trim().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(255, "Máximo 255 caracteres").optional().or(z.literal("")),
  telefono: z.string().trim().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  direccion: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  provincia_id: z.number().nullable().optional(),
  municipio_id: z.number().nullable().optional(),
  sector_id: z.number().nullable().optional(),
});

export interface AbogadoContrarioData {
  id: string;
  nombre: string;
  cedula: string;
  matricula_card: string;
  email: string;
  telefono: string;
  direccion: string;
  provincia_id?: number | null;
  municipio_id?: number | null;
  sector_id?: number | null;
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
      provincia_id: null,
      municipio_id: null,
      sector_id: null,
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
            <Card key={abogado.id} className="p-4 hover:bg-accent/5 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="flex-1 flex items-center justify-between gap-2 text-left hover:text-primary transition-colors"
                >
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" />
                      Abogado #{index + 1}
                      {abogado.nombre && `: ${abogado.nombre}`}
                    </p>
                    {abogado.matricula_card && (
                      <p className="text-sm text-muted-foreground ml-6">Mat. CARD: {abogado.matricula_card}</p>
                    )}
                  </div>
                  {expandedIndex === index ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                <div className="space-y-4 mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`nombre-${index}`}>
                        Nombre completo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`nombre-${index}`}
                        value={abogado.nombre}
                        onChange={(e) => handleFieldChange(index, "nombre", e.target.value)}
                        placeholder="Ej: Juan Pérez Rodríguez"
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
                        maxLength={20}
                      />
                      {errors[index]?.cedula && (
                        <p className="text-xs text-destructive">{errors[index].cedula}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`matricula-${index}`}>Matrícula CARD</Label>
                      <Input
                        id={`matricula-${index}`}
                        value={abogado.matricula_card}
                        onChange={(e) => handleFieldChange(index, "matricula_card", e.target.value)}
                        placeholder="Ej: 12345"
                        maxLength={20}
                      />
                      {errors[index]?.matricula_card && (
                        <p className="text-xs text-destructive">{errors[index].matricula_card}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`telefono-${index}`}>Teléfono</Label>
                      <Input
                        id={`telefono-${index}`}
                        value={abogado.telefono}
                        onChange={(e) => handleFieldChange(index, "telefono", e.target.value)}
                        placeholder="809-000-0000"
                        maxLength={20}
                      />
                      {errors[index]?.telefono && (
                        <p className="text-xs text-destructive">{errors[index].telefono}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
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

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`direccion-${index}`}>Dirección del bufete</Label>
                      <Input
                        id={`direccion-${index}`}
                        value={abogado.direccion}
                        onChange={(e) => handleFieldChange(index, "direccion", e.target.value)}
                        placeholder="Calle, número, edificio"
                        maxLength={500}
                      />
                      {errors[index]?.direccion && (
                        <p className="text-xs text-destructive">{errors[index].direccion}</p>
                      )}
                    </div>
                  </div>

                  {/* Ubicación geográfica */}
                  <div className="pt-4 border-t border-border">
                    <SimpleLocationSelect
                      valueProvincia={abogado.provincia_id ?? null}
                      valueMunicipio={abogado.municipio_id ?? null}
                      valueSector={abogado.sector_id ?? null}
                      onChangeProvincia={(v) => {
                        const updated = [...abogados];
                        updated[index] = { ...updated[index], provincia_id: v, municipio_id: null, sector_id: null };
                        onChange(updated);
                      }}
                      onChangeMunicipio={(v) => {
                        const updated = [...abogados];
                        updated[index] = { ...updated[index], municipio_id: v, sector_id: null };
                        onChange(updated);
                      }}
                      onChangeSector={(v) => {
                        const updated = [...abogados];
                        updated[index] = { ...updated[index], sector_id: v };
                        onChange(updated);
                      }}
                      labels={{
                        provincia: "Provincia del bufete",
                        municipio: "Municipio del bufete",
                        sector: "Sector del bufete",
                      }}
                    />
                  </div
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
