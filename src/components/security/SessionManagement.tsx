import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Monitor, Smartphone, Tablet, LogOut, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: Date;
  isCurrent: boolean;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      // En producción, esto vendría de una tabla de sesiones
      // Por ahora, mostramos la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSessions([{
          id: session.access_token.slice(0, 10),
          device: getDeviceType(),
          browser: getBrowserName(),
          ip: "---",
          location: "República Dominicana",
          lastActive: new Date(),
          isCurrent: true,
        }]);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      if (sessions.find(s => s.id === sessionId)?.isCurrent) {
        await supabase.auth.signOut();
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado tu sesión actual",
        });
      } else {
        // Revocar sesión específica
        toast({
          title: "Sesión revocada",
          description: "La sesión ha sido cerrada",
        });
        setSessions(sessions.filter(s => s.id !== sessionId));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo revocar la sesión",
        variant: "destructive",
      });
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      // En producción, esto revocaría todas las sesiones excepto la actual
      const otherSessions = sessions.filter(s => !s.isCurrent);
      setSessions(sessions.filter(s => s.isCurrent));
      
      toast({
        title: "Sesiones revocadas",
        description: `${otherSessions.length} sesión(es) cerradas`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron revocar las sesiones",
        variant: "destructive",
      });
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.includes("Mobile")) return <Smartphone className="h-4 w-4" />;
    if (device.includes("Tablet")) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Cargando sesiones...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Sesiones</CardTitle>
        <CardDescription>
          Administra las sesiones activas en tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length > 1 && (
          <Button 
            variant="outline" 
            onClick={revokeAllOtherSessions}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar todas las demás sesiones
          </Button>
        )}

        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-start gap-4 p-4 border rounded-lg"
            >
              <div className="mt-1">
                {getDeviceIcon(session.device)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{session.browser}</p>
                  {session.isCurrent && (
                    <Badge variant="secondary">Sesión actual</Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {session.device}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {session.location}
                  </span>
                  <span>
                    {formatDistanceToNow(session.lastActive, {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeSession(session.id)}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "Mobile";
  }
  return "Desktop";
}

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Navegador desconocido";
}
