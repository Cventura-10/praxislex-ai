import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, X } from "lucide-react";
import { useState } from "react";

/**
 * Update prompt component
 * Notifies users when a new version is available
 */
export function UpdatePrompt() {
  const { hasUpdate, updateApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!hasUpdate || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert className="border-primary bg-primary/5">
        <RefreshCw className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Actualización disponible</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-muted-foreground mb-3">
            Hay una nueva versión de PraxisLex disponible con mejoras y correcciones.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={updateApp}>
              Actualizar ahora
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
