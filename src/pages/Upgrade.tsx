import { useNavigate } from "react-router-dom";
import { Crown, Check, ArrowLeft, Mail, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Upgrade() {
  const navigate = useNavigate();
  const { isPro, isAdmin } = useUserRole();
  const { toast } = useToast();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactType, setContactType] = useState<"demo" | "sales" | "comparison">("demo");

  const handleUpgrade = (planName: string) => {
    setSelectedPlan(planName);
    setShowUpgradeDialog(true);
  };

  const handleContactSales = () => {
    setContactType("sales");
    setShowContactDialog(true);
  };

  const handleScheduleDemo = () => {
    setContactType("demo");
    setShowContactDialog(true);
  };

  const handleComparison = () => {
    setContactType("comparison");
    setShowContactDialog(true);
  };

  const handleConfirmUpgrade = () => {
    toast({
      title: "Solicitud enviada",
      description: "Nos pondremos en contacto contigo pronto para completar la actualización.",
    });
    setShowUpgradeDialog(false);
  };

  const handleContactSubmit = () => {
    toast({
      title: "Solicitud enviada",
      description: "Nos pondremos en contacto contigo en las próximas 24 horas.",
    });
    setShowContactDialog(false);
  };

  const plans = [
    {
      name: "Plan Gratuito",
      price: "$0",
      period: "/mes",
      description: "Perfecto para comenzar",
      features: [
        "Hasta 5 casos activos",
        "Documentos básicos",
        "1 GB de almacenamiento",
        "Soporte por email",
      ],
      current: !isPro && !isAdmin,
      buttonText: "Plan Actual",
      buttonDisabled: true,
      onClick: () => {},
    },
    {
      name: "Plan Pro",
      price: "$49",
      period: "/mes",
      description: "Para despachos profesionales",
      badge: "Más popular",
      features: [
        "Casos ilimitados",
        "IA con jurisprudencia citada",
        "Plantillas avanzadas DOCX/PDF",
        "Portal del cliente personalizado",
        "50 GB de almacenamiento",
        "Soporte prioritario 24/7",
        "Integraciones con tribunales",
        "Reportes y analíticas",
      ],
      current: isPro,
      buttonText: isPro ? "Plan Actual" : "Actualizar a Pro",
      buttonDisabled: isPro,
      highlighted: true,
      onClick: () => !isPro && handleUpgrade("Plan Pro"),
    },
    {
      name: "Plan Empresarial",
      price: "Personalizado",
      period: "",
      description: "Para grandes despachos",
      features: [
        "Todo lo incluido en Pro",
        "Usuarios ilimitados",
        "Almacenamiento ilimitado",
        "API personalizada",
        "Gestor de cuenta dedicado",
        "Capacitación del equipo",
        "SLA garantizado",
      ],
      current: isAdmin,
      buttonText: "Contactar Ventas",
      buttonDisabled: false,
      onClick: handleContactSales,
    },
  ];

  const faqs = [
    {
      question: "¿Puedo cambiar de plan en cualquier momento?",
      answer: "Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplicarán inmediatamente y se prorratearán los costos.",
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express) y transferencias bancarias para planes empresariales.",
    },
    {
      question: "¿Hay compromiso a largo plazo?",
      answer: "No, todos nuestros planes son mensuales sin compromiso. Puedes cancelar en cualquier momento.",
    },
    {
      question: "¿Qué incluye el soporte prioritario?",
      answer: "El soporte prioritario incluye respuesta en menos de 2 horas, acceso a chat directo con el equipo técnico y asistencia telefónica.",
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Dashboard
      </Button>

      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Crown className="h-10 w-10 text-accent" />
          <h1 className="text-4xl font-bold text-foreground">Planes y Precios</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a las necesidades de tu despacho
        </p>
      </div>

      <Tabs defaultValue="monthly" className="mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
          <TabsTrigger value="annual">Anual (20% descuento)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative transition-all duration-200 ${
              plan.highlighted
                ? "ring-2 ring-primary shadow-strong scale-105"
                : "shadow-medium hover:shadow-strong"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-accent text-accent-foreground px-4 py-1 shadow-medium">
                  {plan.badge}
                </Badge>
              </div>
            )}
            {plan.current && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-primary text-primary-foreground px-3 py-1 shadow-medium">
                  Activo
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-card-foreground">
                {plan.name}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-extrabold text-card-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-muted-foreground text-lg">{plan.period}</span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-card-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              <Button
                variant={plan.highlighted ? "default" : "secondary"}
                className="w-full"
                disabled={plan.buttonDisabled}
                onClick={plan.onClick}
              >
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="gradient-card shadow-medium mb-8">
        <CardHeader>
          <CardTitle>¿Necesitas ayuda para elegir?</CardTitle>
          <CardDescription>
            Nuestro equipo está listo para ayudarte a encontrar el plan perfecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleScheduleDemo}>
              <Calendar className="h-4 w-4" />
              Agendar Demo
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleContactSales}>
              <Mail className="h-4 w-4" />
              Hablar con Ventas
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleComparison}>
              <FileText className="h-4 w-4" />
              Ver Comparación Detallada
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Preguntas Frecuentes</CardTitle>
          <CardDescription>
            Respuestas a las dudas más comunes sobre nuestros planes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar a {selectedPlan}</DialogTitle>
            <DialogDescription>
              Confirma tu actualización al plan profesional. Nos pondremos en contacto contigo para procesar el pago y activar tu cuenta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="font-semibold mb-2">Beneficios incluidos:</h4>
              <ul className="space-y-2">
                {plans.find(p => p.name === selectedPlan)?.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Precio: <span className="font-semibold text-foreground">$49/mes</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmUpgrade}>
              Confirmar Actualización
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contactType === "demo" && "Agendar una demostración"}
              {contactType === "sales" && "Contactar con Ventas"}
              {contactType === "comparison" && "Comparación detallada de planes"}
            </DialogTitle>
            <DialogDescription>
              {contactType === "demo" && "Agenda una demostración personalizada de PraxisLex con nuestro equipo."}
              {contactType === "sales" && "Nuestro equipo de ventas te contactará para discutir tus necesidades."}
              {contactType === "comparison" && "Descarga una comparación detallada de todos nuestros planes y características."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                {contactType === "demo" && "Te enviaremos un correo electrónico con opciones de horarios disponibles para tu demostración."}
                {contactType === "sales" && "Un miembro de nuestro equipo se pondrá en contacto contigo en las próximas 24 horas."}
                {contactType === "comparison" && "Te enviaremos un documento PDF con la comparación completa de características y precios."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleContactSubmit}>
              {contactType === "comparison" ? "Enviar Documento" : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
