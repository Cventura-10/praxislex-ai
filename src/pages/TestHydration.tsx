import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientSelector } from "@/components/legal-acts/ClientSelector";
import { NotarioSelector } from "@/components/legal-acts/NotarioSelector";
import { LocationSelect } from "@/components/legal-acts/LocationSelect";
import { ContraparteManager, ContraparteData } from "@/components/legal-acts/ContraparteManager";
import { AbogadoContrarioManager, AbogadoContrarioData } from "@/components/legal-acts/AbogadoContrarioManager";
import { resetGeoCascade } from "@/lib/formHydrate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TestFormData {
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
  contrato: {
    canon_monto?: number;
    plazo_meses?: number;
  };
  numero_acto?: string;
  numero_folios?: number;
}

/**
 * Página de prueba para smoke test del sistema de hidratación
 * Ruta: /test-hydration
 */
export default function TestHydration() {
  const navigate = useNavigate();
  const form = useForm<TestFormData>({
    defaultValues: {
      primera_parte: {},
      segunda_parte: {},
      notario: {},
      contrato: {},
      numero_folios: 1,
    },
  });

  const { watch, control, setValue, handleSubmit, reset } = form;

  // Estados para contrapartes y abogados contrarios
  const [contrapartes, setContrapartes] = useState<ContraparteData[]>([]);
  const [abogadosContrarios, setAbogadosContrarios] = useState<AbogadoContrarioData[]>([]);

  // Cascada geográfica Primera Parte
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'primera_parte.provincia_id') {
        resetGeoCascade(form, 'primera_parte');
        toast.info("Cascada activada", {
          description: "Municipio y sector reseteados automáticamente"
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, form]);

  // Cascada geográfica Segunda Parte
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'segunda_parte.provincia_id') {
        resetGeoCascade(form, 'segunda_parte');
        toast.info("Cascada activada", {
          description: "Municipio y sector reseteados automáticamente"
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, form]);

  const onSubmit = async (data: TestFormData) => {
    try {
      // Validaciones
      if (!data.primera_parte.cliente_id) {
        toast.error("Falta Primera Parte");
        return;
      }
      if (!data.segunda_parte.cliente_id) {
        toast.error("Falta Segunda Parte");
        return;
      }
      if (!data.notario.id) {
        toast.error("Falta Notario");
        return;
      }
      if (!data.numero_folios || data.numero_folios < 1) {
        toast.error("Número de folios debe ser ≥ 1");
        return;
      }
      if (!data.contrato.canon_monto || data.contrato.canon_monto <= 0) {
        toast.error("Monto del canon debe ser > 0");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Preparar contenido completo con contrapartes y abogados
      const contenidoCompleto = JSON.stringify({
        primera_parte: data.primera_parte,
        segunda_parte: data.segunda_parte,
        notario: data.notario,
        contrato: data.contrato,
        contrapartes: contrapartes,
        abogados_contrarios: abogadosContrarios,
      }, null, 2);

      console.log("📄 Datos completos para generación:", {
        ...data,
        contrapartes_count: contrapartes.length,
        abogados_contrarios_count: abogadosContrarios.length,
      });

      // Insertar en generated_acts (trigger asignará numero_acto)
      const { data: newAct, error } = await supabase
        .from('generated_acts')
        .insert({
          tipo_acto: 'contrato',
          materia: 'civil',
          titulo: 'Contrato de Arrendamiento (TEST)',
          ciudad: 'Santo Domingo',
          contenido: contenidoCompleto,
          user_id: user.id,
          tenant_id: (await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single()).data?.tenant_id,
          numero_folios: data.numero_folios,
          // numero_acto se genera automáticamente
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("✅ PASO 5 COMPLETADO", {
        description: `Acto guardado con número: ${newAct.numero_acto}`,
        duration: 5000,
      });

      setValue('numero_acto', newAct.numero_acto || undefined);

      // Simular descarga DOCX
      console.log("📄 Datos para generación:", {
        numero_acto: newAct.numero_acto,
        primera_parte: data.primera_parte,
        segunda_parte: data.segunda_parte,
        notario: data.notario,
        contrato: data.contrato,
      });

    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al guardar", {
        description: error.message,
      });
    }
  };

  const handleReset = () => {
    reset();
    toast.info("Formulario reseteado");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
          <h1 className="text-3xl font-bold">🧪 Smoke Test - Sistema de Hidratación</h1>
          <p className="text-muted-foreground">
            Prueba los 6 pasos del sistema de autollenado y numeración automática
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2">
          Test Page
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* PASO 1: Primera Parte */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>PASO 1: Primera Parte (Arrendador)</CardTitle>
                <CardDescription>Selecciona un cliente y observa el autocompletado</CardDescription>
              </div>
              {watch('primera_parte.cliente_id') && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Paso 1 Completo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientSelector
              label="Seleccionar Cliente (Primera Parte)"
              fieldPrefix="primera_parte"
              value={watch('primera_parte.cliente_id') || null}
              onChange={(id) => setValue('primera_parte.cliente_id', id || undefined)}
              form={form}
              required
            />
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input {...form.register('primera_parte.nombre_completo')} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Cédula/RNC</Label>
                <Input {...form.register('primera_parte.cedula_rnc')} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Nacionalidad</Label>
                <Input {...form.register('primera_parte.nacionalidad')} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Estado Civil</Label>
                <Input {...form.register('primera_parte.estado_civil')} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Profesión</Label>
                <Input {...form.register('primera_parte.profesion')} readOnly className="bg-muted" />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-base font-semibold">Ubicación Geográfica (Cascadas)</Label>
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
            </div>

            <div>
              <Label>Dirección</Label>
              <Input {...form.register('primera_parte.direccion')} readOnly className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* PASO 2: Segunda Parte */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>PASO 2: Segunda Parte (Arrendatario)</CardTitle>
                <CardDescription>Selecciona otro cliente</CardDescription>
              </div>
              {watch('segunda_parte.cliente_id') && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Paso 2 Completo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientSelector
              label="Seleccionar Cliente (Segunda Parte)"
              fieldPrefix="segunda_parte"
              value={watch('segunda_parte.cliente_id') || null}
              onChange={(id) => setValue('segunda_parte.cliente_id', id || undefined)}
              form={form}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo</Label>
                <Input {...form.register('segunda_parte.nombre_completo')} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Cédula/RNC</Label>
                <Input {...form.register('segunda_parte.cedula_rnc')} readOnly className="bg-muted" />
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

        {/* NUEVO: Contrapartes / Demandados */}
        <Card>
          <CardHeader>
            <CardTitle>Contrapartes / Demandados</CardTitle>
            <CardDescription>
              Agrega las personas o entidades que actúan como contraparte (demandados, arrendatarios, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContraparteManager
              contrapartes={contrapartes}
              onChange={setContrapartes}
              title="Demandados / Contrapartes"
              description="Datos de las personas que actúan como contraparte en este acto jurídico"
            />
          </CardContent>
        </Card>

        {/* NUEVO: Abogados Contrarios */}
        <Card>
          <CardHeader>
            <CardTitle>Abogados de la Contraparte</CardTitle>
            <CardDescription>
              Opcional: Datos de los abogados que representan a la contraparte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AbogadoContrarioManager
              abogados={abogadosContrarios}
              onChange={setAbogadosContrarios}
            />
          </CardContent>
        </Card>

        {/* PASO 3: Notario */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>PASO 3: Notario Público</CardTitle>
                <CardDescription>Selecciona el notario que autorizará el acto</CardDescription>
              </div>
              {watch('notario.id') && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Paso 3 Completo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotarioSelector
              label="Seleccionar Notario"
              value={watch('notario.id') || null}
              onChange={(id) => setValue('notario.id', id || undefined)}
              form={form}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input {...form.register('notario.nombre_completo')} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Exequátur</Label>
                <Input {...form.register('notario.exequatur')} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Cédula (Máscara)</Label>
                <Input {...form.register('notario.cedula_mask')} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Jurisdicción</Label>
                <Input {...form.register('notario.jurisdiccion')} readOnly className="bg-muted" />
              </div>
              <div className="col-span-2">
                <Label>Oficina</Label>
                <Input {...form.register('notario.oficina')} readOnly className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PASO 4: Ya probado en cascadas arriba */}
        <Card className="bg-primary/5 border-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle>PASO 4: Cascadas Geográficas</CardTitle>
            </div>
            <CardDescription>
              Ya probadas arriba: Cambia provincia → resetea municipio/sector automáticamente
            </CardDescription>
          </CardHeader>
        </Card>

        {/* PASO 5 & 6: Datos del Acto */}
        <Card>
          <CardHeader>
            <CardTitle>PASO 5 & 6: Datos del Acto y Generación</CardTitle>
            <CardDescription>Completa estos campos y genera el documento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de Folios *</Label>
                <Input 
                  type="number" 
                  {...form.register('numero_folios', { valueAsNumber: true })} 
                  min={1} 
                  required 
                />
              </div>
              <div>
                <Label>Monto del Canon (RD$) *</Label>
                <Input 
                  type="number" 
                  {...form.register('contrato.canon_monto', { valueAsNumber: true })} 
                  min={0.01} 
                  step="0.01"
                  required 
                />
              </div>
              <div>
                <Label>Plazo (meses) *</Label>
                <Input 
                  type="number" 
                  {...form.register('contrato.plazo_meses', { valueAsNumber: true })} 
                  min={1} 
                  required 
                />
              </div>
              <div>
                <Label>Número de Acto (Auto-generado)</Label>
                <Input 
                  {...form.register('numero_acto')} 
                  readOnly 
                  className="bg-muted font-mono" 
                  placeholder="ACT-2025-###"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex gap-4">
          <Button type="submit" size="lg" className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            PASO 5: Guardar Acto (Auto-numerar)
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={handleReset}>
            Resetear Formulario
          </Button>
        </div>

        {watch('numero_acto') && (
          <Card className="bg-green-50 dark:bg-green-950 border-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    ✅ PASO 5 COMPLETO: Acto guardado con número {watch('numero_acto')}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    El PASO 6 (descargar DOCX) se implementa en la edge function generate-legal-doc
                  </p>
                </div>
                <Button variant="default" className="gap-2">
                  <Download className="h-4 w-4" />
                  PASO 6: Descargar DOCX
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Instrucciones */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>📝 Instrucciones del Smoke Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>PASO 1:</strong> Selecciona Primera Parte → verifica autocompletado completo</p>
          <p><strong>PASO 2:</strong> Selecciona Segunda Parte → verifica autocompletado independiente</p>
          <p><strong>PASO 3:</strong> Selecciona Notario → verifica jurisdicción compuesta</p>
          <p><strong>PASO 4:</strong> Cambia provincia en cualquier parte → verifica reset de municipio/sector</p>
          <p><strong>PASO 5:</strong> Completa datos y guarda → verifica número ACT-2025-###</p>
          <p><strong>PASO 6:</strong> (Implementado en edge function) Descarga DOCX real, no HTML</p>
        </CardContent>
      </Card>
    </div>
  );
}
