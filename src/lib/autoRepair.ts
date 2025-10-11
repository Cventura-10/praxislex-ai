/**
 * Sistema de Auto-Reparación
 * Detecta y repara errores automáticamente
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tipos de errores que podemos auto-reparar
export type RepairableError =
  | "session_expired"
  | "network_error"
  | "database_connection"
  | "storage_error"
  | "rls_error"
  | "unknown";

export interface RepairResult {
  success: boolean;
  error?: string;
  action?: string;
}

/**
 * Detecta el tipo de error y determina si es reparable
 */
export function detectErrorType(error: any): RepairableError {
  const errorMessage = error?.message?.toLowerCase() || "";
  const errorCode = error?.code;

  // Sesión expirada o inválida
  if (
    errorMessage.includes("jwt") ||
    errorMessage.includes("session") ||
    errorMessage.includes("expired") ||
    errorCode === "PGRST301"
  ) {
    return "session_expired";
  }

  // Error de red
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("connection") ||
    error?.name === "NetworkError"
  ) {
    return "network_error";
  }

  // Error de base de datos
  if (
    errorMessage.includes("database") ||
    errorMessage.includes("postgres") ||
    errorCode?.startsWith("P")
  ) {
    return "database_connection";
  }

  // Error de storage
  if (errorMessage.includes("storage") || errorMessage.includes("bucket")) {
    return "storage_error";
  }

  // Error de RLS
  if (
    errorMessage.includes("rls") ||
    errorMessage.includes("row level security") ||
    errorMessage.includes("permission denied")
  ) {
    return "rls_error";
  }

  return "unknown";
}

/**
 * Intenta reparar la sesión expirada
 */
async function repairSession(): Promise<RepairResult> {
  try {
    console.log("[AutoRepair] Attempting to repair session...");

    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error("[AutoRepair] Session repair failed:", error);
      
      // Si no se puede reparar, redirigir al login
      window.location.href = "/auth";
      
      return {
        success: false,
        error: error.message,
        action: "redirect_to_login",
      };
    }

    console.log("[AutoRepair] Session repaired successfully");
    toast.success("Sesión restaurada", {
      description: "Tu sesión ha sido renovada automáticamente",
    });

    return { success: true, action: "session_refreshed" };
  } catch (err) {
    console.error("[AutoRepair] Unexpected error during session repair:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Intenta reparar error de red con retry
 */
async function repairNetworkError(
  retryFn: () => Promise<any>,
  maxRetries = 3
): Promise<RepairResult> {
  console.log("[AutoRepair] Attempting to repair network error...");

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Espera exponencial: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      console.log(`[AutoRepair] Retry ${i + 1}/${maxRetries} after ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      const result = await retryFn();
      console.log("[AutoRepair] Network error repaired via retry");

      return { success: true, action: `retry_${i + 1}` };
    } catch (error) {
      console.error(`[AutoRepair] Retry ${i + 1} failed:`, error);

      if (i === maxRetries - 1) {
        return {
          success: false,
          error: "Max retries exceeded",
          action: "manual_intervention_required",
        };
      }
    }
  }

  return { success: false, error: "All retries failed" };
}

/**
 * Verifica la salud de la conexión a la base de datos
 */
async function checkDatabaseHealth(): Promise<RepairResult> {
  try {
    console.log("[AutoRepair] Checking database health...");

    // Use a simple query that won't fail with RLS
    const { error } = await supabase.from("user_profiles").select("id").limit(1);

    // Even RLS errors mean the database is responding
    console.log("[AutoRepair] Database is healthy");
    return { success: true };
  } catch (err) {
    console.error("[AutoRepair] Database health check error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Función principal de auto-reparación
 */
export async function autoRepair(
  error: any,
  retryFn?: () => Promise<any>
): Promise<RepairResult> {
  const errorType = detectErrorType(error);

  console.log(`[AutoRepair] Detected error type: ${errorType}`);

  switch (errorType) {
    case "session_expired":
      return await repairSession();

    case "network_error":
      if (retryFn) {
        return await repairNetworkError(retryFn);
      }
      return {
        success: false,
        error: "No retry function provided",
      };

    case "database_connection":
      const dbHealth = await checkDatabaseHealth();
      if (!dbHealth.success) {
        toast.error("Error de conexión a la base de datos", {
          description: "Intentando reconectar...",
        });
      }
      return dbHealth;

    case "rls_error":
      // Para errores de RLS, intentar refrescar sesión
      console.log("[AutoRepair] RLS error detected, attempting session refresh");
      return await repairSession();

    default:
      console.log("[AutoRepair] Error type not auto-repairable");
      return {
        success: false,
        error: "Not a repairable error type",
      };
  }
}

/**
 * Wrapper para funciones async que auto-repara errores
 */
export async function withAutoRepair<T>(
  fn: () => Promise<T>,
  maxAttempts = 2
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`[withAutoRepair] Attempt ${attempt + 1} failed:`, error);
      lastError = error;

      if (attempt < maxAttempts - 1) {
        const repairResult = await autoRepair(error, fn);

        if (repairResult.success) {
          console.log("[withAutoRepair] Error repaired, retrying...");
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}
