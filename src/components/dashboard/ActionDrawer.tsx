import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  FileSignature,
  Upload,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface ActionItem {
  accion_id: string;
  tipo: string;
  titulo: string;
  descripcion?: string;
  relacion?: {
    expediente_id?: string;
    acto_slug?: string;
    documento_id?: string;
  };
  estado: "pendiente" | "en_curso" | "cumplido" | "vencido";
  prioridad: "alta" | "media" | "baja";
  vence?: string;
  responsables?: string[];
  created_at?: string;
  updated_at?: string;
}

interface ActionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionId: string | null;
  onStatusChange?: () => void;
}

export function ActionDrawer({ open, onOpenChange, actionId, onStatusChange }: ActionDrawerProps) {
  const navigate = useNavigate();
  const [action, setAction] = useState<ActionItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && actionId) {
      fetchActionDetails(actionId);
    }
  }, [open, actionId]);

  const fetchActionDetails = async (id: string) => {
    setLoading(true);
    try {
      // For now, we'll use mock data since the actions table needs to be created
      // TODO: Replace with actual database query when actions table is ready
      const mockAction: ActionItem = {
        accion_id: id,
        tipo: "notificacion",
        titulo: "Contratar demanda: CASO-2025-0001 - Acción de Amparo",
        descripcion: "Preparar y presentar demanda de amparo ante el tribunal competente. Verificar documentación requerida y plazos procesales.",
        relacion: {
          expediente_id: "CASO-2025-0001",
          acto_slug: "demanda-amparo",
        },
        estado: "pendiente",
        prioridad: "alta",
        vence: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        responsables: ["current-user"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAction(mockAction);
    } catch (error) {
      console.error("Error fetching action:", error);
      toast.error("Error al cargar la acción");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCase = () => {
    if (action?.relacion?.expediente_id) {
      navigate(`/casos?search=${action.relacion.expediente_id}`);
      onOpenChange(false);
    }
  };

  const handleOpenAct = () => {
    if (action?.relacion?.acto_slug && action?.relacion?.expediente_id) {
      navigate(`/actos/new?slug=${action.relacion.acto_slug}&case=${action.relacion.expediente_id}`);
      onOpenChange(false);
    }
  };

  const handleScheduleCalendar = () => {
    // Open calendar dialog with pre-filled data
    toast.info("Abriendo calendario...");
    navigate("/audiencias");
    onOpenChange(false);
  };

  const handleSendToSign = () => {
    toast.info("Abriendo wizard de firma digital...");
    onOpenChange(false);
  };

  const handleMarkComplete = async () => {
    if (!action) return;
    
    // TODO: Update action status in database
    toast.success("Acción marcada como cumplida");
    onStatusChange?.();
    onOpenChange(false);
  };

  const handleReassign = () => {
    toast.info("Función de reasignación próximamente");
  };

  const getStatusBadge = (estado: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      pendiente: { label: "Pendiente", variant: "secondary" },
      en_curso: { label: "En curso", variant: "default" },
      cumplido: { label: "Cumplido", variant: "outline" },
      vencido: { label: "Vencido", variant: "destructive" },
    };
    const config = variants[estado] || variants.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (prioridad: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      alta: { label: "Alta", className: "bg-destructive text-destructive-foreground" },
      media: { label: "Media", className: "bg-warning text-warning-foreground" },
      baja: { label: "Baja", className: "bg-muted text-muted-foreground" },
    };
    const config = variants[prioridad] || variants.media;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (!action && !loading) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-start justify-between gap-2">
            <span className="flex-1">{action?.titulo || "Cargando..."}</span>
            {action && (
              <div className="flex gap-1">
                {getStatusBadge(action.estado)}
                {getPriorityBadge(action.prioridad)}
              </div>
            )}
          </SheetTitle>
          <SheetDescription>
            {action?.tipo && `Tipo: ${action.tipo}`}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando detalles...</p>
          </div>
        ) : action ? (
          <Tabs defaultValue="resumen" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="descripcion">Detalles</TabsTrigger>
              <TabsTrigger value="vinculados">Vínculos</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <p className="mt-1">{getStatusBadge(action.estado)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
                      <p className="mt-1">{getPriorityBadge(action.prioridad)}</p>
                    </div>
                  </div>

                  {action.vence && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vencimiento</p>
                      <p className="mt-1 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-warning" />
                        {format(new Date(action.vence), "PPP 'a las' p", { locale: es })}
                      </p>
                    </div>
                  )}

                  {action.relacion?.expediente_id && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expediente</p>
                      <p className="mt-1 font-mono text-sm">{action.relacion.expediente_id}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <p className="text-sm font-medium">Acciones rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  {action.relacion?.expediente_id && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenCase}>
                      <FileText className="h-4 w-4" />
                      Abrir expediente
                    </Button>
                  )}
                  {action.relacion?.acto_slug && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenAct}>
                      <ExternalLink className="h-4 w-4" />
                      Abrir acto
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleScheduleCalendar}>
                    <Calendar className="h-4 w-4" />
                    Programar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleSendToSign}>
                    <FileSignature className="h-4 w-4" />
                    Enviar a firma
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkComplete}>
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar cumplida
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleReassign}>
                    <UserPlus className="h-4 w-4" />
                    Reasignar
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="descripcion" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    {action.descripcion ? (
                      <p className="text-sm">{action.descripcion}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No hay descripción disponible
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vinculados" className="mt-4 space-y-3">
              {action.relacion?.expediente_id && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Expediente vinculado</p>
                        <p className="text-sm text-muted-foreground font-mono mt-1">
                          {action.relacion.expediente_id}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleOpenCase}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {action.relacion?.acto_slug && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Acto vinculado</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.relacion.acto_slug}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleOpenAct}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!action.relacion?.expediente_id && !action.relacion?.acto_slug && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">
                      No hay elementos vinculados
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="historial" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {action.created_at && (
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <AlertCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Acción creada</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(action.created_at), "PPP 'a las' p", { locale: es })}
                          </p>
                        </div>
                      </div>
                    )}
                    <Separator />
                    <p className="text-sm text-muted-foreground text-center">
                      No hay eventos adicionales en el historial
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
