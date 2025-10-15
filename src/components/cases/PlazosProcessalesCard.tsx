import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, AlertTriangle, CheckCircle2, Clock, Plus } from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PlazoProcesal {
  id: string;
  tipo_plazo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  dias_plazo: number;
  estado: string;
  prioridad: string;
  base_legal: string | null;
  notas: string | null;
}

interface PlazosProcessalesCardProps {
  caseId: string;
}

const TIPOS_PLAZO = [
  { value: 'octava_franca', label: 'Octava Franca' },
  { value: 'apelacion_sentencia', label: 'Apelación de Sentencia' },
  { value: 'apelacion_ordinaria', label: 'Apelación Ordinaria' },
  { value: 'contestacion_demanda', label: 'Contestación a Demanda' },
  { value: 'deposito_alegatos', label: 'Depósito de Alegatos' },
  { value: 'apelacion_penal', label: 'Apelación Penal' },
  { value: 'casacion_penal', label: 'Casación Penal' },
  { value: 'recurso_revision', label: 'Recurso de Revisión' },
  { value: 'apelacion_laboral', label: 'Apelación Laboral' },
  { value: 'casacion_laboral', label: 'Casación Laboral' },
  { value: 'recurso_jerarquico', label: 'Recurso Jerárquico' },
  { value: 'contencioso_administrativo', label: 'Contencioso Administrativo' },
];

export default function PlazosProcessalesCard({ caseId }: PlazosProcessalesCardProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPlazo, setNewPlazo] = useState({
    tipo_plazo: '',
    fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
    notas: '',
  });

  const { data: plazos, isLoading, refetch } = useQuery({
    queryKey: ['plazos-procesales', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plazos_procesales')
        .select('*')
        .eq('case_id', caseId)
        .order('fecha_vencimiento', { ascending: true });

      if (error) throw error;
      return data as PlazoProcesal[];
    },
  });

  const handleCreatePlazo = async () => {
    if (!newPlazo.tipo_plazo || !newPlazo.fecha_inicio) {
      toast({
        title: "Error",
        description: "Tipo de plazo y fecha de inicio son obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calcular plazo usando la función de la base de datos
      const { data: calculatedData, error: calcError } = await supabase
        .rpc('calcular_plazo_procesal', {
          p_tipo_plazo: newPlazo.tipo_plazo,
          p_fecha_inicio: newPlazo.fecha_inicio,
        });

      if (calcError) throw calcError;

      const plazoInfo = calculatedData?.[0];
      if (!plazoInfo) throw new Error('No se pudo calcular el plazo');

      // Obtener datos del caso
      const { data: caseData } = await supabase
        .from('cases')
        .select('user_id, tenant_id')
        .eq('id', caseId)
        .single();

      if (!caseData) throw new Error('Caso no encontrado');

      // Crear el plazo
      const { error: insertError } = await supabase
        .from('plazos_procesales')
        .insert({
          case_id: caseId,
          user_id: caseData.user_id,
          tenant_id: caseData.tenant_id,
          tipo_plazo: newPlazo.tipo_plazo,
          descripcion: TIPOS_PLAZO.find(t => t.value === newPlazo.tipo_plazo)?.label || '',
          fecha_inicio: newPlazo.fecha_inicio,
          fecha_vencimiento: plazoInfo.fecha_vencimiento,
          dias_plazo: plazoInfo.dias_plazo,
          base_legal: plazoInfo.base_legal,
          notas: newPlazo.notas,
          prioridad: 'alta',
        });

      if (insertError) throw insertError;

      toast({
        title: "Plazo creado",
        description: `Vence el ${format(new Date(plazoInfo.fecha_vencimiento), 'PPP', { locale: es })}`,
      });

      setNewPlazo({ tipo_plazo: '', fecha_inicio: format(new Date(), 'yyyy-MM-dd'), notas: '' });
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error creating plazo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el plazo",
        variant: "destructive",
      });
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica': return 'destructive';
      case 'alta': return 'default';
      case 'media': return 'secondary';
      default: return 'outline';
    }
  };

  const getEstadoBadge = (plazo: PlazoProcesal) => {
    const daysRemaining = differenceInDays(new Date(plazo.fecha_vencimiento), new Date());
    
    if (plazo.estado === 'cumplido') {
      return <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" />Cumplido</Badge>;
    }
    
    if (isPast(new Date(plazo.fecha_vencimiento)) || plazo.estado === 'vencido') {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Vencido</Badge>;
    }
    
    if (daysRemaining <= 3) {
      return <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />{daysRemaining} días</Badge>;
    }
    
    if (daysRemaining <= 7) {
      return <Badge variant="default" className="gap-1"><Clock className="h-3 w-3" />{daysRemaining} días</Badge>;
    }
    
    return <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" />{daysRemaining} días</Badge>;
  };

  if (isLoading) {
    return <Card><CardContent className="pt-6">Cargando plazos...</CardContent></Card>;
  }

  const plazosActivos = plazos?.filter(p => p.estado === 'pendiente' && isFuture(new Date(p.fecha_vencimiento))) || [];
  const plazosVencidos = plazos?.filter(p => p.estado === 'vencido' || isPast(new Date(p.fecha_vencimiento))) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Plazos Procesales
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Plazo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Plazo Procesal</DialogTitle>
                <DialogDescription>
                  El plazo se calculará automáticamente según la legislación dominicana
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Plazo</Label>
                  <Select value={newPlazo.tipo_plazo} onValueChange={(value) => setNewPlazo({...newPlazo, tipo_plazo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de plazo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_PLAZO.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Inicio</Label>
                  <Input 
                    type="date" 
                    value={newPlazo.fecha_inicio}
                    onChange={(e) => setNewPlazo({...newPlazo, fecha_inicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notas (Opcional)</Label>
                  <Textarea 
                    value={newPlazo.notas}
                    onChange={(e) => setNewPlazo({...newPlazo, notas: e.target.value})}
                    placeholder="Notas adicionales sobre este plazo..."
                  />
                </div>
                <Button onClick={handleCreatePlazo} className="w-full">
                  Crear Plazo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plazosActivos.length === 0 && plazosVencidos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay plazos registrados para este caso
            </p>
          ) : (
            <>
              {plazosActivos.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Plazos Activos</h4>
                  {plazosActivos.map((plazo) => (
                    <div key={plazo.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-sm">{plazo.descripcion}</h5>
                            <Badge variant={getPrioridadColor(plazo.prioridad)} className="text-xs">
                              {plazo.prioridad}
                            </Badge>
                          </div>
                          {plazo.base_legal && (
                            <p className="text-xs text-muted-foreground">{plazo.base_legal}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Inicio: {format(new Date(plazo.fecha_inicio), 'PP', { locale: es })}</span>
                            <span>Vence: {format(new Date(plazo.fecha_vencimiento), 'PP', { locale: es })}</span>
                          </div>
                          {plazo.notas && (
                            <p className="text-xs text-muted-foreground italic">{plazo.notas}</p>
                          )}
                        </div>
                        {getEstadoBadge(plazo)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {plazosVencidos.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Plazos Vencidos</h4>
                  {plazosVencidos.map((plazo) => (
                    <div key={plazo.id} className="border rounded-lg p-3 space-y-2 opacity-60">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h5 className="font-semibold text-sm">{plazo.descripcion}</h5>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Venció: {format(new Date(plazo.fecha_vencimiento), 'PP', { locale: es })}</span>
                          </div>
                        </div>
                        {getEstadoBadge(plazo)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
