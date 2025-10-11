import { useEffect, useState } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { toast } from "sonner";

interface PendingOperation {
  id: string;
  type: "insert" | "update" | "delete";
  table: string;
  data: any;
  timestamp: number;
}

/**
 * Hook para sincronización offline
 * Guarda operaciones pendientes y las sincroniza al reconectar
 */
export function useOfflineSync() {
  const { isOnline } = useOnlineStatus();
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Cargar operaciones pendientes del localStorage
  useEffect(() => {
    const stored = localStorage.getItem("offline_pending_ops");
    if (stored) {
      try {
        const ops = JSON.parse(stored);
        setPendingOps(ops);
        console.log("[OfflineSync] Loaded", ops.length, "pending operations");
      } catch (err) {
        console.error("[OfflineSync] Error loading pending ops:", err);
        localStorage.removeItem("offline_pending_ops");
      }
    }
  }, []);

  // Sanitize operation data to remove PII before localStorage
  const sanitizeOperationData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    // Remove PII fields that should never be cached offline
    const piiFields = ['cedula_rnc_encrypted', 'cedula_rnc', 'email', 'telefono', 'direccion'];
    piiFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });
    return sanitized;
  };

  // Guardar operaciones pendientes en localStorage (sin PII)
  useEffect(() => {
    if (pendingOps.length > 0) {
      const sanitizedOps = pendingOps.map(op => ({
        ...op,
        data: sanitizeOperationData(op.data)
      }));
      localStorage.setItem("offline_pending_ops", JSON.stringify(sanitizedOps));
      console.log("[OfflineSync] Saved", pendingOps.length, "pending operations (PII removed)");
    } else {
      localStorage.removeItem("offline_pending_ops");
    }

    // Cleanup on window unload for security
    const handleUnload = () => {
      localStorage.removeItem('offline_pending_ops');
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [pendingOps]);

  // Sincronizar al reconectar
  useEffect(() => {
    if (isOnline && pendingOps.length > 0 && !isSyncing) {
      syncPendingOperations();
    }
  }, [isOnline, pendingOps.length]);

  /**
   * Agregar operación pendiente
   */
  const addPendingOperation = (
    type: PendingOperation["type"],
    table: string,
    data: any
  ) => {
    const op: PendingOperation = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      table,
      data,
      timestamp: Date.now(),
    };

    setPendingOps((prev) => [...prev, op]);

    console.log("[OfflineSync] Added pending operation:", op);

    toast.info("Operación guardada", {
      description: "Se sincronizará al reconectar",
    });

    return op.id;
  };

  /**
   * Sincronizar operaciones pendientes
   */
  const syncPendingOperations = async () => {
    if (pendingOps.length === 0 || isSyncing) return;

    setIsSyncing(true);
    console.log("[OfflineSync] Starting sync of", pendingOps.length, "operations");

    const successfulOps: string[] = [];
    const failedOps: PendingOperation[] = [];

    for (const op of pendingOps) {
      try {
        console.log(`[OfflineSync] Syncing operation ${op.id}:`, op);

        // Aquí iría la lógica real de sincronización con Supabase
        // Por ahora solo simulamos el éxito
        await new Promise((resolve) => setTimeout(resolve, 100));

        successfulOps.push(op.id);
      } catch (error) {
        console.error(`[OfflineSync] Failed to sync operation ${op.id}:`, error);
        failedOps.push(op);
      }
    }

    // Actualizar operaciones pendientes (mantener solo las que fallaron)
    setPendingOps(failedOps);

    setIsSyncing(false);

    if (successfulOps.length > 0) {
      console.log("[OfflineSync] Successfully synced", successfulOps.length, "operations");
      toast.success("Cambios sincronizados", {
        description: `${successfulOps.length} operación(es) completada(s)`,
      });
    }

    if (failedOps.length > 0) {
      console.warn("[OfflineSync]", failedOps.length, "operations failed to sync");
      toast.error("Algunas operaciones fallaron", {
        description: "Se reintentarán automáticamente",
      });
    }
  };

  /**
   * Limpiar operaciones pendientes
   */
  const clearPendingOperations = () => {
    setPendingOps([]);
    localStorage.removeItem("offline_pending_ops");
    console.log("[OfflineSync] Cleared all pending operations");
  };

  return {
    pendingOps,
    isSyncing,
    hasPendingOps: pendingOps.length > 0,
    addPendingOperation,
    syncPendingOperations,
    clearPendingOperations,
  };
}
