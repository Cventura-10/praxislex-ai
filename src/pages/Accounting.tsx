import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    numero_factura: "",
    client_id: "",
    concepto: "",
    monto: "",
    fecha: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*, clients(nombre_completo)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("nombre_completo");

      if (clientsError) throw clientsError;

      setInvoices(invoicesData || []);
      setClients(clientsData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.numero_factura || !newInvoice.client_id || !newInvoice.concepto || !newInvoice.monto) {
      toast({
        title: "Campos requeridos",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión activa");

      const { error } = await supabase
        .from("invoices")
        .insert({
          ...newInvoice,
          user_id: user.id,
          monto: parseFloat(newInvoice.monto),
        });

      if (error) throw error;

      toast({
        title: "✓ Factura creada",
        description: "La factura ha sido creada exitosamente",
      });

      setShowNewInvoiceDialog(false);
      setNewInvoice({
        numero_factura: "",
        client_id: "",
        concepto: "",
        monto: "",
        fecha: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la factura",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount);
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: { variant: "outline" as const, label: "Pendiente" },
      parcial: { variant: "secondary" as const, label: "Pago Parcial" },
      pagado: { variant: "default" as const, label: "Pagado" },
      vencido: { variant: "destructive" as const, label: "Vencido" },
      cancelado: { variant: "outline" as const, label: "Cancelado" },
    };
    const config = variants[estado as keyof typeof variants] || variants.pendiente;
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

  const stats = {
    totalPendiente: invoices.filter(inv => inv.estado === "pendiente").reduce((acc, inv) => acc + inv.monto, 0),
    totalCobrado: invoices.filter(inv => inv.estado === "pagado").reduce((acc, inv) => acc + inv.monto, 0),
    vencidos: invoices.filter(inv => inv.estado === "vencido").length,
    esteMes: invoices.filter(inv => {
      const invoiceDate = new Date(inv.fecha);
      const currentDate = new Date();
      return invoiceDate.getMonth() === currentDate.getMonth() && 
             invoiceDate.getFullYear() === currentDate.getFullYear() &&
             inv.estado === "pagado";
    }).reduce((acc, inv) => acc + inv.monto, 0),
  };

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
          <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva factura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Factura</DialogTitle>
                <DialogDescription>
                  Crear una nueva factura para un cliente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Número de Factura</Label>
                  <Input
                    value={newInvoice.numero_factura}
                    onChange={(e) => setNewInvoice({ ...newInvoice, numero_factura: e.target.value })}
                    placeholder="Ej: 2025-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={newInvoice.client_id}
                    onValueChange={(value) => setNewInvoice({ ...newInvoice, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Concepto</Label>
                  <Textarea
                    value={newInvoice.concepto}
                    onChange={(e) => setNewInvoice({ ...newInvoice, concepto: e.target.value })}
                    placeholder="Descripción de los servicios"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto (RD$)</Label>
                  <Input
                    type="number"
                    value={newInvoice.monto}
                    onChange={(e) => setNewInvoice({ ...newInvoice, monto: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={newInvoice.fecha}
                    onChange={(e) => setNewInvoice({ ...newInvoice, fecha: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateInvoice}>Crear Factura</Button>
                  <Button variant="outline" onClick={() => setShowNewInvoiceDialog(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : (
        <>
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

          <Card className="shadow-medium">
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
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No hay facturas creadas aún
                  </p>
                  <Button onClick={() => setShowNewInvoiceDialog(true)} size="sm">
                    Crear primera factura
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factura</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
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
                              {invoice.numero_factura}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(invoice.fecha).toLocaleDateString('es-DO')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">
                            {invoice.clients?.nombre_completo || "Cliente eliminado"}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {invoice.concepto}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.monto)}
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
                                      invoice.numero_factura,
                                      invoice.clients?.nombre_completo || "Cliente"
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
                                    handleRegisterPayment(invoice.numero_factura)
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Accounting;