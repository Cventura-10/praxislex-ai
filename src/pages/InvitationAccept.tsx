import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function InvitationAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [invitationValid, setInvitationValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    const token = searchParams.get("token");
    
    if (!token) {
      setErrorMessage("Token de invitación no válido");
      setLoading(false);
      return;
    }

    try {
      // Call the validation function (without consuming the token yet)
      const { data, error } = await supabase.rpc("validate_invitation_token", {
        p_token: token,
      });

      if (error) throw error;

      const result = data[0];
      
      if (result.is_valid) {
        setInvitationValid(true);
        setClientEmail(result.client_email);
      } else {
        setErrorMessage(result.error_message || "Token inválido");
      }
    } catch (error: any) {
      console.error("Error validating token:", error);
      setErrorMessage("Error al validar la invitación");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);

    try {
      const token = searchParams.get("token");
      
      // Create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: clientEmail,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/client-portal`,
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("No se pudo crear la cuenta");
      }

      // Now consume the token and link to the client
      const { data: validationData, error: validationError } = await supabase.rpc(
        "validate_invitation_token",
        { p_token: token }
      );

      if (validationError) throw validationError;

      const result = validationData[0];
      
      if (!result.is_valid) {
        throw new Error(result.error_message);
      }

      toast({
        title: "¡Cuenta creada!",
        description: "Bienvenido al Portal del Cliente",
      });

      // Navigate to client portal
      navigate("/client-portal");
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validando invitación...</p>
        </div>
      </div>
    );
  }

  if (!invitationValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <CardTitle>Invitación Inválida</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">
              Posibles causas:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>El enlace de invitación ha expirado (válido por 7 días)</li>
              <li>La invitación ya fue utilizada</li>
              <li>El enlace no es válido</li>
            </ul>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <CardTitle>Invitación Válida</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Cree su cuenta para acceder al Portal del Cliente
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={clientEmail}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita su contraseña"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={validating}
            >
              {validating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta y Acceder"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
