import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Offline indicator component
 * Shows connection status and provides feedback
 */
export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) {
      toast.warning('Sin conexión a internet', {
        description: 'Trabajando en modo offline. Los cambios se sincronizarán al reconectar.',
        duration: 5000,
      });
    } else if (wasOffline) {
      toast.success('Conexión restaurada', {
        description: 'Sincronizando cambios pendientes...',
        duration: 3000,
      });
    }
  }, [isOnline, wasOffline]);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-5">
      <Alert className="border-warning bg-warning/10">
        <WifiOff className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm font-medium text-warning">
          Modo offline - Los cambios se sincronizarán automáticamente
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Connection status badge for header
 */
export function ConnectionBadge() {
  const { isOnline } = useOnlineStatus();

  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: isOnline ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--warning) / 0.1)',
        color: isOnline ? 'hsl(var(--success))' : 'hsl(var(--warning))',
      }}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
