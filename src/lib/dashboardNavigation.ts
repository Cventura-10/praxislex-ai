// Dashboard Navigation Dispatcher
// Handles all dashboard navigation events with proper routing and filtering

export type MetricKey = 
  | "NOTIFS"
  | "CASOS_ACTIVOS"
  | "VENCIMIENTOS"
  | "AUDIENCIAS"
  | "DOCS"
  | "PENDIENTES"
  | "IMPORTANTES";

export type CTAKey = 
  | "NUEVO_CASO"
  | "NUEVO_ACTO"
  | "NUEVA_TAREA";

export interface DashboardNavigationEvent {
  kind: "metric" | "item" | "cta";
  key?: string;
  payload?: {
    accion_id?: string;
    [key: string]: any;
  };
}

// Route mappings for metrics
const metricRoutes: Record<MetricKey, string> = {
  NOTIFS: "/audiencias", // Audiencias page shows deadlines and notifications
  CASOS_ACTIVOS: "/casos",
  VENCIMIENTOS: "/audiencias",
  AUDIENCIAS: "/audiencias",
  DOCS: "/documentos",
  PENDIENTES: "/audiencias",
  IMPORTANTES: "/audiencias",
};

// Route mappings for CTAs
const ctaRoutes: Record<CTAKey, string> = {
  NUEVO_CASO: "/casos",
  NUEVO_ACTO: "/redaccion-ia",
  NUEVA_TAREA: "/audiencias",
};

export function getMetricRoute(key: MetricKey): string {
  return metricRoutes[key] || "/";
}

export function getCTARoute(key: CTAKey): string {
  return ctaRoutes[key] || "/";
}

export function getItemRoute(accionId: string): string {
  return `/acciones/${accionId}?from=dashboard`;
}

export function dashboardNavigate(
  evt: DashboardNavigationEvent,
  navigate: (path: string) => void,
  openDrawer?: (path: string) => void
) {
  switch (evt.kind) {
    case "metric":
      if (evt.key) {
        navigate(getMetricRoute(evt.key as MetricKey));
      }
      break;
    case "item":
      if (evt.payload?.accion_id && openDrawer) {
        openDrawer(getItemRoute(evt.payload.accion_id));
      }
      break;
    case "cta":
      if (evt.key) {
        navigate(getCTARoute(evt.key as CTAKey));
      }
      break;
  }
}
