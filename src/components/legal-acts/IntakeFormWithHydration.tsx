import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { ClientSelector } from "./ClientSelector";
import { NotarioSelector } from "./NotarioSelector";
import { LocationSelect } from "./LocationSelect";
import { resetGeoCascade } from "@/lib/formHydrate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IntakeFormData {
  // Primera Parte
  primera_parte: {
    cliente_id?: string;
    nombre_completo?: string;
    cedula_rnc?: string;
    nacionalidad?: string;
    estado_civil?: string;
    profesion?: string;
    provincia_id?: number | null;
    municipio_id?: number | null;
    sector_id?: number | null;
    direccion?: string;
    email?: string;
    telefono?: string;
  };
  
  // Segunda Parte
  segunda_parte: {
    cliente_id?: string;
    nombre_completo?: string;
    cedula_rnc?: string;
    nacionalidad?: string;
    estado_civil?: string;
    profesion?: string;
    provincia_id?: number | null;
    municipio_id?: number | null;
    sector_id?: number | null;
    direccion?: string;
    email?: string;
    telefono?: string;
  };
  
  // Notario
  notario: {
    id?: string;
    nombre_completo?: string;
    exequatur?: string;
    cedula_mask?: string;
    oficina?: string;
    jurisdiccion?: string;
    telefono?: string;
    email?: string;
  };
  
  // Contrato
  contrato?: {
    canon_monto?: number;
    plazo_meses?: number;
  };
  
  numero_acto?: string;
  numero_folios?: number;
}

/**
 * Ejemplo de formulario de intake con hidratación automática
 * Demuestra uso de ClientSelector y NotarioSelector con react-hook-form
 */
export function IntakeFormWithHydration() {
  const form = useForm<IntakeFormData>({
    defaultValues: {
      primera_parte: {},
      segunda_parte: {},
      notario: {},
      contrato: {},
    },
  });

  const { watch, control, setValue } = form;

  // Cascada geográfica Primera Parte
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'primera_parte.provincia_id') {
        resetGeoCascade(form, 'primera_parte');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, form]);

  // Cascada geográfica Segunda Parte
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'segunda_parte.provincia_id') {
        resetGeoCascade(form, 'segunda_parte');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, form]);

  const onSubmit = (data: IntakeFormData) => {
    console.log("Form data:", data);
    // Aquí iría la generación del documento
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Primera Parte */}
      <Card>
        <CardHeader>
          <CardTitle>Primera Parte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientSelector
            label="Seleccionar Cliente"
            fieldPrefix="primera_parte"
            value={form.watch('primera_parte.cliente_id') || null}
            onChange={(id) => setValue('primera_parte.cliente_id', id || undefined)}
            form={form}
            required
          />
          
          {/* Campos autocompletados */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre Completo</Label>
              <Input {...form.register('primera_parte.nombre_completo')} readOnly />
            </div>
            <div>
              <Label>Cédula/RNC</Label>
              <Input {...form.register('primera_parte.cedula_rnc')} readOnly />
            </div>
            <div>
              <Label>Nacionalidad</Label>
              <Input {...form.register('primera_parte.nacionalidad')} readOnly />
            </div>
            <div>
              <Label>Estado Civil</Label>
              <Input {...form.register('primera_parte.estado_civil')} readOnly />
            </div>
            <div>
              <Label>Profesión</Label>
              <Input {...form.register('primera_parte.profesion')} readOnly />
            </div>
          </div>

          {/* Ubicación geográfica con cascadas */}
          <LocationSelect
            control={control}
            setValue={setValue}
            nameProvincia="primera_parte.provincia_id"
            nameMunicipio="primera_parte.municipio_id"
            nameSector="primera_parte.sector_id"
            labels={{
              provincia: "Provincia (Primera Parte)",
              municipio: "Municipio (Primera Parte)",
              sector: "Sector (Primera Parte)",
            }}
          />

          <div>
            <Label>Dirección</Label>
            <Input {...form.register('primera_parte.direccion')} />
          </div>
        </CardContent>
      </Card>

      {/* Segunda Parte */}
      <Card>
        <CardHeader>
          <CardTitle>Segunda Parte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientSelector
            label="Seleccionar Cliente"
            fieldPrefix="segunda_parte"
            value={form.watch('segunda_parte.cliente_id') || null}
            onChange={(id) => setValue('segunda_parte.cliente_id', id || undefined)}
            form={form}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre Completo</Label>
              <Input {...form.register('segunda_parte.nombre_completo')} readOnly />
            </div>
            <div>
              <Label>Cédula/RNC</Label>
              <Input {...form.register('segunda_parte.cedula_rnc')} readOnly />
            </div>
          </div>

          <LocationSelect
            control={control}
            setValue={setValue}
            nameProvincia="segunda_parte.provincia_id"
            nameMunicipio="segunda_parte.municipio_id"
            nameSector="segunda_parte.sector_id"
            labels={{
              provincia: "Provincia (Segunda Parte)",
              municipio: "Municipio (Segunda Parte)",
              sector: "Sector (Segunda Parte)",
            }}
          />
        </CardContent>
      </Card>

      {/* Notario */}
      <Card>
        <CardHeader>
          <CardTitle>Notario Público</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotarioSelector
            label="Seleccionar Notario"
            value={form.watch('notario.id') || null}
            onChange={(id) => setValue('notario.id', id || undefined)}
            form={form}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input {...form.register('notario.nombre_completo')} readOnly />
            </div>
            <div>
              <Label>Exequátur</Label>
              <Input {...form.register('notario.exequatur')} readOnly />
            </div>
            <div>
              <Label>Oficina</Label>
              <Input {...form.register('notario.oficina')} readOnly />
            </div>
            <div>
              <Label>Jurisdicción</Label>
              <Input {...form.register('notario.jurisdiccion')} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del Acto */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Acto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Número de Acto (Auto-generado)</Label>
            <Input {...form.register('numero_acto')} readOnly placeholder="ACT-2025-###" />
          </div>
          
          <div>
            <Label>Número de Folios</Label>
            <Input type="number" {...form.register('numero_folios', { valueAsNumber: true })} min={1} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monto del Canon (RD$)</Label>
              <Input type="number" {...form.register('contrato.canon_monto', { valueAsNumber: true })} min={0} />
            </div>
            <div>
              <Label>Plazo (meses)</Label>
              <Input type="number" {...form.register('contrato.plazo_meses', { valueAsNumber: true })} min={1} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full">
        Generar Documento
      </Button>
    </form>
  );
}
