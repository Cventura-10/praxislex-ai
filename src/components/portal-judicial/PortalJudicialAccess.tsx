import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, Calendar, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PortalJudicialAccessProps {
  defaultPath?: "/login" | "/mis-audiencias";
  onImportCalendar?: () => void;
}

export function PortalJudicialAccess({ 
  defaultPath = "/login",
  onImportCalendar 
}: PortalJudicialAccessProps) {
  const [usuario, setUsuario] = useState("");
  const [rememberCredentials, setRememberCredentials] = useState(false);
  const { toast } = useToast();

  // Portal Judicial SCJ base URL
  const SCJ_PORTAL_URL = "https://poderjudicial.gob.do/portal-servicios";

  const handleOpenPortal = (path: string = defaultPath) => {
    // v1.4.5 - Abrir Portal Judicial en nueva ventana
    const fullUrl = `${SCJ_PORTAL_URL}${path}`;
    
    try {
      // Abrir en ventana nueva con características de seguridad
      const portalWindow = window.open(
        fullUrl,
        'PortalJudicialSCJ',
        'width=1200,height=800,menubar=no,toolbar=no,location=yes,status=yes,scrollbars=yes'
      );

      if (!portalWindow) {
        toast({
          title: "Bloqueador de ventanas emergentes",
          description: "Por favor, permita ventanas emergentes para este sitio y vuelva a intentar.",
          variant: "destructive",
        });
        return;
      }

      // Guardar usuario si está marcado "Recordar"
      if (rememberCredentials && usuario) {
        try {
          localStorage.setItem('scj_portal_user', usuario);
        } catch (error) {
          console.error("Error guardando usuario:", error);
        }
      }

      toast({
        title: "Portal Judicial abierto",
        description: "Se ha abierto el Portal Judicial de la SCJ en una nueva ventana.",
      });

      // Log de telemetría
      console.log('[SCJ Portal] Acceso desde:', defaultPath === "/mis-audiencias" ? "calendar" : "dashboard");
    } catch (error) {
      console.error("Error abriendo portal:", error);
      toast({
        title: "Error",
        description: "No se pudo abrir el Portal Judicial. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleImportICS = () => {
    if (onImportCalendar) {
      onImportCalendar();
    } else {
      toast({
        title: "Importar calendario",
        description: "Esta funcionalidad estará disponible próximamente.",
      });
    }
  };

  // Cargar usuario guardado al montar
  useState(() => {
    try {
      const savedUser = localStorage.getItem('scj_portal_user');
      if (savedUser) {
        setUsuario(savedUser);
        setRememberCredentials(true);
      }
    } catch (error) {
      console.error("Error cargando usuario guardado:", error);
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-primary" />
          <CardTitle>Portal Judicial SCJ</CardTitle>
        </div>
        <CardDescription>
          Acceda al Portal Judicial de la Suprema Corte de Justicia con su usuario del Poder Judicial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Seguridad:</strong> Sus credenciales nunca son almacenadas ni transmitidas por PRAXIS LEX. 
            El acceso se realiza directamente al portal oficial del Poder Judicial.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="usuario">Usuario (opcional)</Label>
            <Input
              id="usuario"
              type="text"
              placeholder="Ingrese su usuario del Poder Judicial"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Su cédula o usuario asignado por el Poder Judicial
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="remember"
              checked={rememberCredentials}
              onCheckedChange={setRememberCredentials}
            />
            <Label htmlFor="remember" className="text-sm cursor-pointer">
              Recordar mi usuario en este dispositivo
            </Label>
          </div>
        </div>

        <div className="grid gap-2">
          <Button 
            onClick={() => handleOpenPortal("/login")}
            className="w-full"
          >
            <Lock className="mr-2 h-4 w-4" />
            Iniciar Sesión en Portal Judicial
          </Button>

          <Button 
            onClick={() => handleOpenPortal("/mis-audiencias")}
            variant="outline"
            className="w-full"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Ver Mis Audiencias en Portal
          </Button>

          {onImportCalendar && (
            <Button 
              onClick={handleImportICS}
              variant="secondary"
              className="w-full"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Importar Audiencias (ICS)
            </Button>
          )}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> El Portal Judicial se abrirá en una nueva ventana. 
            Si tiene activado un bloqueador de ventanas emergentes, deberá permitir las ventanas 
            emergentes de PRAXIS LEX para acceder al portal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}