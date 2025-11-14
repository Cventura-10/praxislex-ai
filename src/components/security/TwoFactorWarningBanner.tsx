import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function TwoFactorWarningBanner() {
  const [show, setShow] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      // Verificar si el usuario ya descartó el banner en esta sesión
      const wasDismissed = sessionStorage.getItem('2fa-warning-dismissed');
      if (wasDismissed === 'true') {
        setDismissed(true);
        return;
      }

      const { data } = await supabase.auth.mfa.listFactors();
      const has2FA = data?.totp && data.totp.length > 0;
      setIsEnabled(has2FA);
      setShow(!has2FA);
    } catch (error) {
      console.error("Error checking 2FA status:", error);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('2fa-warning-dismissed', 'true');
    setDismissed(true);
    setShow(false);
  };

  const handleSetup = () => {
    navigate('/security');
  };

  if (!show || dismissed || isEnabled) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-2 relative">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="font-bold text-lg">
            ⚠️ Autenticación de Dos Factores (2FA) NO Activada
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              <strong>Tu cuenta NO está protegida adecuadamente.</strong> La autenticación de dos factores es OBLIGATORIA para cumplir con nuestras políticas de seguridad.
            </p>
            <p className="text-sm">
              Sin 2FA, tu cuenta es vulnerable a accesos no autorizados incluso si tu contraseña es robada.
            </p>
            <div className="flex gap-2 mt-3">
              <Button onClick={handleSetup} className="bg-white text-red-600 hover:bg-gray-100">
                <Shield className="h-4 w-4 mr-2" />
                Activar 2FA Ahora
              </Button>
              <Button variant="outline" onClick={handleDismiss} className="border-white text-white hover:bg-red-800">
                Recordar más tarde
              </Button>
            </div>
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6 text-white hover:bg-red-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
