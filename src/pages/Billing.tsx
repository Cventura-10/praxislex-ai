import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const currentPlan = {
    name: "Pro",
    price: "RD$ 3,990",
    interval: "mensual",
    limits: {
      users: { used: 3, total: 10 },
      storage: { used: 45, total: 200 }, // GB
      aiDrafts: { used: 128, total: 500 },
    },
    features: [
      "Gestión de casos ilimitados",
      "Búsqueda de jurisprudencia",
      "Portal del cliente",
      "500 borradores con IA/mes",
      "200 GB de almacenamiento",
      "10 usuarios",
    ],
  };

  const invoices = [
    {
      id: "inv_01",
      periodo: "Octubre 2025",
      monto: "RD$ 3,990",
      fecha: "01 Oct 2025",
      estado: "Pagado",
    },
    {
      id: "inv_02",
      periodo: "Septiembre 2025",
      monto: "RD$ 3,990",
      fecha: "01 Sep 2025",
      estado: "Pagado",
    },
    {
      id: "inv_03",
      periodo: "Agosto 2025",
      monto: "RD$ 3,990",
      fecha: "01 Ago 2025",
      estado: "Pagado",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "RD$ 1,990",
      description: "Para abogados independientes",
      features: [
        "Casos ilimitados",
        "1 usuario",
        "50 GB almacenamiento",
        "100 borradores IA/mes",
      ],
    },
    {
      name: "Pro",
      price: "RD$ 3,990",
      description: "Para firmas medianas",
      features: [
        "Todo en Starter",
        "10 usuarios",
        "200 GB almacenamiento",
        "500 borradores IA/mes",
        "Jurisprudencia avanzada",
        "Portal del cliente",
      ],
      highlighted: true,
    },
    {
      name: "Elite",
      price: "RD$ 8,990",
      description: "Para grandes bufetes",
      features: [
        "Todo en Pro",
        "Usuarios ilimitados",
        "1 TB almacenamiento",
        "2000 borradores IA/mes",
        "Firma electrónica",
        "API access",
        "Soporte prioritario",
      ],
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
              {currentPlan.price}/{currentPlan.interval}
            </p>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => handleChangePlan("Pro")}
            >
              Cambiar plan
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
            <p className="text-sm text-muted-foreground mt-1">01 Nov 2025</p>
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
                className={`p-6 rounded-lg border ${
                  plan.highlighted
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold font-serif">{plan.name}</h3>
                  {plan.highlighted && (
                    <Badge variant="default">Actual</Badge>
                  )}
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mes</span>
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
                  variant={plan.highlighted ? "outline" : "default"}
                  className="w-full gap-2"
                  disabled={plan.highlighted}
                  onClick={() => handleChangePlan(plan.name)}
                >
                  {plan.highlighted ? "Plan actual" : "Cambiar a este plan"}
                  {!plan.highlighted && <ArrowUpRight className="h-4 w-4" />}
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