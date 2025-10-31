import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarEvent, EventType, EventStatus, EventPriority } from "@/hooks/useCalendarEvents";
import { Calendar } from "lucide-react";

interface CalendarEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedEvents?: CalendarEvent[];
  onSave: (event: CalendarEvent) => void;
}

export function CalendarEventDialog({ open, onOpenChange, suggestedEvents = [], onSave }: CalendarEventDialogProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [formData, setFormData] = useState<CalendarEvent>({
    tipo_evento: "Audiencia",
    titulo: "",
    descripcion: "",
    ubicacion: "",
    inicio: new Date().toISOString().slice(0, 16),
    fin: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    zona_horaria: "America/Santo_Domingo",
    estado: "pendiente",
    prioridad: "media",
    recordatorios: [{ minutos_antes: 1440 }, { minutos_antes: 120 }, { minutos_antes: 15 }],
  });

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
    const suggestion = suggestedEvents[index];
    setFormData({
      ...suggestion,
      inicio: suggestion.inicio.slice(0, 16),
      fin: suggestion.fin.slice(0, 16),
    });
  };

  const handleSave = () => {
    onSave({
      ...formData,
      inicio: formData.inicio + ":00-04:00",
      fin: formData.fin + ":00-04:00",
    });
    onOpenChange(false);
    // Reset form
    setFormData({
      tipo_evento: "Audiencia",
      titulo: "",
      descripcion: "",
      ubicacion: "",
      inicio: new Date().toISOString().slice(0, 16),
      fin: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
      zona_horaria: "America/Santo_Domingo",
      estado: "pendiente",
      prioridad: "media",
      recordatorios: [{ minutos_antes: 1440 }, { minutos_antes: 120 }, { minutos_antes: 15 }],
    });
    setSelectedSuggestion(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Crear Evento de Calendario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {suggestedEvents.length > 0 && (
            <div className="space-y-2">
              <Label>Sugerencias derivadas del acto</Label>
              <div className="space-y-2">
                {suggestedEvents.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSuggestion === index
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-medium">{suggestion.titulo}</div>
                    <div className="text-sm text-muted-foreground">
                      {suggestion.tipo_evento} • {new Date(suggestion.inicio).toLocaleString("es-DO")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_evento">Tipo de Evento *</Label>
              <Select
                value={formData.tipo_evento}
                onValueChange={(value) => setFormData({ ...formData, tipo_evento: value as EventType })}
              >
                <SelectTrigger id="tipo_evento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Notificación">⏰ Notificación</SelectItem>
                  <SelectItem value="Audiencia">⚖️ Audiencia</SelectItem>
                  <SelectItem value="Plazo">📅 Plazo</SelectItem>
                  <SelectItem value="Depósito">📎 Depósito</SelectItem>
                  <SelectItem value="Firma">✍️ Firma</SelectItem>
                  <SelectItem value="Entrega">📦 Entrega</SelectItem>
                  <SelectItem value="Otro">📌 Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select
                value={formData.prioridad}
                onValueChange={(value) => setFormData({ ...formData, prioridad: value as EventPriority })}
              >
                <SelectTrigger id="prioridad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">🔴 Alta</SelectItem>
                  <SelectItem value="media">🟡 Media</SelectItem>
                  <SelectItem value="baja">🟢 Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej: Audiencia de conciliación"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Detalles adicionales del evento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ubicacion">Ubicación</Label>
            <Input
              id="ubicacion"
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              placeholder="Tribunal, Secretaría, Dirección..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inicio">Fecha y Hora de Inicio *</Label>
              <Input
                id="inicio"
                type="datetime-local"
                value={formData.inicio}
                onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fin">Fecha y Hora de Fin *</Label>
              <Input
                id="fin"
                type="datetime-local"
                value={formData.fin}
                onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!formData.titulo || !formData.inicio || !formData.fin}>
            Guardar Evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
