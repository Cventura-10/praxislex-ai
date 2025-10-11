import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { findActById } from "@/lib/legalActsData";
import { IntakeFormFlow } from "@/components/legal-acts/IntakeFormFlow";
import { ManualEditorFlow } from "@/components/legal-acts/ManualEditorFlow";

export default function LegalActWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const actId = searchParams.get("acto");
  const mode = searchParams.get("mode") as "intake" | "manual" | null;
  
  const [actInfo, setActInfo] = useState<ReturnType<typeof findActById>>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!actId || !mode) {
      toast({
        title: "Error",
        description: "Parámetros inválidos. Redirigiendo...",
        variant: "destructive",
      });
      navigate("/generador-actos");
      return;
    }

    const info = findActById(actId);
    if (!info) {
      toast({
        title: "Error",
        description: "Acto procesal no encontrado.",
        variant: "destructive",
      });
      navigate("/generador-actos");
      return;
    }

    // Verificar que el modo esté disponible para este acto
    if (mode === "intake" && !info.act.hasIntake) {
      toast({
        title: "Error",
        description: "Este acto no tiene formulario de intake disponible.",
        variant: "destructive",
      });
      navigate("/generador-actos");
      return;
    }

    if (mode === "manual" && !info.act.hasManual) {
      toast({
        title: "Error",
        description: "Este acto no tiene plantilla manual disponible.",
        variant: "destructive",
      });
      navigate("/generador-actos");
      return;
    }

    setActInfo(info);
    setIsLoading(false);
  }, [actId, mode, navigate, toast]);

  if (isLoading || !actInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/generador-actos")}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  {mode === "intake" ? (
                    <>
                      <Sparkles className="h-6 w-6 text-primary" />
                      Redacción Asistida
                    </>
                  ) : (
                    <>
                      <FileText className="h-6 w-6 text-primary" />
                      Redacción Manual
                    </>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {actInfo.act.name} • {actInfo.matter.name} • {actInfo.category.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {mode === "intake" ? (
            <IntakeFormFlow actInfo={actInfo} />
          ) : (
            <ManualEditorFlow actInfo={actInfo} />
          )}
        </div>
      </div>
    </div>
  );
}
