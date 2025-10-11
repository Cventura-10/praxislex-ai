import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function OnboardingFlow() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile && profile.full_name) {
      setFullName(profile.full_name);
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleCompleteProfile = async () => {
    if (!user || !fullName.trim()) {
      toast.error("Por favor completa tu nombre");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("¡Perfil completado!");
      
      // Redirect based on role
      if (profile?.role === "cliente") {
        navigate("/portal");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar perfil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Paso {step} de 2</span>
          </div>
          <CardTitle>¡Bienvenido a PraxisLex!</CardTitle>
          <CardDescription>
            Completa tu perfil para empezar a usar la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <Alert>
                <AlertDescription>
                  Tu cuenta ha sido creada exitosamente. Ahora completemos tu perfil.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 809-555-0100"
                  />
                </div>
              </div>

              <Button
                onClick={handleCompleteProfile}
                disabled={!fullName.trim() || saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
