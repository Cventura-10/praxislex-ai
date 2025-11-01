import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ClientSelector } from "./ClientSelector";
import { LocationSelect } from "./LocationSelect";
import { Trash2, UserPlus, Users, ChevronDown, ChevronUp } from "lucide-react";
import { z } from "zod";

// Schema de validación mejorado para contraparte
const contraparteSchema = z.object({
  cliente_id: z.string().nullable().optional(),
  nombre: z.string().trim().min(1, "Nombre requerido").max(200, "Máximo 200 caracteres"),
  cedula: z.string().trim().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  direccion: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  nacionalidad: z.string().trim().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  estado_civil: z.string().trim().max(50, "Máximo 50 caracteres").optional().or(z.literal("")),
  profesion: z.string().trim().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  provincia_id: z.number().nullable().optional(),
  municipio_id: z.number().nullable().optional(),
  sector_id: z.number().nullable().optional(),
});

export interface ContraparteData {
  id: string;
  cliente_id: string | null;
  nombre: string;
  cedula: string;
  direccion: string;
  nacionalidad: string;
  estado_civil: string;
  profesion: string;
  provincia_id: number | null;
  municipio_id: number | null;
  sector_id: number | null;
}

interface ContraparteManagerProps {
  contrapartes: ContraparteData[];
  onChange: (contrapartes: ContraparteData[]) => void;
  title?: string;
  description?: string;
}

export function ContraparteManager({
  contrapartes,
  onChange,
  title = "Contraparte / Demandado(s)",
  description = "Agrega las personas o entidades que actúan como contraparte en este acto"
}: ContraparteManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddContraparte = () => {
    const newContraparte: ContraparteData = {
      id: crypto.randomUUID(),
      cliente_id: null,
      nombre: "",
      cedula: "",
      direccion: "",
      nacionalidad: "",
      estado_civil: "",
      profesion: "",
      provincia_id: null,
      municipio_id: null,
      sector_id: null,
    };
    onChange([...contrapartes, newContraparte]);
    setExpandedIndex(contrapartes.length);
  };

  const handleRemoveContraparte = (index: number) => {
    onChange(contrapartes.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleClientSelect = (index: number, clientId: string | null) => {
    const updated = [...contrapartes];
    updated[index] = { ...updated[index], cliente_id: clientId };
    onChange(updated);
  };

  const handleFieldUpdate = (index: number, fields: Record<string, any>) => {
    const updated = [...contrapartes];
    const prefix = "contraparte";
    
    // Mapear campos del selector al objeto contraparte
    const mappedFields: Record<string, any> = {};
    Object.keys(fields).forEach(key => {
      const cleanKey = key.replace(`${prefix}_`, '');
      mappedFields[cleanKey] = fields[key];
    });

    updated[index] = { 
      ...updated[index], 
      nombre: mappedFields.nombre || updated[index].nombre,
      cedula: mappedFields.cedula || updated[index].cedula,
      direccion: mappedFields.direccion || updated[index].direccion,
      nacionalidad: mappedFields.nacionalidad || updated[index].nacionalidad,
      estado_civil: mappedFields.estado_civil || updated[index].estado_civil,
      profesion: mappedFields.profesion || updated[index].profesion,
      provincia_id: mappedFields.provincia_id !== undefined ? mappedFields.provincia_id : updated[index].provincia_id,
      municipio_id: mappedFields.municipio_id !== undefined ? mappedFields.municipio_id : updated[index].municipio_id,
      sector_id: mappedFields.sector_id !== undefined ? mappedFields.sector_id : updated[index].sector_id,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {title}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Button onClick={handleAddContraparte} variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar contraparte
        </Button>
      </div>

      {contrapartes.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay contrapartes agregadas</p>
          <p className="text-sm">Haz clic en "Agregar contraparte" para comenzar</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {contrapartes.map((contraparte, index) => (
            <Card key={contraparte.id} className="p-4 hover:bg-accent/5 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="flex-1 flex items-center justify-between gap-2 text-left hover:text-primary transition-colors"
                >
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Contraparte #{index + 1}
                      {contraparte.nombre && `: ${contraparte.nombre}`}
                    </p>
                    {contraparte.cedula && (
                      <p className="text-sm text-muted-foreground ml-6">Cédula: {contraparte.cedula}</p>
                    )}
                  </div>
                  {expandedIndex === index ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <Button
                  onClick={() => handleRemoveContraparte(index)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {expandedIndex === index && (
                <div className="space-y-4 mt-4 pt-4 border-t border-border">
                  <ClientSelector
                    label={`Datos de Contraparte #${index + 1}`}
                    fieldPrefix="contraparte"
                    value={contraparte.cliente_id}
                    onChange={(clientId) => handleClientSelect(index, clientId)}
                    onFieldUpdate={(fields) => handleFieldUpdate(index, fields)}
                    required
                  />
                  
                  {/* LocationSelect adicional para contraparte */}
                  <div className="pt-4 border-t border-border">
                    <LocationSelect
                      control={{
                        register: () => ({}),
                        unregister: () => {},
                        getFieldState: () => ({ invalid: false, isDirty: false, isTouched: false, error: undefined }),
                        _subjects: { state: { next: () => {}, subscribe: () => ({ unsubscribe: () => {} }) } },
                        _formState: { isDirty: false, isSubmitting: false, isSubmitted: false, isValid: true },
                      } as any}
                      setValue={(name: string, value: any) => {
                        const updated = [...contrapartes];
                        if (name.includes('provincia_id')) {
                          updated[index] = { ...updated[index], provincia_id: value };
                        } else if (name.includes('municipio_id')) {
                          updated[index] = { ...updated[index], municipio_id: value };
                        } else if (name.includes('sector_id')) {
                          updated[index] = { ...updated[index], sector_id: value };
                        }
                        onChange(updated);
                      }}
                      nameProvincia={`contraparte_${index}_provincia_id`}
                      nameMunicipio={`contraparte_${index}_municipio_id`}
                      nameSector={`contraparte_${index}_sector_id`}
                      disabled={false}
                      labels={{
                        provincia: "Provincia de domicilio",
                        municipio: "Municipio de domicilio",
                        sector: "Sector de domicilio",
                      }}
                    />
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
