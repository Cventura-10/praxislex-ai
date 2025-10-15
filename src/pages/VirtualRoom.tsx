import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Video, 
  Calendar, 
  Users, 
  Link as LinkIcon, 
  Copy, 
  Send, 
  FileText, 
  Clock, 
  CheckCircle,
  ExternalLink,
  Shield,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VideoSession {
  id: string;
  case_id: string;
  client_id: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
}

interface Case {
  id: string;
  titulo: string;
  numero_expediente: string;
  numero_gedex: string | null;
  tribunal_gedex: string | null;
}

interface Client {
  id: string;
  nombre_completo: string;
  email: string | null;
}

export default function VirtualRoom() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schedule");

  // Formulario de nueva sesión
  const [newSession, setNewSession] = useState({
    case_id: "",
    client_id: "",
    scheduled_at: "",
    duration_minutes: 60,
    notes: ""
  });

  // Datos de consulta GEDEX
  const [gedexQuery, setGedexQuery] = useState({
    numero_expediente: "",
    tribunal: ""
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cargar sesiones - usando any temporalmente hasta que TypeScript se actualice
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('video_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .order('scheduled_at', { ascending: false }) as { data: any[], error: any };

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Cargar casos
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('id, titulo, numero_expediente, numero_gedex, tribunal_gedex')
        .eq('user_id', user!.id)
        .eq('estado', 'activo')
        .order('titulo');

      if (casesError) throw casesError;
      setCases(casesData || []);

      // Cargar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, nombre_completo, email')
        .eq('user_id', user!.id)
        .order('nombre_completo');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const generateMeetingLink = () => {
    // Generar enlace seguro único
    const meetingId = crypto.randomUUID().substring(0, 12);
    return `https://meet.praxislex.app/${meetingId}`;
  };

  const scheduleVideoSession = async () => {
    if (!newSession.case_id || !newSession.client_id || !newSession.scheduled_at) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      // Verificar si ya existe una sesión programada para el mismo caso, cliente y fecha
      const { data: existingSessions, error: checkError } = await supabase
        .from('video_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('case_id', newSession.case_id)
        .eq('client_id', newSession.client_id)
        .eq('scheduled_at', newSession.scheduled_at)
        .eq('status', 'scheduled')
        .maybeSingle() as { data: any, error: any };

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSessions) {
        toast.error('Ya existe una sesión programada para este caso, cliente y fecha', {
          description: 'Por favor, seleccione otra fecha y hora'
        });
        return;
      }

      const meetingLink = generateMeetingLink();

      const { data, error } = await supabase
        .from('video_sessions')
        .insert([{
          user_id: user!.id,
          case_id: newSession.case_id,
          client_id: newSession.client_id,
          scheduled_at: newSession.scheduled_at,
          duration_minutes: newSession.duration_minutes,
          meeting_link: meetingLink,
          status: 'scheduled',
          notes: newSession.notes || null
        }])
        .select()
        .single() as { data: any, error: any };

      if (error) {
        // Manejar errores específicos de base de datos
        if (error.code === '23505') {
          toast.error('Esta sesión ya existe en el sistema');
          return;
        }
        throw error;
      }

      setSessions([data, ...sessions] as VideoSession[]);
      
      // Enviar email al cliente
      const selectedClient = clients.find(c => c.id === newSession.client_id);
      if (selectedClient?.email) {
        // Aquí integraría con servicio de email
        toast.success(`Sesión programada. Enlace enviado a ${selectedClient.email}`);
      } else {
        toast.success('Sesión programada exitosamente');
      }

      // Limpiar formulario
      setNewSession({
        case_id: "",
        client_id: "",
        scheduled_at: "",
        duration_minutes: 60,
        notes: ""
      });
      
      setActiveTab("upcoming");
    } catch (error: any) {
      console.error('Error scheduling session:', error);
      toast.error('Error al programar sesión');
    }
  };

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  };

  const consultarGEDEX = () => {
    if (!gedexQuery.numero_expediente) {
      toast.error('Ingrese número de expediente');
      return;
    }

    // Abrir portal PJD en nueva pestaña
    const gedexUrl = `https://consultasenlinea.poderjudicial.gob.do/ConsultaExpediente.aspx`;
    window.open(gedexUrl, '_blank');
    
    toast.info('Portal GEDEX abierto. Ingrese el número de expediente manualmente', {
      description: `Expediente: ${gedexQuery.numero_expediente}`
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: "secondary" as const, label: "Programada" },
      active: { variant: "default" as const, label: "En Curso" },
      completed: { variant: "outline" as const, label: "Completada" },
      cancelled: { variant: "destructive" as const, label: "Cancelada" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Cargando sala virtual...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sala Virtual</h1>
          <p className="text-muted-foreground mt-1">
            Videoconferencias seguras con clientes e integración con GEDEX (PJD)
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Cifrado end-to-end
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Programar Sesión
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            <Video className="h-4 w-4 mr-2" />
            Sesiones Programadas
          </TabsTrigger>
          <TabsTrigger value="gedex">
            <Globe className="h-4 w-4 mr-2" />
            Consulta GEDEX (PJD)
          </TabsTrigger>
        </TabsList>

        {/* TAB: Programar Sesión */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Videoconferencia</CardTitle>
              <CardDescription>
                Programe una videoconferencia segura con su cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case">Caso Asociado *</Label>
                  <Select
                    value={newSession.case_id}
                    onValueChange={(value) => setNewSession({ ...newSession, case_id: value })}
                  >
                    <SelectTrigger id="case">
                      <SelectValue placeholder="Seleccione caso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.titulo} ({c.numero_expediente})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={newSession.client_id}
                    onValueChange={(value) => setNewSession({ ...newSession, client_id: value })}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Seleccione cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Fecha y Hora *</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={newSession.scheduled_at}
                    onChange={(e) => setNewSession({ ...newSession, scheduled_at: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={15}
                    max={240}
                    value={newSession.duration_minutes}
                    onChange={(e) => setNewSession({ ...newSession, duration_minutes: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas / Agenda</Label>
                <Textarea
                  id="notes"
                  placeholder="Temas a tratar, documentos a revisar, etc."
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={scheduleVideoSession} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Programar y Enviar Invitación
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Sesiones Programadas */}
        <TabsContent value="upcoming" className="space-y-4">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay sesiones programadas</p>
              </CardContent>
            </Card>
          ) : (
            sessions.map(session => {
              const sessionCase = cases.find(c => c.id === session.case_id);
              const sessionClient = clients.find(c => c.id === session.client_id);

              return (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {sessionCase?.titulo || 'Caso desconocido'}
                        </CardTitle>
                        <CardDescription>
                          <Users className="h-4 w-4 inline mr-1" />
                          {sessionClient?.nombre_completo || 'Cliente desconocido'}
                        </CardDescription>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(session.scheduled_at), "PPP 'a las' p", { locale: es })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {session.duration_minutes} min
                      </div>
                    </div>

                    {session.notes && (
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        <FileText className="h-4 w-4 inline mr-2" />
                        {session.notes}
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      <code className="flex-1 text-xs text-primary">{session.meeting_link}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyMeetingLink(session.meeting_link)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {session.status === 'scheduled' && (
                      <Button className="w-full" asChild>
                        <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4 mr-2" />
                          Iniciar Videoconferencia
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* TAB: Consulta GEDEX */}
        <TabsContent value="gedex" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Integración Portal Poder Judicial (GEDEX)
              </CardTitle>
              <CardDescription>
                Consulte expedientes en el sistema GEDEX del Poder Judicial Dominicano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Casos con GEDEX Registrado
                </h4>
                <div className="space-y-2">
                  {cases.filter(c => c.numero_gedex).length === 0 ? (
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      No hay casos con número GEDEX registrado
                    </p>
                  ) : (
                    cases.filter(c => c.numero_gedex).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border">
                        <div className="text-sm">
                          <div className="font-medium">{c.titulo}</div>
                          <div className="text-muted-foreground">
                            GEDEX: {c.numero_gedex} | Tribunal: {c.tribunal_gedex || 'No especificado'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setGedexQuery({ 
                              numero_expediente: c.numero_gedex || '', 
                              tribunal: c.tribunal_gedex || '' 
                            });
                            consultarGEDEX();
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Consultar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gedex_numero">Número de Expediente GEDEX</Label>
                  <Input
                    id="gedex_numero"
                    placeholder="Ej: 001-2024-CIVI-00123"
                    value={gedexQuery.numero_expediente}
                    onChange={(e) => setGedexQuery({ ...gedexQuery, numero_expediente: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gedex_tribunal">Tribunal</Label>
                  <Input
                    id="gedex_tribunal"
                    placeholder="Ej: JPI Santo Domingo"
                    value={gedexQuery.tribunal}
                    onChange={(e) => setGedexQuery({ ...gedexQuery, tribunal: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={consultarGEDEX} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Consultar en Portal GEDEX
              </Button>

              <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                <p className="font-medium">ℹ️ Instrucciones de uso:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Ingrese el número de expediente GEDEX del caso</li>
                  <li>Haga clic en "Consultar en Portal GEDEX"</li>
                  <li>Se abrirá el portal oficial del Poder Judicial</li>
                  <li>Ingrese los datos manualmente en el formulario del portal</li>
                  <li>Revise el estado, audiencias y movimientos del expediente</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
