import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Send,
  Eye,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ESTADOS_PAGO } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const Accounting = () => {
  const { toast } = useToast();
  const [filterEstado, setFilterEstado] = useState("all");

  const stats = {
    totalPendiente: 245000,
    totalCobrado: 580000,
    vencidos: 3,
    esteMes: 125000,
  };

  const invoices = [
    {
      id: "fact_001",
      numero: "2025-001",
      cliente: "Juan Pérez",
      caso: "Cobro de pesos",
      concepto: "Honorarios demanda civil",
      monto: 35000,
      pagado: 0,
      saldo: 35000,
      fecha: "01 Oct 2025",
      vencimiento: "15 Oct 2025",
      estado: "pendiente" as const,
      metodo: null,
    },
    {
      id: "fact_002",
      numero: "2025-002",
      cliente: "Ana Martínez",
      caso: "Desalojo",
      concepto: "Honorarios + Gastos procesales",
      monto: 45000,
      pagado: 25000,
      saldo: 20000,
      fecha: "28 Sep 2025",
      vencimiento: "12 Oct 2025",
      estado: "parcial" as const,
      metodo: "Transferencia",
    },
    {
      id: "fact_003",
      numero: "2025-003",
      cliente: "Carlos García",
      caso: "Despido injustificado",
      concepto: "Anticipo honorarios laborales",
      monto: 30000,
      pagado: 30000,
      saldo: 0,
      fecha: "15 Sep 2025",
      vencimiento: "30 Sep 2025",
      estado: "pagado" as const,
      metodo: "Azul",
    },
    {
      id: "fact_004",
      numero: "2025-004",
      cliente: "Laura Rodríguez",
      caso: "Divorcio",
      concepto: "Honorarios proceso divorcio",
      monto: 50000,
      pagado: 50000,
      saldo: 0,
      fecha: "10 Sep 2025",
      vencimiento: "25 Sep 2025",
      estado: "pagado" as const,
      metodo: "Cheque",
    },
    {
      id: "fact_005",
      numero: "2024-145",
      cliente: "Bufete López & Asociados",
      caso: "Cobro de honorarios",
      concepto: "Consultoría jurídica - Agosto",
      monto: 85000,
      pagado: 0,
      saldo: 85000,
      fecha: "25 Ago 2025",
      vencimiento: "25 Sep 2025",
      estado: "vencido" as const,
      metodo: null,
    },
  ];

  const recentPayments = [
    {
      id: "pag_01",
      factura: "2025-003",
      cliente: "Carlos García",
      monto: 30000,
      metodo: "Azul",
      fecha: "28 Sep 2025",
    },
    {
      id: "pag_02",
      factura: "2025-004",
      cliente: "Laura Rodríguez",
      monto: 50000,
      metodo: "Cheque",
      fecha: "24 Sep 2025",
    },
    {
      id: "pag_03",
      factura: "2025-002",
      cliente: "Ana Martínez",
      monto: 25000,
      metodo: "Transferencia",
      fecha: "05 Oct 2025",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount);
  };

  const getEstadoBadge = (estado: typeof ESTADOS_PAGO[number]["value"]) => {
    const variants = {
      pendiente: { variant: "outline" as const, label: "Pendiente" },
      parcial: { variant: "secondary" as const, label: "Pago Parcial" },
      pagado: { variant: "default" as const, label: "Pagado" },
      vencido: { variant: "destructive" as const, label: "Vencido" },
      cancelado: { variant: "outline" as const, label: "Cancelado" },
    };
    const config = variants[estado];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSendInvoice = (numero: string, cliente: string) => {
    toast({
      title: "Factura enviada",
      description: `La factura ${numero} ha sido enviada a ${cliente}`,
    });
  };

  const handleRegisterPayment = (numero: string) => {
    toast({
      title: "Registrar pago",
      description: `Formulario de pago para factura ${numero}`,
    });
  };

  const filteredInvoices = filterEstado === "all" 
    ? invoices 
    : invoices.filter(inv => inv.estado === filterEstado);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contabilidad</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de cobros y pagos de clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva factura
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total pendiente"
          value={formatCurrency(stats.totalPendiente)}
          icon={Clock}
          variant="warning"
          description="Por cobrar"
        />
        <StatsCard
          title="Cobrado este mes"
          value={formatCurrency(stats.esteMes)}
          icon={CheckCircle2}
          variant="success"
          trend={{ value: "+18% vs mes anterior", isPositive: true }}
        />
        <StatsCard
          title="Total cobrado"
          value={formatCurrency(stats.totalCobrado)}
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="Facturas vencidas"
          value={stats.vencidos}
          icon={AlertTriangle}
          variant="warning"
          description="Requieren seguimiento"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Facturas</CardTitle>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADOS_PAGO.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-accent/5"
                  >
                    <TableCell>
                      <div>
                        <p className="font-mono font-medium text-sm">
                          {invoice.numero}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vence: {invoice.vencimiento}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{invoice.cliente}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.caso}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {invoice.concepto}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.monto)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          invoice.saldo > 0
                            ? "font-semibold text-warning"
                            : "text-muted-foreground"
                        }
                      >
                        {formatCurrency(invoice.saldo)}
                      </span>
                    </TableCell>
                    <TableCell>{getEstadoBadge(invoice.estado)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.estado !== "pagado" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Enviar factura"
                              onClick={() =>
                                handleSendInvoice(
                                  invoice.numero,
                                  invoice.cliente
                                )
                              }
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Registrar pago"
                              onClick={() =>
                                handleRegisterPayment(invoice.numero)
                              }
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Pagos recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{payment.cliente}</p>
                      <p className="text-xs text-muted-foreground">
                        Factura: {payment.factura}
                      </p>
                    </div>
                    <span className="font-semibold text-success">
                      {formatCurrency(payment.monto)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{payment.metodo}</span>
                    <span>{payment.fecha}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Resumen por cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                cliente: "Juan Pérez",
                total: 35000,
                pagado: 0,
                facturas: 1,
              },
              {
                cliente: "Ana Martínez",
                total: 45000,
                pagado: 25000,
                facturas: 1,
              },
              {
                cliente: "Carlos García",
                total: 30000,
                pagado: 30000,
                facturas: 1,
              },
              {
                cliente: "Bufete López",
                total: 85000,
                pagado: 0,
                facturas: 1,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-base"
              >
                <p className="font-semibold mb-3">{item.cliente}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagado:</span>
                    <span className="font-medium text-success">
                      {formatCurrency(item.pagado)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendiente:</span>
                    <span className="font-semibold text-warning">
                      {formatCurrency(item.total - item.pagado)}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {item.facturas} factura{item.facturas !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Accounting;
