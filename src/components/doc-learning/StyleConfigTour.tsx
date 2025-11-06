import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  BarChart3, 
  Variable, 
  Rocket, 
  History,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TOUR_STEPS = [
  {
    tab: "cargar",
    icon: FileText,
    title: "Paso 1: Cargar Documentos",
    description: "Sube hasta 15 documentos legales en formatos PDF, DOCX, RTF, ODT, HTML o TXT. El sistema analizará automáticamente el estilo de redacción y formato.",
    tips: [
      "Cada archivo puede pesar hasta 20 MB",
      "Los documentos escaneados serán procesados con OCR automático",
      "Puedes eliminar los originales tras el análisis por seguridad"
    ]
  },
  {
    tab: "analisis",
    icon: BarChart3,
    title: "Paso 2: Análisis Automático",
    description: "El sistema extrae características de estilo, estructura, tipografía, cláusulas comunes y variables dinámicas de tus documentos.",
    tips: [
      "El análisis puede tomar de 1 a 5 minutos según la cantidad de documentos",
      "Revisa las métricas de calidad para validar la extracción",
      "Las advertencias te indican si algo necesita atención manual"
    ]
  },
  {
    tab: "variables",
    icon: Variable,
    title: "Paso 3: Variables y Cláusulas",
    description: "Revisa y edita las variables detectadas (nombres, cédulas, RNC, montos) y las cláusulas recurrentes identificadas en tus documentos.",
    tips: [
      "Puedes renombrar variables para que sean más descriptivas",
      "Marca como 'requeridas' las variables obligatorias",
      "Las cláusulas más frecuentes tienen mayor confianza"
    ]
  },
  {
    tab: "perfil",
    icon: Rocket,
    title: "Paso 4: Publicar Perfil",
    description: "Revisa el perfil compilado con toda la información de estilo y publícalo para que el generador de documentos lo use automáticamente.",
    tips: [
      "Cada publicación crea una nueva versión del perfil",
      "Solo un perfil puede estar activo a la vez",
      "Puedes probar el perfil antes de publicarlo"
    ]
  },
  {
    tab: "historial",
    icon: History,
    title: "Paso 5: Historial y Versiones",
    description: "Consulta el historial de análisis realizados y las diferentes versiones de perfiles publicados. Compara versiones para ver los cambios.",
    tips: [
      "Cada análisis queda registrado con sus métricas",
      "Puedes reactivar versiones anteriores si es necesario",
      "El historial te ayuda a ver la evolución de tu estilo"
    ]
  }
];

interface StyleConfigTourProps {
  onTabChange: (tab: string) => void;
  currentTab: string;
}

export function StyleConfigTour({ onTabChange, currentTab }: StyleConfigTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("style-config-tour-completed");
    if (!hasSeenTour) {
      setShowWelcome(true);
    }
  }, []);

  const handleStartTour = () => {
    setShowWelcome(false);
    setIsOpen(true);
    setCurrentStep(0);
    onTabChange(TOUR_STEPS[0].tab);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onTabChange(TOUR_STEPS[nextStep].tab);
    } else {
      handleCompleteTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onTabChange(TOUR_STEPS[prevStep].tab);
    }
  };

  const handleCompleteTour = () => {
    localStorage.setItem("style-config-tour-completed", "true");
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    localStorage.setItem("style-config-tour-completed", "true");
    setShowWelcome(false);
    setIsOpen(false);
  };

  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;
  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <>
      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              Bienvenido a Configuración de Estilo
            </DialogTitle>
            <DialogDescription className="text-base pt-4">
              Este módulo te permite enseñar al sistema tu estilo de redacción legal subiendo documentos de ejemplo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  El sistema analizará automáticamente:
                </p>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Formato y tipografía (márgenes, fuentes, tamaños)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Estructura de documentos (secciones, numeración)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Cláusulas y frases recurrentes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Variables dinámicas (nombres, cédulas, montos)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto">
              Omitir Tour
            </Button>
            <Button onClick={handleStartTour} className="w-full sm:w-auto">
              Iniciar Tour Guiado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tour Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl flex items-center gap-2">
                <StepIcon className="h-5 w-5 text-primary" />
                {step.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="pt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Paso {currentStep + 1} de {TOUR_STEPS.length}
              </p>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <DialogDescription className="text-base">
              {step.description}
            </DialogDescription>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-3">💡 Consejos útiles:</p>
                <ul className="space-y-2">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex-row justify-between gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep === TOUR_STEPS.length - 1 ? "Finalizar" : "Siguiente"}
              {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Help Button */}
      {!isOpen && !showWelcome && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 rounded-full h-12 w-12 p-0 shadow-lg z-50"
          title="Abrir tour guiado"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}
