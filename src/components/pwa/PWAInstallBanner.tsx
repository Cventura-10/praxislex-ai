import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, X, Share } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Android/Desktop beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS banner if not installed and not dismissed
    if (iOS && !isStandalone) {
      const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        toast.success('¡Aplicación instalada!', {
          description: 'PraxisLex se ha instalado correctamente en tu dispositivo.',
        });
        setShowBanner(false);
      } else {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast.error('Error al instalar', {
        description: 'No se pudo completar la instalación. Intenta de nuevo más tarde.',
      });
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (isIOS) {
      localStorage.setItem('pwa-install-dismissed-ios', Date.now().toString());
    } else {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom-5">
      <Alert className="border-primary bg-primary/5 shadow-lg">
        <Download className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary flex items-center justify-between">
          Instalar PraxisLex
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            Instala PraxisLex en tu dispositivo para acceso rápido y funcionalidad offline.
          </p>
          
          {isIOS ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Para instalar en iOS:</p>
              <ol className="text-sm text-muted-foreground space-y-1 pl-4">
                <li className="flex items-start gap-2">
                  <Share className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Toca el botón de compartir <Share className="inline h-3 w-3" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Download className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Selecciona "Añadir a pantalla de inicio"</span>
                </li>
              </ol>
            </div>
          ) : (
            <Button 
              onClick={handleInstallClick}
              className="w-full"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Instalar Ahora
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}