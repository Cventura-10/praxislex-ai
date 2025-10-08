import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIAS_GASTOS } from "@/lib/constants";
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Building2,
  Receipt,
  FileText,
  Percent,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";

export default function FirmAccounting() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [firmSummary, setFirmSummary] = useState<any>(null);
  const [generalIncomes, setGeneralIncomes] = useState<any[]>([]);
  const [officeExpenses, setOfficeExpenses] = useState<any[]>([]);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);

  const [newIncome, setNewIncome] = useState({
    concepto: "",
    monto: "",
    itbis: "",
    interes: "",
    incluir_itbis: false,
    incluir_interes: false,
    fecha: new Date().toISOString().split('T')[0],
    referencia: "",
    notas: "",
  });

  const [newExpense, setNewExpense] = useState({
    concepto: "",
    categoria: "oficina",
    monto: "",
    itbis: "",
    incluir_itbis: false,
    fecha: new Date().toISOString().split('T')[0],
    proveedor: "",
    metodo_pago: "",
    referencia: "",
    notas: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch firm accounting summary using secure function
      const { data: summaryData, error: summaryError } = await supabase.rpc('get_firm_accounting_summary', {
        p_user_id: user.id
      });

      if (summaryError) {
        console.error("Error fetching firm accounting summary:", summaryError);
      }

      // The RPC returns an array, get the first element
      const summary = summaryData && summaryData.length > 0 ? summaryData[0] : null;

      // Fetch general incomes (credits with tipo = 'ingreso_general')
      const { data: incomes } = await supabase
        .from("client_credits")
        .select("*")
        .eq("user_id", user.id)
        .eq("tipo", "ingreso_general")
        .is("client_id", null)
        .order("fecha", { ascending: false });

      // Fetch office expenses (expenses without client_id)
      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .is("client_id", null)
        .order("fecha", { ascending: false });

      setFirmSummary(summary);
      setGeneralIncomes(incomes || []);
      setOfficeExpenses(expenses || []);
    } catch (error) {
      console.error("Error fetching firm accounting data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de contabilidad",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Validate required fields
      if (!newIncome.concepto || newIncome.concepto.trim().length < 3) {
        toast({
          title: "Concepto inválido",
          description: "El concepto debe tener al menos 3 caracteres",
          variant: "destructive",
        });
        return;
      }

      const montoBase = parseFloat(newIncome.monto);
      if (isNaN(montoBase) || montoBase <= 0) {
        toast({
          title: "Monto inválido",
          description: "El monto debe ser mayor a 0",
          variant: "destructive",
        });
        return;
      }

      const itbis = newIncome.incluir_itbis ? parseFloat(newIncome.itbis || "0") : 0;
      const interes = newIncome.incluir_interes ? parseFloat(newIncome.interes || "0") : 0;
      const montoTotal = montoBase + itbis + interes;

      const { error } = await supabase.from("client_credits").insert([
        {
          tipo: "ingreso_general",
          concepto: newIncome.concepto,
          monto: montoTotal,
          interes: interes,
          fecha: newIncome.fecha,
          referencia: newIncome.referencia || null,
          notas: newIncome.notas || null,
          user_id: user.id,
          client_id: null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "✓ Ingreso registrado",
        description: "El ingreso general ha sido registrado exitosamente",
      });

      setShowIncomeDialog(false);
      setNewIncome({
        concepto: "",
        monto: "",
        itbis: "",
        interes: "",
        incluir_itbis: false,
        incluir_interes: false,
        fecha: new Date().toISOString().split('T')[0],
        referencia: "",
        notas: "",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el ingreso",
        variant: "destructive",
      });
    }
  };

  const handleCreateExpense = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Validate required fields
      if (!newExpense.concepto || newExpense.concepto.trim().length < 3) {
        toast({
          title: "Concepto inválido",
          description: "El concepto debe tener al menos 3 caracteres",
          variant: "destructive",
        });
        return;
      }

      if (!newExpense.categoria) {
        toast({
          title: "Categoría requerida",
          description: "Debe seleccionar una categoría",
          variant: "destructive",
        });
        return;
      }

      const montoBase = parseFloat(newExpense.monto);
      if (isNaN(montoBase) || montoBase <= 0) {
        toast({
          title: "Monto inválido",
          description: "El monto debe ser mayor a 0",
          variant: "destructive",
        });
        return;
      }

      const itbis = newExpense.incluir_itbis ? parseFloat(newExpense.itbis || "0") : 0;
      const montoTotal = montoBase + itbis;

      const { error } = await supabase.from("expenses").insert([
        {
          concepto: newExpense.concepto,
          categoria: newExpense.categoria,
          monto: montoTotal,
          itbis: itbis,
          fecha: newExpense.fecha,
          proveedor: newExpense.proveedor || null,
          metodo_pago: newExpense.metodo_pago || null,
          referencia: newExpense.referencia || null,
          notas: newExpense.notas || null,
          reembolsable: false,
          user_id: user.id,
          client_id: null,
          case_id: null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "✓ Gasto registrado",
        description: "El gasto de oficina ha sido registrado exitosamente",
      });

      setShowExpenseDialog(false);
      setNewExpense({
        concepto: "",
        categoria: "oficina",
        monto: "",
        itbis: "",
        incluir_itbis: false,
        fecha: new Date().toISOString().split('T')[0],
        proveedor: "",
        metodo_pago: "",
        referencia: "",
        notas: "",
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

  const totalGeneralIncomes = generalIncomes.reduce((sum, inc) => sum + (inc.monto || 0), 0);
  const totalOfficeExpenses = officeExpenses.reduce((sum, exp) => sum + (exp.monto || 0), 0);
  const netBalance = totalGeneralIncomes - totalOfficeExpenses;

  // Calculate totals for display
  const displayStats = {
    totalIngresos: totalGeneralIncomes.toFixed(2),
    totalGastos: totalOfficeExpenses.toFixed(2),
    balance: netBalance.toFixed(2),
    totalItbis: (firmSummary?.total_itbis_ingresos || 0).toFixed(2),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contabilidad')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contabilidad General</h1>
            <p className="text-muted-foreground mt-1">
              Ingresos y gastos generales de la firma completa
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Ingresos Generales"
          value={formatCurrency(totalGeneralIncomes)}
          icon={TrendingUp}
          trend={{ value: "0%", isPositive: true }}
        />
        <StatsCard
          title="Gastos de Oficina"
          value={formatCurrency(totalOfficeExpenses)}
          icon={TrendingDown}
          trend={{ value: "0%", isPositive: false }}
        />
        <StatsCard
          title="Balance Neto"
          value={formatCurrency(netBalance)}
          icon={DollarSign}
          trend={{ value: "0%", isPositive: netBalance >= 0 }}
        />
        <StatsCard
          title="ITBIS Total"
          value={formatCurrency(firmSummary?.total_itbis_ingresos || 0)}
          icon={Percent}
          trend={{ value: "0%", isPositive: true }}
        />
      </div>

      {/* Tabs for Incomes and Expenses */}
      <Tabs defaultValue="incomes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incomes" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Ingresos Generales
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <Building2 className="h-4 w-4" />
            Gastos de Oficina
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incomes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ingresos Generales de la Firma</CardTitle>
                <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nuevo Ingreso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Registrar Ingreso General</DialogTitle>
                      <DialogDescription>
                        Registrar un ingreso que no está asociado a un cliente específico
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Concepto *</Label>
                        <Input
                          value={newIncome.concepto}
                          onChange={(e) => setNewIncome({ ...newIncome, concepto: e.target.value })}
                          placeholder="Descripción del ingreso"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Monto Base *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newIncome.monto}
                          onChange={(e) => setNewIncome({ ...newIncome, monto: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="incluir_itbis_income"
                          checked={newIncome.incluir_itbis}
                          onCheckedChange={(checked) => 
                            setNewIncome({ ...newIncome, incluir_itbis: checked as boolean })
                          }
                        />
                        <Label htmlFor="incluir_itbis_income">Incluir ITBIS</Label>
                      </div>
                      {newIncome.incluir_itbis && (
                        <div className="grid gap-2">
                          <Label>ITBIS (18%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newIncome.itbis}
                            onChange={(e) => setNewIncome({ ...newIncome, itbis: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="incluir_interes_income"
                          checked={newIncome.incluir_interes}
                          onCheckedChange={(checked) => 
                            setNewIncome({ ...newIncome, incluir_interes: checked as boolean })
                          }
                        />
                        <Label htmlFor="incluir_interes_income">Incluir Intereses</Label>
                      </div>
                      {newIncome.incluir_interes && (
                        <div className="grid gap-2">
                          <Label>Intereses</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newIncome.interes}
                            onChange={(e) => setNewIncome({ ...newIncome, interes: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label>Fecha *</Label>
                        <Input
                          type="date"
                          value={newIncome.fecha}
                          onChange={(e) => setNewIncome({ ...newIncome, fecha: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Referencia</Label>
                        <Input
                          value={newIncome.referencia}
                          onChange={(e) => setNewIncome({ ...newIncome, referencia: e.target.value })}
                          placeholder="Número de referencia (opcional)"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Notas</Label>
                        <Textarea
                          value={newIncome.notas}
                          onChange={(e) => setNewIncome({ ...newIncome, notas: e.target.value })}
                          placeholder="Notas adicionales (opcional)"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowIncomeDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateIncome}>
                        Registrar Ingreso
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Intereses</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generalIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay ingresos generales registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    generalIncomes.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell>{formatDate(income.fecha)}</TableCell>
                        <TableCell>{income.concepto}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(income.monto)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {income.interes ? formatCurrency(income.interes) : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {income.referencia || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gastos de Oficina</CardTitle>
                <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nuevo Gasto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Registrar Gasto de Oficina</DialogTitle>
                      <DialogDescription>
                        Registrar un gasto general de la firma
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Categoría *</Label>
                        <Select 
                          value={newExpense.categoria} 
                          onValueChange={(value) => setNewExpense({ ...newExpense, categoria: value })}
                        >
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
                        <Label>Concepto *</Label>
                        <Input
                          value={newExpense.concepto}
                          onChange={(e) => setNewExpense({ ...newExpense, concepto: e.target.value })}
                          placeholder="Descripción del gasto"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Monto Base *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newExpense.monto}
                          onChange={(e) => setNewExpense({ ...newExpense, monto: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="incluir_itbis_expense"
                          checked={newExpense.incluir_itbis}
                          onCheckedChange={(checked) => 
                            setNewExpense({ ...newExpense, incluir_itbis: checked as boolean })
                          }
                        />
                        <Label htmlFor="incluir_itbis_expense">Incluir ITBIS</Label>
                      </div>
                      {newExpense.incluir_itbis && (
                        <div className="grid gap-2">
                          <Label>ITBIS (18%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newExpense.itbis}
                            onChange={(e) => setNewExpense({ ...newExpense, itbis: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label>Proveedor</Label>
                        <Input
                          value={newExpense.proveedor}
                          onChange={(e) => setNewExpense({ ...newExpense, proveedor: e.target.value })}
                          placeholder="Nombre del proveedor (opcional)"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Método de Pago</Label>
                        <Select 
                          value={newExpense.metodo_pago} 
                          onValueChange={(value) => setNewExpense({ ...newExpense, metodo_pago: value })}
                        >
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
                        <Label>Fecha *</Label>
                        <Input
                          type="date"
                          value={newExpense.fecha}
                          onChange={(e) => setNewExpense({ ...newExpense, fecha: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Referencia</Label>
                        <Input
                          value={newExpense.referencia}
                          onChange={(e) => setNewExpense({ ...newExpense, referencia: e.target.value })}
                          placeholder="Número de factura/recibo (opcional)"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Notas</Label>
                        <Textarea
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
                      <Button onClick={handleCreateExpense}>
                        Registrar Gasto
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">ITBIS</TableHead>
                    <TableHead>Proveedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {officeExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay gastos de oficina registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    officeExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.fecha)}</TableCell>
                        <TableCell className="capitalize">{expense.categoria}</TableCell>
                        <TableCell>{expense.concepto}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.monto)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {expense.itbis ? formatCurrency(expense.itbis) : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {expense.proveedor || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
