import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Plus, AlertTriangle, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Hearings = () => {
  const { toast } = useToast();
  const [hearings, setHearings] = useState([
    {
      id: "aud_01",
      caso: "Divorcio - Rodríguez",
      juzgado: "Primera Instancia DN",
      fecha: "06 Oct 2025",
      hora: "10:00 AM",
      tipo: "Audiencia preliminar",
      ubicacion: "Sala 3, Edificio A",
      estado: "confirmada" as const,
    },
    {
      id: "aud_02",
      caso: "Comercial - Importaciones SA",
      juzgado: "Suprema Corte",
      fecha: "08 Oct 2025",
      hora: "02:00 PM",
      tipo: "Apelación",
      ubicacion: "Sala Principal",
      estado: "pendiente" as const,
    },
    {
      id: "aud_03",
      caso: "Laboral - García vs. Empresa ABC",
      juzgado: "Tribunal Laboral DN",
      fecha: "15 Oct 2025",
      hora: "09:00 AM",
      tipo: "Audiencia de fondo",
      ubicacion: "Sala 2",
      estado: "confirmada" as const,
    },
  ]);

  const [deadlines, setDeadlines] = useState([
    {
      id: "plz_01",
      caso: "Cobro de pesos - Pérez vs. XYZ",
      tipo: "Contestación de demanda",
      vence: "28 Oct 2025",
      diasRestantes: 2,
      prioridad: "alta" as const,
    },
    {
      id: "plz_02",
      caso: "Desalojo - Martínez vs. López",
      tipo: "Presentación de pruebas",
      vence: "05 Nov 2025",
      diasRestantes: 10,
      prioridad: "media" as const,
    },
    {
      id: "plz_03",
      caso: "Laboral - García vs. Empresa ABC",
      tipo: "Alegatos finales",
      vence: "12 Nov 2025",
      diasRestantes: 17,
      prioridad: "baja" as const,
    },
  ]);

  const handleEditHearing = (caso: string) => {
    toast({
      title: "Editar audiencia",
      description: `Editando audiencia: ${caso}`,
    });
  };

  const handleDeleteHearing = (caso: string) => {
    toast({
      title: "Eliminar audiencia",
      description: `¿Confirmar eliminación de: ${caso}?`,
      variant: "destructive",
    });
  };

  const handleMarkDeadlineComplete = (plazoId: string, caso: string) => {
    setDeadlines(deadlines.filter(d => d.id !== plazoId));
    toast({
      title: "Plazo cumplido",
      description: `${caso} marcado como cumplido`,
    });
  };

  const handleEditDeadline = (caso: string) => {
    toast({
      title: "Editar plazo",
      description: `Editando plazo: ${caso}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Audiencias y Plazos
          </h1>
          <p className="text-muted-foreground mt-1">
            Calendario de eventos y vencimientos procesales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Ver calendario
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva audiencia
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas audiencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hearings.map((hearing) => (
                <div
                  key={hearing.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-base"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium">{hearing.caso}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {hearing.juzgado}
                      </p>
                    </div>
                    <Badge
                      variant={
                        hearing.estado === "confirmada"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {hearing.estado === "confirmada"
                        ? "Confirmada"
                        : "Pendiente"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-primary">
                        {hearing.fecha} • {hearing.hora}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {hearing.ubicacion}
                    </div>
                    <div className="text-sm">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-secondary/20 text-secondary-foreground">
                        {hearing.tipo}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditHearing(hearing.caso)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHearing(hearing.caso)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Plazos y vencimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className={`p-4 rounded-lg border transition-base ${
                    deadline.prioridad === "alta"
                      ? "border-destructive/50 bg-destructive/5"
                      : deadline.prioridad === "media"
                      ? "border-warning/50 bg-warning/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium">{deadline.caso}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {deadline.tipo}
                      </p>
                    </div>
                    <Badge
                      variant={
                        deadline.prioridad === "alta"
                          ? "destructive"
                          : deadline.prioridad === "media"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {deadline.diasRestantes}{" "}
                      {deadline.diasRestantes === 1 ? "día" : "días"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={
                          deadline.prioridad === "alta"
                            ? "font-medium text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        Vence: {deadline.vence}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          handleMarkDeadlineComplete(deadline.id, deadline.caso)
                        }
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Cumplido
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDeadline(deadline.caso)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Hearings;
