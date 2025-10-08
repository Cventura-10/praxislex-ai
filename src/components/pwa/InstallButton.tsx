import { Download, Check } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Install button for PWA
 * Shows when app is installable but not yet installed
 */
export function InstallButton() {
  const { isInstallable, isInstalled, installApp } = usePWA();

  const handleInstall = async () => {
    const installed = await installApp();
    
    if (installed) {
      toast.success('Aplicación instalada', {
        description: 'PraxisLex se ha instalado correctamente en tu dispositivo.',
      });
    }
  };

  if (!isInstallable || isInstalled) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Instalar App
    </Button>
  );
}

/**
 * Installed badge
 * Shows when app is installed
 */
export function InstalledBadge() {
  const { isInstalled } = usePWA();

  if (!isInstalled) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
      <Check className="h-3 w-3" />
      <span>Instalada</span>
    </div>
  );
}
