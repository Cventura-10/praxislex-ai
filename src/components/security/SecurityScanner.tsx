import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Lock,
  Key,
  Database,
  FileWarning
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: "passed" | "failed" | "warning" | "pending";
  severity: "critical" | "high" | "medium" | "low";
  recommendation?: string;
}

export function SecurityScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const { toast } = useToast();

  const runSecurityScan = async () => {
    setIsScanning(true);
    setProgress(0);
    setChecks([]);

    const securityChecks: SecurityCheck[] = [
      {
        id: "password-strength",
        name: "Fortaleza de contraseña",
        description: "Verificar si la contraseña cumple con los requisitos mínimos",
        status: "pending",
        severity: "high",
      },
      {
        id: "2fa-enabled",
        name: "Autenticación de dos factores",
        description: "Verificar si 2FA está habilitado",
        status: "pending",
        severity: "critical",
      },
      {
        id: "rls-policies",
        name: "Row Level Security",
        description: "Verificar políticas RLS en todas las tablas",
        status: "pending",
        severity: "critical",
      },
      {
        id: "data-encryption",
        name: "Encriptación de datos sensibles",
        description: "Verificar que datos sensibles estén encriptados",
        status: "pending",
        severity: "high",
      },
      {
        id: "session-timeout",
        name: "Timeout de sesión",
        description: "Verificar configuración de timeout de sesión",
        status: "pending",
        severity: "medium",
      },
      {
        id: "audit-logs",
        name: "Logs de auditoría",
        description: "Verificar que los logs de auditoría estén activos",
        status: "pending",
        severity: "medium",
      },
    ];

    for (let i = 0; i < securityChecks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const check = securityChecks[i];
      
      // Simular verificaciones (en producción, estas serían llamadas reales)
      if (check.id === "2fa-enabled") {
        check.status = "warning";
        check.recommendation = "Habilita 2FA para mayor seguridad";
      } else if (check.id === "rls-policies") {
        check.status = "passed";
      } else if (check.id === "password-strength") {
        check.status = "passed";
      } else if (check.id === "data-encryption") {
        check.status = "passed";
      } else if (check.id === "session-timeout") {
        check.status = "passed";
      } else if (check.id === "audit-logs") {
        check.status = "passed";
      }

      setChecks([...securityChecks.slice(0, i + 1)]);
      setProgress(((i + 1) / securityChecks.length) * 100);
    }

    setIsScanning(false);
    
    const failedCount = securityChecks.filter(c => c.status === "failed").length;
    const warningCount = securityChecks.filter(c => c.status === "warning").length;

    if (failedCount > 0) {
      toast({
        title: "⚠️ Problemas de seguridad detectados",
        description: `${failedCount} problema(s) crítico(s) y ${warningCount} advertencia(s)`,
        variant: "destructive",
      });
    } else if (warningCount > 0) {
      toast({
        title: "Escaneo completado",
        description: `${warningCount} advertencia(s) encontradas`,
      });
    } else {
      toast({
        title: "✅ Sistema seguro",
        description: "No se encontraron problemas de seguridad",
      });
    }
  };

  const getStatusIcon = (status: SecurityCheck["status"]) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />;
    }
  };

  const getSeverityBadge = (severity: SecurityCheck["severity"]) => {
    const colors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[severity]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Escaneo de Seguridad</CardTitle>
        </div>
        <CardDescription>
          Analiza el estado de seguridad de tu cuenta y datos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSecurityScan} 
          disabled={isScanning}
          className="w-full"
        >
          {isScanning ? "Escaneando..." : "Iniciar Escaneo"}
        </Button>

        {isScanning && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% completado
            </p>
          </div>
        )}

        {checks.length > 0 && (
          <div className="space-y-3">
            {checks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className="mt-0.5">
                  {getStatusIcon(check.status)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{check.name}</p>
                    {getSeverityBadge(check.severity)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {check.description}
                  </p>

                  {check.recommendation && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {check.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isScanning && checks.length === 0 && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Escaneo de seguridad</AlertTitle>
            <AlertDescription>
              Ejecuta un escaneo para verificar el estado de seguridad de tu cuenta
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
