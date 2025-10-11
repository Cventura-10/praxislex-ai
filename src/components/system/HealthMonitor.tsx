import { useHealthMonitor } from "@/hooks/useHealthMonitor";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Database, Lock, HardDrive, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Componente visual del monitor de salud del sistema
 * Muestra el estado de DB, Auth, Storage y operaciones pendientes
 */
export function HealthMonitor() {
  const { health, isHealthy } = useHealthMonitor();
  const { hasPendingOps, pendingOps } = useOfflineSync();

  // Solo mostrar si hay problemas o operaciones pendientes
  if (isHealthy && !hasPendingOps) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border rounded-lg shadow-strong p-3 space-y-2 min-w-[240px]">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Cloud className="h-4 w-4" />
          <span>Estado del Sistema</span>
        </div>

        <div className="space-y-1.5">
          <StatusItem
            icon={Database}
            label="Base de datos"
            isHealthy={health.database}
          />
          <StatusItem icon={Lock} label="Autenticación" isHealthy={health.auth} />
          <StatusItem
            icon={HardDrive}
            label="Almacenamiento"
            isHealthy={health.storage}
          />
        </div>

        {hasPendingOps && (
          <div className="pt-2 border-t">
            <Badge variant="secondary" className="text-xs">
              {pendingOps.length} operación(es) pendiente(s)
            </Badge>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-1">
          Última verificación: {health.lastCheck.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  icon: Icon,
  label,
  isHealthy,
}: {
  icon: any;
  label: string;
  isHealthy: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {isHealthy ? (
        <CheckCircle className="h-3.5 w-3.5 text-success" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
      )}
    </div>
  );
}
