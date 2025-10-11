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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HearingSchema, type HearingInput, DeadlineSchema, type DeadlineInput } from "@/lib/forms/validators";

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

  const hearingForm = useForm<HearingInput>({
    resolver: zodResolver(HearingSchema),
    mode: "onChange",
    defaultValues: {
      case_id: null,
      caso: "",
      juzgado: "",
      tipo: "",
      fecha: "",
      hora: "",
      ubicacion: "",
      estado: 'programada',
    },
  });

  const deadlineForm = useForm<DeadlineInput>({
    resolver: zodResolver(DeadlineSchema),
    mode: "onChange",
    defaultValues: {
      case_id: null,
      caso: "",
      tipo: "",
      fecha_vencimiento: "",
      prioridad: 'media',
    },
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

  const handleCreateHearing = async (data: HearingInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      const { error } = await supabase.from("hearings").insert({
        user_id: userData.user.id,
        case_id: data.case_id || null,
        caso: data.caso,
        juzgado: data.juzgado,
        tipo: data.tipo,
        fecha: data.fecha, // Ya viene en formato ISO YYYY-MM-DD por el coerce
        hora: data.hora,   // Ya viene normalizado HH:mm
        ubicacion: data.ubicacion || null,
        estado: data.estado || 'programada',
      });

      if (error) throw error;

      toast({
        title: "✓ Audiencia creada",
        description: "La audiencia se ha creado correctamente",
      });

      setShowNewHearingDialog(false);
      hearingForm.reset();
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la audiencia",
      });
    }
  };

  const handleCreateDeadline = async (data: DeadlineInput) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      const { error } = await supabase.from("deadlines").insert({
        user_id: userData.user.id,
        case_id: data.case_id || null,
        caso: data.caso,
        tipo: data.tipo,
        fecha_vencimiento: data.fecha_vencimiento,
        prioridad: data.prioridad || 'media',
        completado: false,
      });

      if (error) throw error;

      toast({
        title: "✓ Plazo creado",
        description: "El plazo se ha creado correctamente",
      });

      setShowNewDeadlineDialog(false);
      deadlineForm.reset();
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el plazo",
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
              <form onSubmit={hearingForm.handleSubmit(handleCreateHearing)} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="case_hearing">Caso *</Label>
                  <Select 
                    value={hearingForm.watch("case_id") || ""} 
                    onValueChange={(value) => {
                      const selectedCase = cases.find(c => c.id === value);
                      hearingForm.setValue("case_id", value, { shouldValidate: true });
                      hearingForm.setValue("caso", `${selectedCase?.numero_expediente || ''} - ${selectedCase?.titulo || ""}`, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar caso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((caso) => (
                        <SelectItem key={caso.id} value={caso.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{caso.numero_expediente}</span>
                            <span className="text-sm text-muted-foreground">{caso.titulo}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hearingForm.formState.errors.caso && (
                    <p className="text-xs text-destructive">{hearingForm.formState.errors.caso.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="juzgado">Juzgado *</Label>
                  <Input
                    id="juzgado"
                    {...hearingForm.register("juzgado")}
                    placeholder="Ej: Primera Instancia DN"
                  />
                  {hearingForm.formState.errors.juzgado && (
                    <p className="text-xs text-destructive">{hearingForm.formState.errors.juzgado.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha">Fecha * (DD/MM/AAAA o YYYY-MM-DD)</Label>
                  <Input
                    id="fecha"
                    {...hearingForm.register("fecha")}
                    placeholder="10/12/2025 o 2025-12-10"
                  />
                  {hearingForm.formState.errors.fecha && (
                    <p className="text-xs text-destructive">{hearingForm.formState.errors.fecha.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hora">Hora * (HH:mm)</Label>
                  <Input
                    id="hora"
                    {...hearingForm.register("hora")}
                    placeholder="09:07"
                  />
                  {hearingForm.formState.errors.hora && (
                    <p className="text-xs text-destructive">{hearingForm.formState.errors.hora.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Input
                    id="tipo"
                    {...hearingForm.register("tipo")}
                    placeholder="Ej: Audiencia preliminar"
                  />
                  {hearingForm.formState.errors.tipo && (
                    <p className="text-xs text-destructive">{hearingForm.formState.errors.tipo.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    {...hearingForm.register("ubicacion")}
                    placeholder="Ej: Sala 3, Edificio A"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowNewHearingDialog(false);
                    hearingForm.reset();
                  }}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!hearingForm.formState.isValid || hearingForm.formState.isSubmitting}
                  >
                    Crear Audiencia
                  </Button>
                </div>
              </form>
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
                  <form onSubmit={deadlineForm.handleSubmit(handleCreateDeadline)} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="case_deadline">Caso *</Label>
                      <Select 
                        value={deadlineForm.watch("case_id") || ""} 
                        onValueChange={(value) => {
                          const selectedCase = cases.find(c => c.id === value);
                          deadlineForm.setValue("case_id", value, { shouldValidate: true });
                          deadlineForm.setValue("caso", `${selectedCase?.numero_expediente || ''} - ${selectedCase?.titulo || ""}`, { shouldValidate: true });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar caso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cases.map((caso) => (
                            <SelectItem key={caso.id} value={caso.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{caso.numero_expediente}</span>
                                <span className="text-sm text-muted-foreground">{caso.titulo}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {deadlineForm.formState.errors.caso && (
                        <p className="text-xs text-destructive">{deadlineForm.formState.errors.caso.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tipo_plazo">Tipo de Plazo *</Label>
                      <Input
                        id="tipo_plazo"
                        {...deadlineForm.register("tipo")}
                        placeholder="Ej: Contestación de demanda"
                      />
                      {deadlineForm.formState.errors.tipo && (
                        <p className="text-xs text-destructive">{deadlineForm.formState.errors.tipo.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento * (DD/MM/AAAA o YYYY-MM-DD)</Label>
                      <Input
                        id="fecha_vencimiento"
                        {...deadlineForm.register("fecha_vencimiento")}
                        placeholder="15/12/2025 o 2025-12-15"
                      />
                      {deadlineForm.formState.errors.fecha_vencimiento && (
                        <p className="text-xs text-destructive">{deadlineForm.formState.errors.fecha_vencimiento.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="prioridad">Prioridad</Label>
                      <Select 
                        value={deadlineForm.watch("prioridad")} 
                        onValueChange={(value) => deadlineForm.setValue("prioridad", value as "baja" | "media" | "alta", { shouldValidate: true })}
                      >
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
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setShowNewDeadlineDialog(false);
                        deadlineForm.reset();
                      }}>
                        Cancelar
                      </Button>
                      <Button 
                        type="submit"
                        disabled={!deadlineForm.formState.isValid || deadlineForm.formState.isSubmitting}
                      >
                        Crear Plazo
                      </Button>
                    </div>
                  </form>
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
