import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, CheckCircle2, XCircle, Clock, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getMyAuditEvents, verifyAuditIntegrity, type AuditEvent } from "@/lib/security";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const AuditLogViewer = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAuditEvents();
  }, []);

  const loadAuditEvents = async () => {
    setLoading(true);
    const { data, error } = await getMyAuditEvents(100);
    
    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos de auditoría",
        variant: "destructive"
      });
    } else if (data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const handleVerifyIntegrity = async (eventId: string) => {
    setVerifying(eventId);
    const isValid = await verifyAuditIntegrity(eventId);
    
    toast({
      title: isValid ? "Integridad verificada" : "Verificación fallida",
      description: isValid 
        ? "El evento no ha sido alterado" 
        : "El hash del evento no coincide",
      variant: isValid ? "default" : "destructive"
    });
    setVerifying(null);
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      INSERT: "bg-green-500/10 text-green-500 border-green-500/20",
      UPDATE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
      VIEW_PII: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    };

    return (
      <Badge variant="outline" className={colors[action] || ""}>
        {action}
      </Badge>
    );
  };

  const getEntityIcon = (entityType: string) => {
    const icons: Record<string, any> = {
      clients: User,
      cases: FileText,
      invoices: FileText,
      default: Shield
    };
    const Icon = icons[entityType] || icons.default;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Cargando eventos de auditoría...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Registro de Auditoría
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Todos tus eventos de auditoría con verificación de integridad
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No hay eventos de auditoría registrados
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getEntityIcon(event.entity_type)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {event.entity_type}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.created_at), "PPp", { locale: es })}
                        </div>
                      </div>
                    </div>
                    {getActionBadge(event.action)}
                  </div>

                  {event.changes && (
                    <div className="text-xs bg-muted/50 p-3 rounded font-mono">
                      {JSON.stringify(event.changes, null, 2)}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Hash: {event.payload_hash.substring(0, 16)}...
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVerifyIntegrity(event.id)}
                      disabled={verifying === event.id}
                    >
                      {verifying === event.id ? (
                        <>Verificando...</>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verificar integridad
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
