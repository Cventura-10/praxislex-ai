import { useNavigate } from "react-router-dom";
import { Crown, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

export default function Upgrade() {
  const navigate = useNavigate();
  const { isPro, isAdmin } = useUserRole();

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
          <Crown className="h-10 w-10 text-[#D4AF37]" />
          <h1 className="text-4xl font-bold text-slate-900">Planes y Precios</h1>
        </div>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a las necesidades de tu despacho
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${
              plan.highlighted
                ? "ring-2 ring-[#0E6B4E] shadow-xl scale-105"
                : "shadow-md"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#D4AF37] text-white px-4 py-1">
                  {plan.badge}
                </Badge>
              </div>
            )}
            {plan.current && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-[#0E6B4E] text-white px-3 py-1">
                  Activo
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold text-slate-900">
                {plan.name}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-extrabold text-slate-900">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-slate-600 text-lg">{plan.period}</span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#0E6B4E] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              <Button
                className={`w-full ${
                  plan.highlighted
                    ? "bg-[#0E6B4E] hover:brightness-110"
                    : "bg-slate-700 hover:bg-slate-800"
                }`}
                disabled={plan.buttonDisabled}
              >
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle>¿Necesitas ayuda para elegir?</CardTitle>
          <CardDescription>
            Nuestro equipo está listo para ayudarte a encontrar el plan perfecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1">
              Agendar Demo
            </Button>
            <Button variant="outline" className="flex-1">
              Hablar con Ventas
            </Button>
            <Button variant="outline" className="flex-1">
              Ver Comparación Detallada
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
