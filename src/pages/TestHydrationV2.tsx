import { useEffect, useState } from 'react';
import { FormProvider, useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { hydrateClient, hydrateNotario, hydrateLawyer, resetGeoCascade } from '@/lib/formHydrate';
import { ClientSelector } from '@/components/legal-acts/ClientSelector';
import { NotarioSelector } from '@/components/legal-acts/NotarioSelector';
import { LocationSelect } from '@/components/legal-acts/LocationSelect';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Download, Eye, EyeOff, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLawyers } from '@/hooks/useLawyers';

type FormData = {
  numero_acto?: string;
  numero_acta?: string;
  numero_folios?: number;
  ciudad?: string;
  primera_parte: any;
  segunda_parte: any;
  contraparte: any[];
  abogados_contrarios: any[];
  notario: any;
  contrato: { canon_monto?: number | null; plazo_meses?: number | null };
};

export default function TestHydrationV2() {
  const navigate = useNavigate();
  const { lawyers } = useLawyers();
  const [showDebug, setShowDebug] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      numero_acta: '',
      numero_folios: 1,
      ciudad: 'Santo Domingo',
      primera_parte: {},
      segunda_parte: {},
      contraparte: [],
      abogados_contrarios: [],
      notario: {},
      contrato: { canon_monto: null, plazo_meses: null },
    },
    shouldUnregister: false,
  });

  // FieldArrays SIEMPRE montados
  const contraparteFA = useFieldArray({ control: form.control, name: 'contraparte' });
  const abogadosFA = useFieldArray({ control: form.control, name: 'abogados_contrarios' });

  // Cascada GEO - reseteo duro
  useEffect(() => {
    const sub = form.watch((v, { name }) => {
      if (name === 'primera_parte.provincia_id') {
        resetGeoCascade(form, 'primera_parte');
        toast.info('Cascada activada - Primera Parte');
      }
      if (name === 'segunda_parte.provincia_id') {
        resetGeoCascade(form, 'segunda_parte');
        toast.info('Cascada activada - Segunda Parte');
      }
      // Cascadas para contrapartes
      if (name?.startsWith('contraparte.') && name?.includes('.provincia_id')) {
        const idx = name.split('.')[1];
        resetGeoCascade(form, `contraparte.${idx}`);
        toast.info(`Cascada activada - Contraparte #${parseInt(idx) + 1}`);
      }
      // Cascadas para abogados
      if (name?.startsWith('abogados_contrarios.') && name?.includes('.provincia_id')) {
        const idx = name.split('.')[1];
        resetGeoCascade(form, `abogados_contrarios.${idx}`);
        toast.info(`Cascada activada - Abogado #${parseInt(idx) + 1}`);
      }
    });
    return () => sub.unsubscribe?.();
  }, [form]);

  async function handleGuardar() {
    const data = form.getValues();

    // Validaciones básicas
    if (!data.numero_folios || data.numero_folios < 1) {
      toast.error('Número de folios debe ser ≥ 1');
      return;
    }
    if (!data.primera_parte?.cliente_id) {
      toast.error('Falta Primera Parte');
      return;
    }
    if (!data.segunda_parte?.cliente_id) {
      toast.error('Falta Segunda Parte');
      return;
    }
    if (!data.notario?.id) {
      toast.error('Falta Notario');
      return;
    }
    if (!data.contrato?.canon_monto || data.contrato.canon_monto <= 0) {
      toast.error('Canon debe ser > 0');
      return;
    }
    if (!data.contrato?.plazo_meses || data.contrato.plazo_meses <= 0) {
      toast.error('Plazo debe ser > 0');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('No autenticado');
      return;
    }

    // Obtener tenant_id
    const { data: tenantData } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    const contenidoCompleto = JSON.stringify({
      primera_parte: data.primera_parte,
      segunda_parte: data.segunda_parte,
      contrapartes: data.contraparte,
      abogados_contrarios: data.abogados_contrarios,
      notario: data.notario,
      contrato: data.contrato,
    }, null, 2);

    console.log('📄 Guardando acto con:', {
      contrapartes_count: data.contraparte?.length || 0,
      abogados_count: data.abogados_contrarios?.length || 0,
    });

    const { data: newAct, error } = await supabase
      .from('generated_acts')
      .insert({
        tipo_acto: 'contrato',
        materia: 'civil',
        titulo: 'Contrato de Arrendamiento (TEST v2)',
        ciudad: data.ciudad || 'Santo Domingo',
        contenido: contenidoCompleto,
        user_id: user.id,
        tenant_id: tenantData?.tenant_id || user.id,
        numero_folios: data.numero_folios,
        numero_acta: data.numero_acta || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error('Error guardando acto');
      return;
    }

    form.setValue('numero_acto', newAct?.numero_acto || undefined);
    toast.success('✅ GUARDADO EXITOSO', {
      description: `Número asignado: ${newAct?.numero_acto}`,
      duration: 5000,
    });
  }

  function handleDescargarDocx() {
    toast.info('Descarga simulada (edge function pendiente)', {
      description: 'La generación DOCX real requiere implementar la edge function',
    });
  }

  return (
    <FormProvider {...form}>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">SMOKE TEST v2 — Hidratación Total</h1>
                <p className="text-muted-foreground">Parche "a prueba de terquedad"</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showDebug ? 'Ocultar' : 'Ver'} Debug
            </Button>
          </div>

          {/* Cabecera del Acto */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Acto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Número del Acto (Auto)</Label>
                <Input
                  value={form.watch('numero_acto') || '— (se asigna al guardar)'}
                  readOnly
                  className="bg-muted font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Número de Acta</Label>
                <Input {...form.register('numero_acta')} />
              </div>
              <div className="space-y-2">
                <Label>Folios *</Label>
                <Input
                  type="number"
                  min={1}
                  {...form.register('numero_folios', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input placeholder="Santo Domingo" {...form.register('ciudad')} />
              </div>
            </CardContent>
          </Card>

          {/* PRIMERA PARTE */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Primera Parte (Arrendador)</CardTitle>
                {form.watch('primera_parte.cliente_id') && (
                  <Badge variant="default">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ClientSelector
                label="Seleccionar Cliente"
                fieldPrefix="primera_parte"
                value={form.watch('primera_parte.cliente_id') || null}
                onChange={(id) => {
                  if (id) {
                    // Trigger hydration manually
                    supabase.from('clients').select('*').eq('id', id).single().then(({ data }) => {
                      if (data) hydrateClient(form, 'primera_parte', data);
                    });
                  }
                }}
                form={form}
                required
              />
              <LocationSelect
                control={form.control}
                setValue={form.setValue}
                nameProvincia="primera_parte.provincia_id"
                nameMunicipio="primera_parte.municipio_id"
                nameSector="primera_parte.sector_id"
                labels={{
                  provincia: 'Provincia',
                  municipio: 'Municipio',
                  sector: 'Sector',
                }}
              />
            </CardContent>
          </Card>

          {/* SEGUNDA PARTE */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Segunda Parte (Arrendatario)</CardTitle>
                {form.watch('segunda_parte.cliente_id') && (
                  <Badge variant="default">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ClientSelector
                label="Seleccionar Cliente"
                fieldPrefix="segunda_parte"
                value={form.watch('segunda_parte.cliente_id') || null}
                onChange={(id) => {
                  if (id) {
                    supabase.from('clients').select('*').eq('id', id).single().then(({ data }) => {
                      if (data) hydrateClient(form, 'segunda_parte', data);
                    });
                  }
                }}
                form={form}
                required
              />
              <LocationSelect
                control={form.control}
                setValue={form.setValue}
                nameProvincia="segunda_parte.provincia_id"
                nameMunicipio="segunda_parte.municipio_id"
                nameSector="segunda_parte.sector_id"
                labels={{
                  provincia: 'Provincia',
                  municipio: 'Municipio',
                  sector: 'Sector',
                }}
              />
            </CardContent>
          </Card>

          {/* CONTRAPARTE - SIEMPRE MONTADO */}
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contrapartes / Demandados</CardTitle>
                  <CardDescription>
                    SIEMPRE visible - Agrega cuantas necesites
                  </CardDescription>
                </div>
                <Button onClick={() => contraparteFA.append({})}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {contraparteFA.fields.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay contrapartes. Haz clic en "Agregar" para comenzar.
                </p>
              ) : (
                contraparteFA.fields.map((fld, idx) => (
                  <Card key={fld.id} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Contraparte #{idx + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => contraparteFA.remove(idx)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ClientSelector
                        label={`Cliente Contraparte #${idx + 1}`}
                        fieldPrefix={`contraparte.${idx}`}
                        value={form.watch(`contraparte.${idx}.cliente_id`) || null}
                        onChange={(id) => {
                          if (id) {
                            supabase.from('clients').select('*').eq('id', id).single().then(({ data }) => {
                              if (data) hydrateClient(form, `contraparte.${idx}`, data);
                            });
                          }
                        }}
                        form={form}
                      />
                      <LocationSelect
                        control={form.control}
                        setValue={form.setValue}
                        nameProvincia={`contraparte.${idx}.provincia_id`}
                        nameMunicipio={`contraparte.${idx}.municipio_id`}
                        nameSector={`contraparte.${idx}.sector_id`}
                        labels={{
                          provincia: 'Provincia',
                          municipio: 'Municipio',
                          sector: 'Sector',
                        }}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* ABOGADOS CONTRARIOS - SIEMPRE MONTADO */}
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Abogados de la Contraparte</CardTitle>
                  <CardDescription>
                    SIEMPRE visible - Opcional pero disponible
                  </CardDescription>
                </div>
                <Button onClick={() => abogadosFA.append({})}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {abogadosFA.fields.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay abogados contrarios. Haz clic en "Agregar" si necesitas incluirlos.
                </p>
              ) : (
                abogadosFA.fields.map((fld, idx) => (
                  <Card key={fld.id} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Abogado #{idx + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abogadosFA.remove(idx)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Nombre Completo *</Label>
                          <Input {...form.register(`abogados_contrarios.${idx}.nombre_completo`)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Cédula</Label>
                          <Input {...form.register(`abogados_contrarios.${idx}.cedula_rnc`)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Matrícula CARD</Label>
                          <Input {...form.register(`abogados_contrarios.${idx}.matricula`)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Teléfono</Label>
                          <Input {...form.register(`abogados_contrarios.${idx}.telefono`)} />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Email</Label>
                          <Input type="email" {...form.register(`abogados_contrarios.${idx}.email`)} />
                        </div>
                      </div>
                      <LocationSelect
                        control={form.control}
                        setValue={form.setValue}
                        nameProvincia={`abogados_contrarios.${idx}.provincia_id`}
                        nameMunicipio={`abogados_contrarios.${idx}.municipio_id`}
                        nameSector={`abogados_contrarios.${idx}.sector_id`}
                        labels={{
                          provincia: 'Provincia del Bufete',
                          municipio: 'Municipio del Bufete',
                          sector: 'Sector del Bufete',
                        }}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* NOTARIO */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notario Público</CardTitle>
                {form.watch('notario.id') && (
                  <Badge variant="default">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <NotarioSelector
                label="Seleccionar Notario"
                fieldPrefix="notario"
                value={form.watch('notario.id') || null}
                onChange={(id) => {
                  if (id) {
                    supabase.from('v_notarios').select('*').eq('id', id).single().then(({ data }) => {
                      if (data) hydrateNotario(form, data);
                    });
                  }
                }}
                form={form}
                required
              />
            </CardContent>
          </Card>

          {/* CONTRATO */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Contrato</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Canon Mensual (RD$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  {...form.register('contrato.canon_monto', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Plazo (meses) *</Label>
                <Input
                  type="number"
                  min={1}
                  {...form.register('contrato.plazo_meses', { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>

          {/* ACCIONES */}
          <div className="flex items-center gap-3 sticky bottom-6 bg-background/80 backdrop-blur-sm border rounded-lg p-4">
            <Button onClick={handleGuardar} size="lg" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Guardar (asigna ACT-YYYY-###)
            </Button>
            <Button onClick={handleDescargarDocx} variant="outline" size="lg" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Descargar DOCX
            </Button>
          </div>

          {/* DEBUG VIEWER */}
          {showDebug && (
            <Card className="bg-slate-950 text-slate-100">
              <CardHeader>
                <CardTitle className="text-slate-100">Debug: Estado del Formulario</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-96 font-mono">
                  {JSON.stringify(form.getValues(), null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
