import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { KPICard } from "@/components/analytics/KPICard";
import { ReportExporter } from "@/components/analytics/ReportExporter";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase, 
  Users,
  FileText,
  Calendar,
  Download
} from "lucide-react";
import { formatCurrency } from "@/lib/accountingHelpers";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--success))'];

export default function Analytics() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const { data, loading, error } = useAnalytics(period);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Error cargando analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics y Reportes</h1>
          <p className="text-muted-foreground mt-1">
            Análisis detallado del desempeño de tu despacho
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <ReportExporter 
            data={data || {}} 
            filename={`praxislex-analytics-${period}`}
            title="Analytics Report"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ingresos Totales"
          value={formatCurrency(data?.financial.totalRevenue || 0)}
          icon={DollarSign}
          subtitle="Ingresos del período"
        />
        <KPICard
          title="Gastos Totales"
          value={formatCurrency(data?.financial.totalExpenses || 0)}
          icon={TrendingDown}
          subtitle="Gastos del período"
        />
        <KPICard
          title="Utilidad Neta"
          value={formatCurrency(data?.financial.netProfit || 0)}
          icon={TrendingUp}
          subtitle={`Margen: ${data?.financial.profitMargin || 0}%`}
        />
        <KPICard
          title="Casos Activos"
          value={data?.cases.active || 0}
          icon={Briefcase}
          subtitle={`${data?.cases.successRate.toFixed(0) || 0}% éxito`}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financiero</TabsTrigger>
          <TabsTrigger value="cases">Casos</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="productivity">Productividad</TabsTrigger>
        </TabsList>

        {/* Financial Analytics */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue vs Expenses Trend */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Ingresos vs Gastos</CardTitle>
                <CardDescription>Tendencia histórica mensual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart 
                    data={
                      data?.trends.revenue.map((rev, idx) => ({
                        month: rev.month,
                        ingresos: rev.value,
                        gastos: data?.trends.expenses[idx]?.value || 0
                      })) || []
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2}
                      name="Ingresos"
                      dot={{ fill: 'hsl(var(--success))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gastos" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={2}
                      name="Gastos"
                      dot={{ fill: 'hsl(var(--warning))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cuentas por Cobrar Aging */}
            <Card>
              <CardHeader>
                <CardTitle>Cuentas por Cobrar (Aging)</CardTitle>
                <CardDescription>Distribución de facturas pendientes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                      data={[
                      { category: 'Corriente', amount: data?.financial.arAging.current || 0 },
                      { category: '1-30 días', amount: data?.financial.arAging.overdue30 || 0 },
                      { category: '31-60 días', amount: data?.financial.arAging.overdue60 || 0 },
                      { category: '+60 días', amount: data?.financial.arAging.overdue90 || 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="category" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Flujo de Caja Acumulado */}
            <Card>
              <CardHeader>
                <CardTitle>Flujo de Caja Acumulado</CardTitle>
                <CardDescription>Proyección mensual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data?.trends.revenue || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      name="Acumulado"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cases Analytics */}
        <TabsContent value="cases" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cases by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Casos por Estado</CardTitle>
                <CardDescription>Distribución actual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { status: 'Activos', count: data?.cases.active || 0 },
                        { status: 'Cerrados', count: data?.cases.closed || 0 },
                      ]}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.status}: ${entry.count}`}
                    >
                      {[0, 1].map((index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cases by Matter */}
            <Card>
              <CardHeader>
                <CardTitle>Casos por Materia</CardTitle>
                <CardDescription>Top 5 materias más frecuentes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      dataKey="materia" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Case Performance Metrics */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Métricas de Desempeño</CardTitle>
                <CardDescription>Rendimiento general de casos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                    <p className="text-3xl font-bold text-success">{data?.cases.successRate.toFixed(0) || 0}%</p>
                    <p className="text-xs text-muted-foreground">Casos ganados/cerrados</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Duración Promedio</p>
                    <p className="text-3xl font-bold">{data?.cases.averageDuration.toFixed(0) || 0}</p>
                    <p className="text-xs text-muted-foreground">días por caso</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Casos en Pipeline</p>
                    <p className="text-3xl font-bold text-info">{data?.cases.active || 0}</p>
                    <p className="text-xs text-muted-foreground">casos activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Analytics */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Clients by Revenue */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Clientes por Ingresos</CardTitle>
                <CardDescription>Clientes más rentables del período</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Client Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Clientes</CardTitle>
                <CardDescription>Resumen del período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Clientes</span>
                    <span className="text-2xl font-bold">100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nuevos Clientes</span>
                    <span className="text-2xl font-bold text-success">+10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Clientes Activos</span>
                    <span className="text-2xl font-bold text-info">85</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ingreso Promedio</span>
                    <span className="text-2xl font-bold">{formatCurrency(5000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Retention */}
            <Card>
              <CardHeader>
                <CardTitle>Retención de Clientes</CardTitle>
                <CardDescription>Métricas de fidelización</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasa de Retención</span>
                      <span className="font-medium">90%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success transition-all"
                        style={{ width: '90%' }}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Distribución de Actividad</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Muy Activos</span>
                        <span className="font-medium">45</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Activos</span>
                        <span className="font-medium">30</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Poco Activos</span>
                        <span className="font-medium">10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Productivity Analytics */}
        <TabsContent value="productivity" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Document Generation Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Generación de Documentos</CardTitle>
                <CardDescription>Productividad en redacción</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Documentos Generados</span>
                    <span className="text-2xl font-bold">125</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uso de IA</span>
                    <span className="text-2xl font-bold text-primary">85</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tiempo Promedio</span>
                    <span className="text-2xl font-bold">12min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hearing Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Audiencias</CardTitle>
                <CardDescription>Asistencia y desempeño</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Programadas</span>
                    <span className="text-2xl font-bold">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completadas</span>
                    <span className="text-2xl font-bold text-success">42</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasa de Asistencia</span>
                      <span className="font-medium">93%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: '93%' }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workload Distribution */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Distribución de Carga de Trabajo</CardTitle>
                <CardDescription>Casos por responsable</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="responsable" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="activeCases" fill="hsl(var(--primary))" name="Activos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="closedCases" fill="hsl(var(--success))" name="Cerrados" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
