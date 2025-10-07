import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIAS_GASTOS } from "@/lib/constants";
import { 
  ArrowLeft, 
  Plus, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  Eye,
  DollarSign,
  ShoppingCart,
  Trash2,
  Printer,
} from "lucide-react";

export default function AccountingNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showStatementDialog, setShowStatementDialog] = useState(false);
  const [accountStatement, setAccountStatement] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [balance, setBalance] = useState(0);
  
  const [newCredit, setNewCredit] = useState({
    client_id: "",
    monto: "",
    concepto: "",
    tipo: "credito",
    fecha: new Date().toISOString().split('T')[0],
    referencia: "",
    notas: "",
  });

  const [newPayment, setNewPayment] = useState({
    client_id: "",
    monto: "",
    concepto: "",
    metodo_pago: "",
    fecha: new Date().toISOString().split('T')[0],
    referencia: "",
    invoice_id: "",
    notas: "",
  });
  
  const [newExpense, setNewExpense] = useState({
    client_id: "",
    case_id: "",
    concepto: "",
    categoria: "",
    monto: "",
    fecha: new Date().toISOString().split('T')[0],
    metodo_pago: "",
    proveedor: "",
    referencia: "",
    notas: "",
    reembolsable: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, nombre_completo, cedula_rnc")
        .eq("user_id", user.id)
        .order("nombre_completo");

      const { data: casesData } = await supabase
        .from("cases")
        .select("id, titulo, numero_expediente, client_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data: expensesData } = await supabase
        .from("expenses")
        .select("*, clients(nombre_completo), cases(titulo, numero_expediente)")
        .eq("user_id", user.id)
        .order("fecha", { ascending: false });

      setClients(clientsData || []);
      setCases(casesData || []);
      setExpenses(expensesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("id, nombre_completo, cedula_rnc")
        .eq("user_id", user.id)
        .order("nombre_completo");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleCreateExpense = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("expenses").insert([
        {
          ...newExpense,
          monto: parseFloat(newExpense.monto),
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Gasto registrado",
        description: "El gasto ha sido registrado exitosamente",
      });

      setShowExpenseDialog(false);
      setNewExpense({
        client_id: "",
        case_id: "",
        concepto: "",
        categoria: "",
        monto: "",
        fecha: new Date().toISOString().split('T')[0],
        metodo_pago: "",
        proveedor: "",
        referencia: "",
        notas: "",
        reembolsable: true,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el gasto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      toast({
        title: "Gasto eliminado",
        description: "El gasto ha sido eliminado exitosamente",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el gasto",
        variant: "destructive",
      });
    }
  };

  const handleCreateCredit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("client_credits").insert([
        {
          ...newCredit,
          monto: parseFloat(newCredit.monto),
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Crédito creado",
        description: "El crédito ha sido registrado exitosamente",
      });

      setShowCreditDialog(false);
      setNewCredit({
        client_id: "",
        monto: "",
        concepto: "",
        tipo: "credito",
        fecha: new Date().toISOString().split('T')[0],
        referencia: "",
        notas: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el crédito",
        variant: "destructive",
      });
    }
  };

  const handleCreatePayment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("payments").insert([
        {
          ...newPayment,
          monto: parseFloat(newPayment.monto),
          user_id: user.id,
          invoice_id: newPayment.invoice_id || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado exitosamente",
      });

      setShowPaymentDialog(false);
      setNewPayment({
        client_id: "",
        monto: "",
        concepto: "",
        metodo_pago: "",
        fecha: new Date().toISOString().split('T')[0],
        referencia: "",
        invoice_id: "",
        notas: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el pago",
        variant: "destructive",
      });
    }
  };

  const handleViewStatement = async (clientId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: invoices } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .eq("client_id", clientId)
        .order("fecha");

      const { data: credits } = await supabase
        .from("client_credits")
        .select("*")
        .eq("user_id", user.id)
        .eq("client_id", clientId)
        .order("fecha");

      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .eq("client_id", clientId)
        .order("fecha");

      const statement: any[] = [];
      let runningBalance = 0;

      const allTransactions = [
        ...(invoices || []).map(inv => ({
          type: 'invoice',
          fecha: inv.fecha,
          concepto: `Factura ${inv.numero_factura} - ${inv.concepto}`,
          debito: inv.monto,
          credito: 0,
          referencia: inv.numero_factura,
        })),
        ...(credits || []).map(cred => ({
          type: 'credit',
          fecha: cred.fecha,
          concepto: cred.concepto,
          debito: cred.tipo === 'debito' ? cred.monto : 0,
          credito: cred.tipo === 'credito' ? cred.monto : 0,
          referencia: cred.referencia || '',
        })),
        ...(payments || []).map(pay => ({
          type: 'payment',
          fecha: pay.fecha,
          concepto: `Pago - ${pay.concepto}`,
          debito: 0,
          credito: pay.monto,
          referencia: pay.referencia || '',
        })),
      ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      allTransactions.forEach(trans => {
        runningBalance += trans.debito - trans.credito;
        statement.push({
          ...trans,
          saldo: runningBalance,
        });
      });

      setAccountStatement(statement);
      setBalance(runningBalance);
      setSelectedClientId(clientId);
      setShowStatementDialog(true);
    } catch (error) {
      console.error("Error fetching account statement:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el estado de cuenta",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectedClientName = clients.find(c => c.id === selectedClientId)?.nombre_completo || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contabilidad')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión Financiera</h1>
            <p className="text-muted-foreground mt-1">
              Administra créditos, pagos, gastos y estados de cuenta
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" variant="outline">
                <ShoppingCart className="h-4 w-4" />
                Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Gasto</DialogTitle>
                <DialogDescription>
                  Registrar un gasto relacionado con un caso
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="expense_client">Cliente *</Label>
                  <Select 
                    value={newExpense.client_id} 
                    onValueChange={(value) => {
                      setNewExpense({ ...newExpense, client_id: value, case_id: "" });
                      setSelectedClientId(value);
                    }}
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
                <div className="grid gap-2">
                  <Label htmlFor="expense_case">Caso</Label>
                  <Select 
                    value={newExpense.case_id} 
                    onValueChange={(value) => setNewExpense({ ...newExpense, case_id: value })}
                    disabled={!newExpense.client_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar caso (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases
                        .filter(c => c.client_id === newExpense.client_id)
                        .map((caso) => (
                          <SelectItem key={caso.id} value={caso.id}>
                            {caso.numero_expediente} - {caso.titulo}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense_categoria">Categoría *</Label>
                  <Select value={newExpense.categoria} onValueChange={(value) => setNewExpense({ ...newExpense, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_GASTOS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense_concepto">Concepto *</Label>
                  <Input
                    id="expense_concepto"
                    value={newExpense.concepto}
                    onChange={(e) => setNewExpense({ ...newExpense, concepto: e.target.value })}
                    placeholder="Descripción del gasto"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense_monto">Monto *</Label>
                  <Input
                    id="expense_monto"
                    type="number"
                    step="0.01"
                    value={newExpense.monto}
                    onChange={(e) => setNewExpense({ ...newExpense, monto: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense_proveedor">Proveedor</Label>
                  <Input
                    id="expense_proveedor"
                    value={newExpense.proveedor}
                    onChange={(e) => setNewExpense({ ...newExpense, proveedor: e.target.value })}
                    placeholder="Nombre del proveedor (opcional)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense_metodo">Método de Pago</Label>
                  <Select value={newExpense.metodo_pago} onValueChange={(value) => setNewExpense({ ...newExpense, metodo_pago: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense_fecha">Fecha *</Label>
                  <Input
                    id="expense_fecha"
                    type="date"
                    value={newExpense.fecha}
                    onChange={(e) => setNewExpense({ ...newExpense, fecha: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense_referencia">Referencia</Label>
                  <Input
                    id="expense_referencia"
                    value={newExpense.referencia}
                    onChange={(e) => setNewExpense({ ...newExpense, referencia: e.target.value })}
                    placeholder="Número de factura o recibo (opcional)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense_notas">Notas</Label>
                  <Textarea
                    id="expense_notas"
                    value={newExpense.notas}
                    onChange={(e) => setNewExpense({ ...newExpense, notas: e.target.value })}
                    placeholder="Notas adicionales (opcional)"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateExpense} 
                  disabled={!newExpense.client_id || !newExpense.concepto || !newExpense.categoria || !newExpense.monto}
                >
                  Registrar Gasto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" variant="outline">
                <TrendingDown className="h-4 w-4" />
                Nuevo Crédito/Débito
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Crédito/Débito</DialogTitle>
                <DialogDescription>
                  Agregar un crédito a favor o débito del cliente
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="credit_client">Cliente *</Label>
                  <Select value={newCredit.client_id} onValueChange={(value) => setNewCredit({ ...newCredit, client_id: value })}>
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
                <div className="grid gap-2">
                  <Label htmlFor="credit_tipo">Tipo *</Label>
                  <Select value={newCredit.tipo} onValueChange={(value) => setNewCredit({ ...newCredit, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credito">Crédito (A favor del cliente)</SelectItem>
                      <SelectItem value="debito">Débito (Debe el cliente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit_monto">Monto *</Label>
                  <Input
                    id="credit_monto"
                    type="number"
                    step="0.01"
                    value={newCredit.monto}
                    onChange={(e) => setNewCredit({ ...newCredit, monto: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit_concepto">Concepto *</Label>
                  <Input
                    id="credit_concepto"
                    value={newCredit.concepto}
                    onChange={(e) => setNewCredit({ ...newCredit, concepto: e.target.value })}
                    placeholder="Descripción del crédito/débito"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit_fecha">Fecha *</Label>
                  <Input
                    id="credit_fecha"
                    type="date"
                    value={newCredit.fecha}
                    onChange={(e) => setNewCredit({ ...newCredit, fecha: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit_referencia">Referencia</Label>
                  <Input
                    id="credit_referencia"
                    value={newCredit.referencia}
                    onChange={(e) => setNewCredit({ ...newCredit, referencia: e.target.value })}
                    placeholder="Número de referencia (opcional)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit_notas">Notas</Label>
                  <Textarea
                    id="credit_notas"
                    value={newCredit.notas}
                    onChange={(e) => setNewCredit({ ...newCredit, notas: e.target.value })}
                    placeholder="Notas adicionales (opcional)"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCredit} disabled={!newCredit.client_id || !newCredit.monto || !newCredit.concepto}>
                  Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Registrar Pago
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Pago</DialogTitle>
                <DialogDescription>
                  Registrar un pago recibido del cliente
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="payment_client">Cliente *</Label>
                  <Select value={newPayment.client_id} onValueChange={(value) => setNewPayment({ ...newPayment, client_id: value })}>
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
                <div className="grid gap-2">
                  <Label htmlFor="payment_monto">Monto *</Label>
                  <Input
                    id="payment_monto"
                    type="number"
                    step="0.01"
                    value={newPayment.monto}
                    onChange={(e) => setNewPayment({ ...newPayment, monto: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment_concepto">Concepto *</Label>
                  <Input
                    id="payment_concepto"
                    value={newPayment.concepto}
                    onChange={(e) => setNewPayment({ ...newPayment, concepto: e.target.value })}
                    placeholder="Descripción del pago"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment_metodo">Método de Pago *</Label>
                  <Select value={newPayment.metodo_pago} onValueChange={(value) => setNewPayment({ ...newPayment, metodo_pago: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment_fecha">Fecha *</Label>
                  <Input
                    id="payment_fecha"
                    type="date"
                    value={newPayment.fecha}
                    onChange={(e) => setNewPayment({ ...newPayment, fecha: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment_referencia">Referencia</Label>
                  <Input
                    id="payment_referencia"
                    value={newPayment.referencia}
                    onChange={(e) => setNewPayment({ ...newPayment, referencia: e.target.value })}
                    placeholder="Número de transacción (opcional)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment_notas">Notas</Label>
                  <Textarea
                    id="payment_notas"
                    value={newPayment.notas}
                    onChange={(e) => setNewPayment({ ...newPayment, notas: e.target.value })}
                    placeholder="Notas adicionales (opcional)"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePayment} disabled={!newPayment.client_id || !newPayment.monto || !newPayment.concepto || !newPayment.metodo_pago}>
                  Registrar Pago
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clients">Clientes y Estados de Cuenta</TabsTrigger>
          <TabsTrigger value="expenses">Gastos Procesales</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Clientes - Estados de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay clientes registrados
                </p>
              ) : (
                <div className="grid gap-3">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-base"
                    >
                      <div>
                        <p className="font-medium">{client.nombre_completo}</p>
                        <p className="text-sm text-muted-foreground">{client.cedula_rnc}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleViewStatement(client.id)}
                      >
                        <Eye className="h-4 w-4" />
                        Ver Estado de Cuenta
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Gastos Procesales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay gastos registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-base"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{expense.concepto}</p>
                          <Badge variant="outline">
                            {CATEGORIAS_GASTOS.find(c => c.value === expense.categoria)?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{expense.clients?.nombre_completo}</span>
                          {expense.cases && (
                            <>
                              <span>•</span>
                              <span>{expense.cases.numero_expediente}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatDate(expense.fecha)}</span>
                          {expense.proveedor && (
                            <>
                              <span>•</span>
                              <span>{expense.proveedor}</span>
                            </>
                          )}
                        </div>
                        {expense.notas && (
                          <p className="text-xs text-muted-foreground mt-1">{expense.notas}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-lg">{formatCurrency(expense.monto)}</p>
                          {expense.reembolsable && !expense.reembolsado && (
                            <Badge variant="secondary" className="text-xs">
                              Reembolsable
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total de gastos:</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(expenses.reduce((sum, exp) => sum + parseFloat(exp.monto), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showStatementDialog} onOpenChange={setShowStatementDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader className="print:hidden">
            <DialogTitle>Estado de Cuenta - {selectedClientName}</DialogTitle>
            <DialogDescription>
              Historial completo de transacciones
            </DialogDescription>
          </DialogHeader>
          <div id="statement-content" className="space-y-4 overflow-y-auto print:overflow-visible">
            <Card className="print:shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Actual</p>
                    <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(balance))}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {balance >= 0 ? 'A favor del cliente' : 'Debe el cliente'}
                    </p>
                  </div>
                  <Receipt className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <div className="border rounded-lg overflow-hidden print:border-none">
              <div className="overflow-x-auto max-h-96 overflow-y-auto print:overflow-visible print:max-h-none">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Fecha</th>
                      <th className="text-left p-3 text-sm font-medium">Concepto</th>
                      <th className="text-right p-3 text-sm font-medium">Débito</th>
                      <th className="text-right p-3 text-sm font-medium">Crédito</th>
                      <th className="text-right p-3 text-sm font-medium">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountStatement.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-muted-foreground">
                          No hay transacciones registradas
                        </td>
                      </tr>
                    ) : (
                      accountStatement.map((trans, index) => (
                        <tr key={index} className="border-t hover:bg-accent/5">
                          <td className="p-3 text-sm">{formatDate(trans.fecha)}</td>
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              {trans.type === 'invoice' && <DollarSign className="h-4 w-4 text-red-500" />}
                              {trans.type === 'credit' && trans.credito > 0 && <TrendingDown className="h-4 w-4 text-green-500" />}
                              {trans.type === 'credit' && trans.debito > 0 && <TrendingUp className="h-4 w-4 text-red-500" />}
                              {trans.type === 'payment' && <TrendingDown className="h-4 w-4 text-green-500" />}
                              <span>{trans.concepto}</span>
                            </div>
                            {trans.referencia && (
                              <p className="text-xs text-muted-foreground mt-1">Ref: {trans.referencia}</p>
                            )}
                          </td>
                          <td className="p-3 text-sm text-right text-red-600 font-medium">
                            {trans.debito > 0 ? formatCurrency(trans.debito) : '-'}
                          </td>
                          <td className="p-3 text-sm text-right text-green-600 font-medium">
                            {trans.credito > 0 ? formatCurrency(trans.credito) : '-'}
                          </td>
                          <td className={`p-3 text-sm text-right font-semibold ${trans.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(trans.saldo))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 print:hidden">
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={() => setShowStatementDialog(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
