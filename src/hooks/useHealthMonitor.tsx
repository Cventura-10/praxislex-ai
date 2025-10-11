import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HealthStatus {
  database: boolean;
  auth: boolean;
  storage: boolean;
  overall: boolean;
  lastCheck: Date;
}

/**
 * Hook que monitorea la salud del sistema y auto-repara problemas
 */
export function useHealthMonitor(intervalMs = 60000) {
  const [health, setHealth] = useState<HealthStatus>({
    database: true,
    auth: true,
    storage: true,
    overall: true,
    lastCheck: new Date(),
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    if (isChecking) return;

    setIsChecking(true);
    console.log("[HealthMonitor] Running health check...");

    const newHealth: HealthStatus = {
      database: true,
      auth: true,
      storage: true,
      overall: true,
      lastCheck: new Date(),
    };

    // Check database
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      newHealth.database = !error;
      
      if (error) {
        console.error("[HealthMonitor] Database check failed:", error);
      }
    } catch (err) {
      console.error("[HealthMonitor] Database check error:", err);
      newHealth.database = false;
    }

    // Check auth
    try {
      const { data, error } = await supabase.auth.getSession();
      newHealth.auth = !error && !!data.session;

      if (error) {
        console.error("[HealthMonitor] Auth check failed:", error);
      }

      // Auto-repair: refresh session if expired
      if (!newHealth.auth && health.auth) {
        console.log("[HealthMonitor] Auth issue detected, attempting refresh...");
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError) {
          newHealth.auth = true;
          toast.success("Sesión restaurada automáticamente");
        } else {
          toast.error("Sesión expirada", {
            description: "Por favor, inicia sesión nuevamente",
            action: {
              label: "Ir al login",
              onClick: () => (window.location.href = "/auth"),
            },
          });
        }
      }
    } catch (err) {
      console.error("[HealthMonitor] Auth check error:", err);
      newHealth.auth = false;
    }

    // Check storage
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      newHealth.storage = !error;

      if (error) {
        console.error("[HealthMonitor] Storage check failed:", error);
      }
    } catch (err) {
      console.error("[HealthMonitor] Storage check error:", err);
      newHealth.storage = false;
    }

    // Overall health
    newHealth.overall = newHealth.database && newHealth.auth && newHealth.storage;

    // Detectar cambios en la salud
    if (health.overall && !newHealth.overall) {
      console.warn("[HealthMonitor] System health degraded");
      toast.warning("Problemas de conectividad detectados", {
        description: "El sistema intentará reconectar automáticamente",
      });
    } else if (!health.overall && newHealth.overall) {
      console.log("[HealthMonitor] System health restored");
      toast.success("Conectividad restaurada");
    }

    setHealth(newHealth);
    setIsChecking(false);

    console.log("[HealthMonitor] Health check complete:", newHealth);
  };

  useEffect(() => {
    // Check inicial
    checkHealth();

    // Configurar intervalo
    const interval = setInterval(checkHealth, intervalMs);

    // Listener para cambios de visibilidad
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[HealthMonitor] Tab became visible, checking health...");
        checkHealth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs]);

  return {
    health,
    isHealthy: health.overall,
    checkHealth,
    isChecking,
  };
}
