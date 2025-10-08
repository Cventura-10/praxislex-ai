import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Smartphone, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TwoFactorSetup() {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const { toast } = useToast();

  const startEnrollment = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      
      toast({
        title: "2FA Iniciado",
        description: "Escanea el código QR con tu app de autenticación",
      });
    } catch (error: any) {
      console.error("Error enrolling 2FA:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar 2FA",
        variant: "destructive",
      });
      setIsEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast({
        title: "Código inválido",
        description: "Ingresa un código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.data?.totp?.[0]) {
        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId: factors.data.totp[0].id,
          code: verifyCode,
        });

        if (error) throw error;

        setIsEnabled(true);
        setIsEnrolling(false);
        
        toast({
          title: "✅ 2FA Activado",
          description: "Tu cuenta ahora está protegida con autenticación de dos factores",
        });
      }
    } catch (error: any) {
      console.error("Error verifying 2FA:", error);
      toast({
        title: "Error",
        description: error.message || "Código de verificación incorrecto",
        variant: "destructive",
      });
    }
  };

  const disable2FA = async () => {
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.data?.totp?.[0]) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factors.data.totp[0].id,
        });

        if (error) throw error;

        setIsEnabled(false);
        setQrCode(null);
        setSecret(null);
        
        toast({
          title: "2FA Desactivado",
          description: "La autenticación de dos factores ha sido deshabilitada",
        });
      }
    } catch (error: any) {
      console.error("Error disabling 2FA:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo desactivar 2FA",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Autenticación de Dos Factores (2FA)</CardTitle>
        </div>
        <CardDescription>
          Añade una capa adicional de seguridad a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEnabled && !isEnrolling && (
          <div className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Necesitarás una app de autenticación como Google Authenticator, Authy o Microsoft Authenticator
              </AlertDescription>
            </Alert>
            
            <Button onClick={startEnrollment} className="w-full">
              <KeyRound className="mr-2 h-4 w-4" />
              Configurar 2FA
            </Button>
          </div>
        )}

        {isEnrolling && qrCode && (
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
            </div>
            
            <div className="space-y-2">
              <Label>Código secreto (manual)</Label>
              <code className="block p-2 bg-muted rounded text-sm break-all">
                {secret}
              </code>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-code">Código de verificación</Label>
              <Input
                id="verify-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={verifyAndEnable} className="flex-1">
                Verificar y Activar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEnrolling(false);
                  setQrCode(null);
                  setSecret(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {isEnabled && (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ 2FA está activo en tu cuenta
              </AlertDescription>
            </Alert>
            
            <Button variant="destructive" onClick={disable2FA} className="w-full">
              Desactivar 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
