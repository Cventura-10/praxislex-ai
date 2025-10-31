import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

export type EventType = "Notificación" | "Audiencia" | "Plazo" | "Depósito" | "Firma" | "Entrega" | "Otro";
export type EventStatus = "pendiente" | "en_curso" | "cumplido" | "vencido" | "reprogramado";
export type EventPriority = "alta" | "media" | "baja";

export interface CalendarEvent {
  id?: string;
  acto_slug?: string;
  expediente_id?: string | null;
  materia?: string;
  tipo_evento: EventType;
  titulo: string;
  descripcion?: string;
  ubicacion?: string;
  inicio: string; // ISO 8601
  fin: string; // ISO 8601;
  zona_horaria: string;
  recordatorios?: Array<{ minutos_antes: number }>;
  responsables?: string[];
  partes_relacionadas?: string[];
  estado: EventStatus;
  prioridad: EventPriority;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  tenant_id?: string | null;
}

export function useCalendarEvents() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  const getTenantId = async () => {
    if (tenant?.id) return tenant.id;
    const { data } = await supabase.from("current_user_tenant").select("id").maybeSingle();
    return data?.id || null;
  };

  const { data: events, isLoading } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("inicio", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (event: CalendarEvent) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const tenantId = await getTenantId();
      
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          acto_slug: event.acto_slug,
          expediente_id: event.expediente_id,
          materia: event.materia,
          tipo_evento: event.tipo_evento,
          titulo: event.titulo,
          descripcion: event.descripcion,
          ubicacion: event.ubicacion,
          inicio: event.inicio,
          fin: event.fin,
          zona_horaria: "America/Santo_Domingo",
          recordatorios: event.recordatorios || [],
          responsables: event.responsables || [],
          partes_relacionadas: event.partes_relacionadas || [],
          estado: event.estado,
          prioridad: event.prioridad,
          user_id: user.id,
          created_by: user.id,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento creado exitosamente");
    },
    onError: (error) => {
      toast.error("Error al crear evento: " + error.message);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CalendarEvent> }) => {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar evento: " + error.message);
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento eliminado");
    },
    onError: (error) => {
      toast.error("Error al eliminar evento: " + error.message);
    },
  });

  return {
    events: events || [],
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

// Helper para crear eventos desde actos
export function deriveEventsFromAct(actSlug: string, actData: any): CalendarEvent[] {
  const suggestions: CalendarEvent[] = [];
  const now = new Date();

  // Mapeo de actos a eventos sugeridos
  switch (actSlug) {
    case "acto-avenir-emplazamiento":
    case "acto-constitucion-abogado-y-avenir":
      if (actData.fecha_audiencia && actData.hora_audiencia) {
        suggestions.push({
          tipo_evento: "Audiencia",
          titulo: `Audiencia - ${actData.tribunal || 'Tribunal'}`,
          descripcion: `Comparecencia ante ${actData.tribunal}`,
          ubicacion: actData.tribunal,
          inicio: `${actData.fecha_audiencia}T${actData.hora_audiencia}:00-04:00`,
          fin: `${actData.fecha_audiencia}T${addHours(actData.hora_audiencia, 2)}:00-04:00`,
          zona_horaria: "America/Santo_Domingo",
          estado: "pendiente",
          prioridad: "alta",
          recordatorios: [{ minutos_antes: 1440 }, { minutos_antes: 120 }, { minutos_antes: 15 }],
        });
      }
      break;

    case "demanda-cobro-de-pesos":
    case "demanda-responsabilidad-civil":
      suggestions.push({
        tipo_evento: "Depósito",
        titulo: "Depósito de documentos",
        descripcion: "Depósito de demanda y documentos en secretaría",
        ubicacion: actData.tribunal,
        inicio: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        fin: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        zona_horaria: "America/Santo_Domingo",
        estado: "pendiente",
        prioridad: "alta",
        recordatorios: [{ minutos_antes: 1440 }],
        });
      break;

    case "contrato-alquiler-local-comercial-modelo-hd":
      if (actData.fecha_inicio) {
        suggestions.push({
          tipo_evento: "Firma",
          titulo: "Firma de contrato de alquiler",
          descripcion: "Cita para firma del contrato de alquiler",
          ubicacion: actData.ciudad_contrato || "Santo Domingo",
          inicio: `${actData.fecha_inicio}T10:00:00-04:00`,
          fin: `${actData.fecha_inicio}T11:00:00-04:00`,
          zona_horaria: "America/Santo_Domingo",
          estado: "pendiente",
          prioridad: "alta",
          recordatorios: [{ minutos_antes: 1440 }, { minutos_antes: 120 }],
        });
      }
      if (actData.fecha_fin) {
        suggestions.push({
          tipo_evento: "Plazo",
          titulo: "Vencimiento de contrato de alquiler",
          descripcion: "Fecha de fin del período de alquiler",
          inicio: `${actData.fecha_fin}T00:00:00-04:00`,
          fin: `${actData.fecha_fin}T23:59:59-04:00`,
          zona_horaria: "America/Santo_Domingo",
          estado: "pendiente",
          prioridad: "media",
          recordatorios: [{ minutos_antes: 43200 }, { minutos_antes: 10080 }], // 30 días y 7 días antes
        });
      }
      break;

    case "mandamiento-de-pago":
    case "intimacion-de-pago":
      if (actData.plazo_franco_dias || actData.plazo) {
        const plazo = actData.plazo_franco_dias || actData.plazo;
        const vencimiento = new Date(now.getTime() + plazo * 24 * 60 * 60 * 1000);
        suggestions.push({
          tipo_evento: "Plazo",
          titulo: "Vencimiento de plazo de pago",
          descripcion: `Plazo de ${plazo} días franco para el pago`,
          inicio: vencimiento.toISOString(),
          fin: vencimiento.toISOString(),
          zona_horaria: "America/Santo_Domingo",
          estado: "pendiente",
          prioridad: "alta",
          recordatorios: [{ minutos_antes: 1440 }],
        });
      }
      break;
  }

  return suggestions;
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const newHour = (h + hours) % 24;
  return `${String(newHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
