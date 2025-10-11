import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, User, Briefcase, Rocket } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, title: "Información Personal", icon: User },
  { id: 2, title: "Tu Rol", icon: Briefcase },
  { id: 3, title: "¡Listo!", icon: Rocket },
];

export function OnboardingWizard({ open, onComplete }: { open: boolean; onComplete: () => void }) {
  const { profile, updateProfile } = useUserProfile();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    role: profile?.role || "cliente",
  });
  const [loading, setLoading] = useState(false);

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate personal info
      if (!formData.full_name.trim()) {
        toast.error("Por favor ingresa tu nombre completo");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Save profile
      setLoading(true);
      const result = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone || null,
        role: formData.role as any,
      });

      if (result.success) {
        setCurrentStep(3);
      } else {
        toast.error("Error al guardar perfil", {
          description: result.error,
        });
      }
      setLoading(false);
    } else if (currentStep === 3) {
      // Complete onboarding
      onComplete();
      
      // Navigate based on role
      if (formData.role === "cliente") {
        navigate("/portal");
      } else {
        navigate("/dashboard");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const CurrentIcon = STEPS[currentStep - 1].icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CurrentIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {STEPS[currentStep - 1].title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {currentStep === 1 && "Cuéntanos un poco sobre ti"}
            {currentStep === 2 && "¿Cómo usarás PraxisLex?"}
            {currentStep === 3 && "¡Todo listo para comenzar!"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progress} className="h-2" />

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  placeholder="Juan Pérez"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (809) 123-4567"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona tu rol para personalizar tu experiencia:
              </p>
              {[
                { value: "cliente" as const, label: "Cliente", description: "Accede a tu portal de cliente" },
                { value: "abogado" as const, label: "Abogado", description: "Gestiona casos y clientes" },
                { value: "asistente" as const, label: "Asistente Legal", description: "Apoya en gestión operativa" },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    formData.role === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setFormData({ ...formData, role: option.value })}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                    {formData.role === option.value && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center space-y-4 py-6">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">¡Bienvenido a PraxisLex!</h3>
                <p className="text-muted-foreground mt-2">
                  {formData.role === "cliente"
                    ? "Tu portal está listo. Podrás ver tus casos, audiencias y facturas."
                    : "Tu dashboard está configurado. Comienza a gestionar casos y clientes."}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {currentStep > 1 && currentStep < 3 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Atrás
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Guardando..." : currentStep === 3 ? "Comenzar" : "Continuar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}