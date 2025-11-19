import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIAnalytics, useUserPatterns, useClassificationPerformance } from '@/hooks/useAIAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, TrendingUp, Target, Zap, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function AIAnalyticsDashboard() {
  const { data: metrics, isLoading, error } = useAIAnalytics(30);
  const { data: patterns } = useUserPatterns();
  const { data: performance } = useClassificationPerformance();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar las métricas de IA. Por favor, intenta de nuevo.
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Sesiones Totales"
          value={metrics.total_sessions.toLocaleString()}
          icon={Users}
          variant="info"
        />
        <StatsCard
          title="Tasa de Éxito"
          value={`${(metrics.success_rate * 100).toFixed(1)}%`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          title="Confianza Promedio"
          value={`${(metrics.avg_confidence * 100).toFixed(1)}%`}
          icon={Target}
          variant="default"
        />
        <StatsCard
          title="Tiempo de Respuesta"
          value={`${metrics.avg_response_time.toFixed(0)}ms`}
          icon={Zap}
          variant="warning"
        />
      </div>

      <Tabs defaultValue="intents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="intents">Intenciones</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="patterns">Patrones</TabsTrigger>
        </TabsList>

        <TabsContent value="intents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Intenciones</CardTitle>
              <CardDescription>
                Análisis de las intenciones detectadas en los últimos 30 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.intent_distribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="intent" className="text-xs" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Cantidad" fill="hsl(var(--primary))" />
                  <Bar dataKey="success_rate" name="Tasa de Éxito" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Confianza por Intención</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.intent_distribution}
                    dataKey="avg_confidence"
                    nameKey="intent"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {metrics.intent_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Agente</CardTitle>
              <CardDescription>
                Comparación del rendimiento de los diferentes agentes especializados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.agent_performance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="agent_name" className="text-xs" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Ejecuciones" fill="hsl(var(--primary))" />
                  <Bar dataKey="avg_confidence" name="Confianza Promedio" fill="hsl(var(--accent))" />
                  <Bar dataKey="success_rate" name="Tasa de Éxito" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia Diaria</CardTitle>
              <CardDescription>
                Evolución del uso del asistente IA en los últimos 30 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.daily_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    name="Sesiones"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="success_rate"
                    name="Tasa de Éxito"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patrones de Usuario Detectados</CardTitle>
              <CardDescription>
                Comportamientos y patrones de uso identificados automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patterns && patterns.length > 0 ? (
                <div className="space-y-4">
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="flex items-start gap-4 p-4 border border-border rounded-lg"
                    >
                      <Brain className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{pattern.pattern_type}</h4>
                          <span className="text-xs text-muted-foreground">
                            Frecuencia: {(pattern.frequency * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Detectado {pattern.occurrences} veces
                        </p>
                        {pattern.accepted !== null && (
                          <div className="mt-2">
                            {pattern.accepted ? (
                              <span className="text-xs text-success flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Aceptado por el usuario
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Rechazado por el usuario
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No se han detectado patrones aún. Continúa usando el asistente IA para que
                  podamos aprender de tus preferencias.
                </p>
              )}
            </CardContent>
          </Card>

          {performance && Array.isArray(performance) && performance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Clasificación</CardTitle>
                <CardDescription>
                  Análisis del rendimiento de clasificación de intenciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance.map((item, index) => (
                    <div key={index} className="border-b border-border pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{item.intent}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.total_attempts} intentos
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Confianza</p>
                          <p className="font-medium">
                            {(item.avg_confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Éxito</p>
                          <p className="font-medium">
                            {(item.success_rate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tiempo</p>
                          <p className="font-medium">{item.avg_response_time_ms.toFixed(0)}ms</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
