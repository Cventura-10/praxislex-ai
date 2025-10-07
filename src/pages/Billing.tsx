import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  TrendingUp,
  Users,
  Database,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  Download,
  ArrowLeft,
} from "lucide-react";

const Billing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPro, isAdmin, isFree } = useUserRole();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const getPrice = (monthlyPrice: number) => {
    if (billingCycle === "annual") {
      const annualPrice = monthlyPrice * 12 * 0.8; // 20% descuento
      return `$${Math.round(annualPrice)}`;
    }
    return `$${monthlyPrice}`;
  };

  const getPeriod = () => {
    return billingCycle === "annual" ? "/año" : "/mes";
  };

  // Determine current plan based on user role
  const getCurrentPlanName = () => {
    if (isAdmin) return "Plan Empresarial";
    if (isPro) return "Plan Pro";
    return "Plan Gratuito";
  };

  const getCurrentPlanPrice = () => {
    if (isAdmin) return "Personalizado";
    if (isPro) return billingCycle === "monthly" ? "$49" : "$470";
    return "$0";
  };

  const currentPlan = {
    name: getCurrentPlanName(),
    price: getCurrentPlanPrice(),
    interval: billingCycle === "monthly" ? "mensual" : "anual",
    limits: {
      users: { used: isPro ? 3 : 1, total: isPro ? 10 : 1 },
      storage: { used: isPro ? 45 : 0.5, total: isPro ? 50 : 1 }, // GB
      aiDrafts: { used: isPro ? 128 : 5, total: isPro ? 500 : 10 },
    },
  };

  const invoices = [
    {
      id: "inv_01",
      periodo: "Octubre 2025",
      monto: getCurrentPlanPrice() !== "Personalizado" ? getCurrentPlanPrice() : "$49",
      fecha: "01 Oct 2025",
      estado: "Pagado",
    },
    {
      id: "inv_02",
      periodo: "Septiembre 2025",
      monto: getCurrentPlanPrice() !== "Personalizado" ? getCurrentPlanPrice() : "$49",
      fecha: "01 Sep 2025",
      estado: "Pagado",
    },
    {
      id: "inv_03",
      periodo: "Agosto 2025",
      monto: getCurrentPlanPrice() !== "Personalizado" ? getCurrentPlanPrice() : "$49",
      fecha: "01 Ago 2025",
      estado: "Pagado",
    },
  ];

  const plans = [
    {
      name: "Plan Gratuito",
      monthlyPrice: 0,
      description: "Perfecto para comenzar",
      features: [
        "Hasta 5 casos activos",
        "Documentos básicos",
        "1 GB de almacenamiento",
        "Soporte por email",
      ],
      current: isFree,
    },
    {
      name: "Plan Pro",
      monthlyPrice: 49,
      description: "Para despachos profesionales",
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
      highlighted: isPro,
      current: isPro,
    },
    {
      name: "Plan Empresarial",
      monthlyPrice: null,
      customPrice: "Personalizado",
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
    },
  ];

  const handleChangePlan = (planName: string) => {
    setSelectedPlan(planName);
    setShowPaymentDialog(true);
  };

  const handleProcessPayment = () => {
    toast({
      title: "✓ Pago procesado",
      description: `Tu plan ha sido actualizado a ${selectedPlan}`,
    });
    setShowPaymentDialog(false);
    setSelectedPlan("");
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "✓ Descarga iniciada",
      description: "La factura se está descargando",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tu suscripción y métodos de pago
            </p>
          </div>
        </div>
      </div>

      <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "annual")} className="mb-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
          <TabsTrigger value="annual">
            Anual
            <Badge variant="secondary" className="ml-2 text-xs">-20%</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-medium border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plan actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif">
                {currentPlan.name}
              </span>
              <Badge variant="default">Activo</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentPlan.price}{currentPlan.price !== "Personalizado" && `/${currentPlan.interval}`}
            </p>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => navigate("/upgrade")}
            >
              Ver todos los planes
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Próximo pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">{currentPlan.price}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {billingCycle === "monthly" ? "01 Nov 2025" : "01 Oct 2026"}
            </p>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Gestión de pagos",
                  description: "Redirigiendo a la configuración de métodos de pago",
                });
              }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Métodos de pago
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Créditos IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-serif">
              {currentPlan.limits.aiDrafts.used}
              <span className="text-lg text-muted-foreground">
                /{currentPlan.limits.aiDrafts.total}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Este mes</p>
            <Progress
              value={
                (currentPlan.limits.aiDrafts.used /
                  currentPlan.limits.aiDrafts.total) *
                100
              }
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Uso actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Usuarios</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {currentPlan.limits.users.used} de {currentPlan.limits.users.total}
                </span>
              </div>
              <Progress
                value={
                  (currentPlan.limits.users.used / currentPlan.limits.users.total) *
                  100
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Almacenamiento</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {currentPlan.limits.storage.used} GB de{" "}
                  {currentPlan.limits.storage.total} GB
                </span>
              </div>
              <Progress
                value={
                  (currentPlan.limits.storage.used /
                    currentPlan.limits.storage.total) *
                  100
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Planes disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-lg border transition-all duration-200 ${
                  plan.highlighted
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold font-serif">{plan.name}</h3>
                  {plan.current && (
                    <Badge variant="default">Actual</Badge>
                  )}
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-bold">
                    {plan.customPrice || getPrice(plan.monthlyPrice)}
                  </span>
                  {!plan.customPrice && (
                    <>
                      <span className="text-muted-foreground">{getPeriod()}</span>
                      {billingCycle === "annual" && plan.monthlyPrice > 0 && (
                        <div className="mt-1">
                          <span className="text-sm text-muted-foreground line-through">
                            ${plan.monthlyPrice * 12}/año
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.current ? "outline" : "default"}
                  className="w-full gap-2"
                  disabled={plan.current}
                  onClick={() => plan.name === "Plan Empresarial" ? navigate("/upgrade") : handleChangePlan(plan.name)}
                >
                  {plan.current ? "Plan actual" : plan.name === "Plan Empresarial" ? "Contactar Ventas" : "Cambiar a este plan"}
                  {!plan.current && <ArrowUpRight className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Historial de facturación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-base"
              >
                <div>
                  <p className="font-medium">{invoice.periodo}</p>
                  <p className="text-sm text-muted-foreground">{invoice.fecha}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{invoice.monto}</p>
                    <Badge variant="default" className="text-xs">
                      {invoice.estado}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDownloadInvoice(invoice.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Plan</DialogTitle>
            <DialogDescription>
              Confirma el cambio de plan a {selectedPlan}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Resumen del plan {selectedPlan}</h3>
              <p className="text-sm text-muted-foreground">
                El plan será efectivo inmediatamente y se facturará el próximo ciclo.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleProcessPayment} className="flex-1">
                Confirmar cambio
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;