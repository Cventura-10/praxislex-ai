import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App.tsx";
import "./index.css";
import { autoRepair } from "./lib/autoRepair";

// Configuración mejorada de React Query con auto-retry y auto-repair
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        console.log(`[QueryClient] Query failed (attempt ${failureCount}):`, error);

        // No reintentar errores de autenticación
        if (
          error?.message?.includes("JWT") ||
          error?.message?.includes("session")
        ) {
          console.log("[QueryClient] Auth error detected, not retrying");
          return false;
        }

        // No reintentar errores 4xx (excepto 429 - rate limit)
        const code = error?.code || error?.status;
        if (code >= 400 && code < 500 && code !== 429) {
          console.log("[QueryClient] Client error detected, not retrying");
          return false;
        }

        // Reintentar hasta 3 veces para otros errores
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Delay exponencial: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, attemptIndex), 30000);
        console.log(`[QueryClient] Retrying in ${delay}ms`);
        return delay;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        console.log(`[QueryClient] Mutation failed (attempt ${failureCount}):`, error);

        // No reintentar mutaciones de autenticación
        if (
          error?.message?.includes("JWT") ||
          error?.message?.includes("session")
        ) {
          return false;
        }

        // Reintentar solo errores de red o temporales
        const code = error?.code || error?.status;
        if (
          error?.message?.includes("network") ||
          error?.message?.includes("fetch") ||
          code === 503 || // Service unavailable
          code === 504    // Gateway timeout
        ) {
          return failureCount < 2;
        }

        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    },
  },
});

// Error handler global para errores no capturados
window.addEventListener("error", (event) => {
  console.error("[Global] Uncaught error:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    timestamp: new Date().toISOString(),
  });
  
  autoRepair(event.error).catch((err) =>
    console.error("[Global] Auto-repair failed:", err)
  );
});

// Handler para promesas rechazadas no manejadas
window.addEventListener("unhandledrejection", (event) => {
  console.error("[Global] Unhandled promise rejection:", {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString(),
  });
  
  autoRepair(event.reason).catch((err) =>
    console.error("[Global] Auto-repair failed:", err)
  );
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <>
      <App />
      {(() => {
        const isLocal = typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        return import.meta.env.DEV && isLocal ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null;
      })()}
    </>
  </QueryClientProvider>
);
