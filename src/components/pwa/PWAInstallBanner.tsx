import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Android/Desktop: beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS: detect Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari && !isStandalone) {
      setShowIOSPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA instalada");
    }

    setDeferredPrompt(null);
    setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  // Android/Desktop prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 md:left-auto md:right-4 md:max-w-md">
        <Alert className="border-primary bg-card shadow-lg">
          <Download className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <AlertTitle>Instalar PraxisLex</AlertTitle>
            <AlertDescription className="mt-2">
              Instala la aplicación en tu dispositivo para un acceso rápido y trabajar offline.
            </AlertDescription>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={handleInstall} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // iOS prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 md:left-auto md:right-4 md:max-w-md">
        <Alert className="border-primary bg-card shadow-lg">
          <Share className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <AlertTitle>Instalar PraxisLex</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>Para instalar esta app en tu iPhone/iPad:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Toca el botón <strong>Compartir</strong> <Share className="inline h-3 w-3" /></li>
                <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                <li>Toca <strong>"Añadir"</strong></li>
              </ol>
            </AlertDescription>
          </div>
          <Button onClick={handleDismiss} variant="ghost" size="sm" className="mt-4">
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </Alert>
      </div>
    );
  }

  return null;
}
