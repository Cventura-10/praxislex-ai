import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Clock, MapPin, Plus, AlertTriangle, Edit, Trash2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hearingSchema, deadlineSchema } from "@/lib/validation";

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

const Hearings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewHearingDialog, setShowNewHearingDialog] = useState(false);
  const [showNewDeadlineDialog, setShowNewDeadlineDialog] = useState(false);

  const [newHearing, setNewHearing] = useState({
    case_id: "",
    caso: "",
    juzgado: "",
    fecha: "",
    hora: "",
    tipo: "",
    ubicacion: "",
  });

  const [newDeadline, setNewDeadline] = useState({
    case_id: "",
    caso: "",
    tipo: "",
    fecha_vencimiento: "",
    prioridad: "media",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch cases
      const { data: casesData } = await supabase.from("cases").select("*").eq("user_id", user.id);

      setCases(casesData || []);

      // Fetch hearings
      const { data: hearingsData, error: hearingsError } = await supabase
        .from("hearings")
        .select("*")
        .eq("user_id", user.id)
        .order("fecha", { ascending: true });

      if (hearingsError) throw hearingsError;
      setHearings(hearingsData || []);

      // Fetch deadlines
      const { data: deadlinesData, error: deadlinesError } = await supabase
        .from("deadlines")
        .select("*")
        .eq("user_id", user.id)
        .eq("completado", false)
        .order("fecha_vencimiento", { ascending: true });

      if (deadlinesError) throw deadlinesError;
      setDeadlines(deadlinesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHearing = async () => {
    try {
      // Validate input data
      const validationResult = hearingSchema.safeParse({
        caso: newHearing.caso,
        juzgado: newHearing.juzgado,
        fecha: newHearing.fecha,
        hora: newHearing.hora,
        tipo: newHearing.tipo,
        ubicacion: newHearing.ubicacion || undefined,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.issues;
        const errorMessages = errors.map(err => `• ${err.path.join('.')}: ${err.message}`).join('\n');
        toast({
          title: "Formulario incompleto",
          description: errors.length > 1 
            ? `Por favor complete los siguientes campos:\n${errorMessages}`
            : errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase.from("hearings").insert([
        {
          ...newHearing,
          user_id: user.id,
          case_id: newHearing.case_id || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Audiencia creada",
        description: "La audiencia ha sido creada exitosamente",
      });

      setShowNewHearingDialog(false);
      setNewHearing({
        case_id: "",
        caso: "",
        juzgado: "",
        fecha: "",
        hora: "",
        tipo: "",
        ubicacion: "",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la audiencia",
        variant: "destructive",
      });
    }
  };

  const handleCreateDeadline = async () => {
    try {
      // Validate input data
      const validationResult = deadlineSchema.safeParse({
        caso: newDeadline.caso,
        tipo: newDeadline.tipo,
        fecha_vencimiento: newDeadline.fecha_vencimiento,
        prioridad: newDeadline.prioridad,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.issues;
        const errorMessages = errors.map(err => `• ${err.path.join('.')}: ${err.message}`).join('\n');
        toast({
          title: "Formulario incompleto",
          description: errors.length > 1 
            ? `Por favor complete los siguientes campos:\n${errorMessages}`
            : errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase.from("deadlines").insert([
        {
          ...newDeadline,
          user_id: user.id,
          case_id: newDeadline.case_id || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Plazo creado",
        description: "El plazo ha sido creado exitosamente",
      });

      setShowNewDeadlineDialog(false);
      setNewDeadline({
        case_id: "",
        caso: "",
        tipo: "",
        fecha_vencimiento: "",
        prioridad: "media",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el plazo",
        variant: "destructive",
      });
    }
  };

  const handleEditHearing = (caso: string) => {
    toast({
      title: "Editar audiencia",
      description: `Editando audiencia: ${caso}`,
    });
  };

  const handleDeleteHearing = async (hearingId: string, caso: string) => {
    try {
      const { error } = await supabase.from("hearings").delete().eq("id", hearingId);

      if (error) throw error;

      toast({
        title: "Audiencia eliminada",
        description: `${caso} ha sido eliminada`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la audiencia",
        variant: "destructive",
      });
    }
  };

  const handleMarkDeadlineComplete = async (plazoId: string, caso: string) => {
    try {
      const { error } = await supabase.from("deadlines").update({ completado: true }).eq("id", plazoId);

      if (error) throw error;

      toast({
        title: "Plazo cumplido",
        description: `${caso} marcado como cumplido`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar el plazo como cumplido",
        variant: "destructive",
      });
    }
  };

  const handleEditDeadline = (caso: string) => {
    toast({
      title: "Editar plazo",
      description: `Editando plazo: ${caso}`,
    });
  };

  const getDaysRemaining = (fechaVencimiento: string) => {
    const today = new Date();
    const vence = new Date(fechaVencimiento);
    const diff = Math.ceil((vence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-DO", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audiencias y Plazos</h1>
            <p className="text-muted-foreground mt-1">Calendario de eventos y vencimientos procesales</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Ver calendario
          </Button>
          <Dialog open={showNewHearingDialog} onOpenChange={setShowNewHearingDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva audiencia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Audiencia</DialogTitle>
                <DialogDescription>Complete los datos de la audiencia</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="case_hearing">Caso</Label>
                  <Select value={newHearing.case_id} onValueChange={(value) => {
                    const selectedCase = cases.find(c => c.id === value);
                    setNewHearing({ ...newHearing, case_id: value, caso: selectedCase?.titulo || "" });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar caso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((caso) => (
                        <SelectItem key={caso.id} value={caso.id}>
                          {caso.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="juzgado">Juzgado *</Label>
                  <Input
                    id="juzgado"
                    value={newHearing.juzgado}
                    onChange={(e) => setNewHearing({ ...newHearing, juzgado: e.target.value })}
                    placeholder="Ej: Primera Instancia DN"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={newHearing.fecha}
                    onChange={(e) => setNewHearing({ ...newHearing, fecha: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hora">Hora *</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={newHearing.hora}
                    onChange={(e) => setNewHearing({ ...newHearing, hora: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Input
                    id="tipo"
                    value={newHearing.tipo}
                    onChange={(e) => setNewHearing({ ...newHearing, tipo: e.target.value })}
                    placeholder="Ej: Audiencia preliminar"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={newHearing.ubicacion}
                    onChange={(e) => setNewHearing({ ...newHearing, ubicacion: e.target.value })}
                    placeholder="Ej: Sala 3, Edificio A"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewHearingDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateHearing} disabled={!newHearing.juzgado || !newHearing.fecha || !newHearing.hora || !newHearing.tipo}>
                  Crear Audiencia
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
            {loading ? (
              <div className="text-center py-8">Cargando audiencias...</div>
            ) : hearings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay audiencias programadas</div>
            ) : (
              <div className="space-y-4">
                {hearings.map((hearing) => (
                  <div key={hearing.id} className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-base">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium">{hearing.caso}</p>
                        <p className="text-sm text-muted-foreground mt-1">{hearing.juzgado}</p>
                      </div>
                      <Badge variant={hearing.estado === "confirmada" ? "default" : "secondary"}>
                        {hearing.estado === "confirmada" ? "Confirmada" : "Pendiente"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-primary">
                          {formatDate(hearing.fecha)} • {hearing.hora}
                        </span>
                      </div>
                      {hearing.ubicacion && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {hearing.ubicacion}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-secondary/20 text-secondary-foreground">
                          {hearing.tipo}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-3">
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEditHearing(hearing.caso)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteHearing(hearing.id, hearing.caso)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Plazos y vencimientos
              </CardTitle>
              <Dialog open={showNewDeadlineDialog} onOpenChange={setShowNewDeadlineDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Plazo</DialogTitle>
                    <DialogDescription>Complete los datos del plazo</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="case_deadline">Caso</Label>
                      <Select value={newDeadline.case_id} onValueChange={(value) => {
                        const selectedCase = cases.find(c => c.id === value);
                        setNewDeadline({ ...newDeadline, case_id: value, caso: selectedCase?.titulo || "" });
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar caso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cases.map((caso) => (
                            <SelectItem key={caso.id} value={caso.id}>
                              {caso.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tipo_plazo">Tipo de Plazo *</Label>
                      <Input
                        id="tipo_plazo"
                        value={newDeadline.tipo}
                        onChange={(e) => setNewDeadline({ ...newDeadline, tipo: e.target.value })}
                        placeholder="Ej: Contestación de demanda"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento *</Label>
                      <Input
                        id="fecha_vencimiento"
                        type="date"
                        value={newDeadline.fecha_vencimiento}
                        onChange={(e) => setNewDeadline({ ...newDeadline, fecha_vencimiento: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="prioridad">Prioridad</Label>
                      <Select value={newDeadline.prioridad} onValueChange={(value) => setNewDeadline({ ...newDeadline, prioridad: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewDeadlineDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateDeadline} disabled={!newDeadline.tipo || !newDeadline.fecha_vencimiento}>
                      Crear Plazo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando plazos...</div>
            ) : deadlines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay plazos pendientes</div>
            ) : (
              <div className="space-y-4">
                {deadlines.map((deadline) => {
                  const diasRestantes = getDaysRemaining(deadline.fecha_vencimiento);
                  return (
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
                          <p className="text-sm text-muted-foreground mt-1">{deadline.tipo}</p>
                        </div>
                        <Badge
                          variant={
                            deadline.prioridad === "alta" ? "destructive" : deadline.prioridad === "media" ? "default" : "secondary"
                          }
                        >
                          {diasRestantes} {diasRestantes === 1 ? "día" : "días"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={deadline.prioridad === "alta" ? "font-medium text-destructive" : "text-muted-foreground"}>
                            Vence: {formatDate(deadline.fecha_vencimiento)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleMarkDeadlineComplete(deadline.id, deadline.caso)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Cumplido
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditDeadline(deadline.caso)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Hearings;
