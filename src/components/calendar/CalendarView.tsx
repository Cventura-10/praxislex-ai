import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, MapPin, AlertTriangle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarEventDialog } from "./CalendarEventDialog";

interface CalendarEvent {
  id: string;
  tipo_evento: string;
  titulo: string;
  descripcion?: string;
  inicio: string;
  fin: string;
  ubicacion?: string;
  estado: string;
  prioridad: string;
  acto_slug?: string;
  expediente_id?: string;
}

interface Hearing {
  id: string;
  caso: string;
  juzgado: string;
  fecha: string;
  hora: string;
  tipo: string;
  ubicacion: string | null;
  estado: string;
}

interface Deadline {
  id: string;
  caso: string;
  tipo: string;
  fecha_vencimiento: string;
  prioridad: string;
  completado: boolean;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  hearings: Hearing[];
  deadlines: Deadline[];
  onEventClick?: (event: any) => void;
}

export function CalendarView({ events, hearings, deadlines, onEventClick }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);

  // Combinar todos los eventos en un formato unificado
  const allEvents = useMemo(() => {
    const combined = [
      ...events.map(e => ({
        id: e.id,
        type: 'event' as const,
        title: e.titulo,
        description: e.descripcion,
        date: new Date(e.inicio),
        time: format(new Date(e.inicio), 'HH:mm'),
        location: e.ubicacion,
        priority: e.prioridad,
        status: e.estado,
        eventType: e.tipo_evento,
        raw: e
      })),
      ...hearings.map(h => ({
        id: h.id,
        type: 'hearing' as const,
        title: h.caso,
        description: `${h.tipo} - ${h.juzgado}`,
        date: new Date(h.fecha),
        time: h.hora,
        location: h.ubicacion || h.juzgado,
        priority: 'alta' as const,
        status: h.estado,
        raw: h
      })),
      ...deadlines.map(d => ({
        id: d.id,
        type: 'deadline' as const,
        title: d.caso,
        description: d.tipo,
        date: new Date(d.fecha_vencimiento),
        time: '23:59',
        location: undefined,
        priority: d.prioridad,
        status: d.completado ? 'cumplido' : 'pendiente',
        raw: d
      }))
    ];

    return combined.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, hearings, deadlines]);

  // Eventos del día seleccionado
  const eventsForSelectedDate = useMemo(() => {
    return allEvents.filter(event => isSameDay(event.date, selectedDate));
  }, [allEvents, selectedDate]);

  // Obtener días con eventos para el mes actual
  const daysWithEvents = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });
    
    return days.filter(day => 
      allEvents.some(event => isSameDay(event.date, day))
    );
  }, [allEvents, selectedDate]);

  const getEventColor = (event: any) => {
    if (event.type === 'deadline') {
      if (event.priority === 'alta') return 'bg-destructive/10 border-destructive/20 text-destructive';
      if (event.priority === 'media') return 'bg-warning/10 border-warning/20 text-warning';
      return 'bg-muted border-muted-foreground/20';
    }
    if (event.type === 'hearing') {
      return 'bg-info/10 border-info/20 text-info';
    }
    return 'bg-primary/10 border-primary/20 text-primary';
  };

  const getEventIcon = (event: any) => {
    if (event.type === 'deadline') return <AlertTriangle className="h-4 w-4" />;
    if (event.type === 'hearing') return <CalendarIcon className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
    onEventClick?.(event);
  };

  const handlePreviousMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-[1fr,400px]">
        {/* Calendario principal */}
        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">
              {format(selectedDate, 'MMMM yyyy', { locale: es })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                Hoy
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              className={cn("rounded-md border pointer-events-auto")}
              modifiers={{
                hasEvents: daysWithEvents,
              }}
              modifiersClassNames={{
                hasEvents: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
              }}
            />
          </CardContent>
        </Card>

        {/* Panel lateral de eventos */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {eventsForSelectedDate.length === 0
                ? 'No hay eventos programados'
                : `${eventsForSelectedDate.length} ${eventsForSelectedDate.length === 1 ? 'evento' : 'eventos'}`}
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {eventsForSelectedDate.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No hay eventos para esta fecha
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventsForSelectedDate.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-colors hover:bg-accent/50",
                        getEventColor(event)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getEventIcon(event)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium text-sm leading-tight">
                              {event.title}
                            </p>
                            {event.priority === 'alta' && (
                              <Badge variant="destructive" className="text-xs">
                                Urgente
                              </Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {event.type === 'deadline' ? 'Plazo' : event.type === 'hearing' ? 'Audiencia' : 'Evento'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
