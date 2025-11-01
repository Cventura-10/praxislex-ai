import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Users } from 'lucide-react';
import { ClientSelector } from './ClientSelector';
import { LocationSelect } from './LocationSelect';
import { PartyRole } from '@/hooks/useActPartyRoles';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DynamicPartiesManagerProps {
  form: UseFormReturn<any>;
  role: PartyRole;
  fieldName: string;
}

/**
 * Componente dinámico que maneja partes según el rol del acto
 * (VENDEDORES, COMPRADORES, DEMANDANTES, DEMANDADOS, etc.)
 */
export function DynamicPartiesManager({ form, role, fieldName }: DynamicPartiesManagerProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: fieldName,
  });

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    append({
      cliente_id: null,
      nombre_completo: '',
      cedula_rnc: '',
      nacionalidad: '',
      estado_civil: '',
      profesion: '',
      email: '',
      telefono: '',
      direccion: '',
      provincia_id: null,
      municipio_id: null,
      sector_id: null,
    });
    setExpandedIndex(fields.length);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{role.label}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {role.multiple ? 'Puede agregar múltiples partes' : 'Solo una parte permitida'}
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!role.multiple && fields.length >= 1}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay partes agregadas. Haga clic en "Agregar" para comenzar.
          </p>
        )}

        {fields.map((field, index) => (
          <Collapsible
            key={field.id}
            open={expandedIndex === index}
            onOpenChange={(open) => setExpandedIndex(open ? index : null)}
          >
            <Card className="border-border/50">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {form.watch(`${fieldName}.${index}.nombre_completo`) || `${role.label} #${index + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(index);
                      }}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4 border-t">
                  <ClientSelector
                    label="Seleccionar Cliente"
                    fieldPrefix={`${fieldName}.${index}`}
                    value={form.watch(`${fieldName}.${index}.cliente_id`) || null}
                    onChange={(id) => form.setValue(`${fieldName}.${index}.cliente_id`, id || undefined)}
                    form={form}
                  />

                  <LocationSelect
                    control={form.control}
                    setValue={form.setValue}
                    nameProvincia={`${fieldName}.${index}.provincia_id`}
                    nameMunicipio={`${fieldName}.${index}.municipio_id`}
                    nameSector={`${fieldName}.${index}.sector_id`}
                    labels={{
                      provincia: 'Provincia',
                      municipio: 'Municipio',
                      sector: 'Sector',
                    }}
                  />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}
