import { useForm, FormProvider } from 'react-hook-form';
import { useEffect } from 'react';
import { LegalActBundle } from '@/lib/legalActsBundle';
import { useActPartyRoles } from '@/hooks/useActPartyRoles';
import { DynamicPartiesManager } from './DynamicPartiesManager';
import { AbogadoContrarioManager } from './AbogadoContrarioManager';
import { NotarioSelector } from './NotarioSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { resetGeoCascade } from '@/lib/formHydrate';

interface NotarioData {
  id?: string;
  nombre_completo?: string;
  exequatur?: string;
  oficina?: string;
  jurisdiccion?: string;
}

interface DatosEspecificos {
  monto?: number;
  plazo_meses?: number;
}

interface FormData {
  numero_acto: string;
  numero_acta: string;
  numero_folios: number;
  ciudad: string;
  partes: Record<string, any[]>;
  abogados_contrarios: any[];
  notario: NotarioData;
  datos_especificos: DatosEspecificos;
}

interface UniversalIntakeFormProps {
  acto: LegalActBundle;
  onSuccess?: (data: any) => void;
}

/**
 * Formulario universal que se adapta dinámicamente según el tipo de acto
 * Maneja partes con roles específicos (vendedor/comprador, demandante/demandado, etc.)
 */
export function UniversalIntakeForm({ acto, onSuccess }: UniversalIntakeFormProps) {
  const partyConfig = useActPartyRoles(acto);
  
  const form = useForm<FormData>({
    defaultValues: {
      numero_acto: '',
      numero_acta: '',
      numero_folios: 1,
      ciudad: 'SANTO DOMINGO',
      partes: {},
      abogados_contrarios: [],
      notario: {},
      datos_especificos: {},
    },
    shouldUnregister: false,
  });

  const { watch, control, setValue } = form;

  // Cascada geográfica para cada rol de parte
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name?.includes('.provincia_id')) {
        const baseField = name.split('.provincia_id')[0];
        resetGeoCascade(form, baseField);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      // Validación básica
      const missingRoles = partyConfig.roles.filter(role => {
        const partes = data.partes[role.side];
        return !partes || partes.length === 0;
      });

      if (missingRoles.length > 0) {
        toast.error(`Faltan partes: ${missingRoles.map(r => r.label).join(', ')}`);
        return;
      }

      if (partyConfig.requiresNotary && !data.notario?.id) {
        toast.error('Debe seleccionar un notario');
        return;
      }

      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      // Obtener tenant_id
      const { data: tenantData } = await supabase
        .from('current_user_tenant')
        .select('id')
        .maybeSingle();

      if (!tenantData?.id) {
        toast.error('No se pudo obtener el tenant');
        return;
      }

      // Insertar en generated_acts con numeración automática
      const insertData: any = {
        user_id: user.id,
        tenant_id: tenantData.id,
        tipo_acto: acto.naturaleza,
        materia: acto.materia,
        titulo: acto.title || acto.slug,
        ciudad: data.ciudad,
        numero_acta: data.numero_acta || null,
        numero_folios: data.numero_folios || 1,
        contenido: `${acto.title || acto.slug}\n\nDatos: ${JSON.stringify(data, null, 2)}`,
        notario_id: data.notario?.id || null,
      };

      const { data: row, error } = await supabase
        .from('generated_acts')
        .insert(insertData)
        .select('id, numero_acto')
        .maybeSingle();

      if (error) throw error;

      if (row) {
        form.setValue('numero_acto', row.numero_acto || '');
        toast.success(`Acto generado exitosamente: ${row.numero_acto}`);
        
        if (onSuccess) {
          onSuccess({ ...data, numero_acto: row.numero_acto });
        }
      } else {
        toast.error('No se pudo crear el acto');
      }
    } catch (error: any) {
      console.error('Error guardando acto:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header del Acto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{acto.title || acto.slug}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {acto.materia} • {acto.naturaleza} • {acto.ejecutor}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Número del Acto</Label>
                <Input
                  {...form.register('numero_acto')}
                  readOnly
                  placeholder="ACT-2025-###"
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Número de Acta</Label>
                <Input {...form.register('numero_acta')} />
              </div>
              <div>
                <Label>Número de Folios*</Label>
                <Input
                  type="number"
                  min={1}
                  {...form.register('numero_folios', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input {...form.register('ciudad')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partes Dinámicas según el tipo de acto */}
        {partyConfig.roles.map((role) => (
          <DynamicPartiesManager
            key={role.side}
            form={form}
            role={role}
            fieldName={`partes.${role.side}`}
          />
        ))}

        {/* Abogados Contrarios (solo en actos judiciales) */}
        {partyConfig.requiresLawyers && (
          <AbogadoContrarioManager
            abogados={form.watch('abogados_contrarios') || []}
            onChange={(abogados) => form.setValue('abogados_contrarios', abogados)}
          />
        )}

        {/* Notario (solo en actos notariales) */}
        {partyConfig.requiresNotary && (
          <Card>
            <CardHeader>
              <CardTitle>Notario Público*</CardTitle>
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
                  <Input {...form.register('notario.nombre_completo')} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Exequátur</Label>
                  <Input {...form.register('notario.exequatur')} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Oficina</Label>
                  <Input {...form.register('notario.oficina')} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Jurisdicción</Label>
                  <Input {...form.register('notario.jurisdiccion')} readOnly className="bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Datos Específicos del Acto (se puede extender dinámicamente) */}
        {acto.is_contrato && (
          <Card>
            <CardHeader>
              <CardTitle>Datos del Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Monto (RD$)</Label>
                  <Input
                    type="number"
                    {...form.register('datos_especificos.monto', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label>Plazo (meses)</Label>
                  <Input
                    type="number"
                    {...form.register('datos_especificos.plazo_meses', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <div className="flex gap-3 sticky bottom-0 bg-background p-4 border-t">
          <Button type="submit" size="lg" className="flex-1">
            Guardar y Asignar Número
          </Button>
          <Button type="button" variant="outline" size="lg" className="flex-1">
            Generar DOCX
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
