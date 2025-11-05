import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDocLearningRuns } from "@/hooks/useDocLearning";
import { Loader2, CheckCircle2, XCircle, FileText, BarChart3, AlertTriangle } from "lucide-react";

export function AnalisisTab() {
  const { data: runs, isLoading } = useDocLearningRuns();
  const latestRun = runs?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!latestRun) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Análisis</CardTitle>
          <CardDescription>
            Sube documentos en la pestaña "Cargar" y ejecuta el análisis para ver los resultados aquí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No hay análisis disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const metrics = latestRun.metrics || {};
  const summary = latestRun.summary || {};

  return (
    <div className="space-y-6">
      {/* Estado del Análisis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estado del Análisis</CardTitle>
              <CardDescription>
                Análisis iniciado hace {new Date(latestRun.started_at).toLocaleString('es-DO')}
              </CardDescription>
            </div>
            <Badge variant={latestRun.status === 'completed' ? 'default' : latestRun.status === 'failed' ? 'destructive' : 'secondary'}>
              <span className="flex items-center gap-2">
                {getStatusIcon(latestRun.status)}
                {latestRun.status === 'running' ? 'Analizando' : latestRun.status === 'completed' ? 'Completado' : 'Fallido'}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {latestRun.status === 'running' && (
            <div className="space-y-2">
              <Progress value={66} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">Procesando {latestRun.docs_count} documentos...</p>
            </div>
          )}

          {latestRun.status === 'failed' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {latestRun.error_message || 'Error desconocido durante el análisis'}
              </AlertDescription>
            </Alert>
          )}

          {latestRun.status === 'completed' && (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p className="font-medium">Análisis completado exitosamente</p>
              <p className="text-sm text-muted-foreground">
                {latestRun.docs_count} documentos procesados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {latestRun.status === 'completed' && (
        <>
          {/* Métricas Clave */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cobertura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.coverage?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Contenido utilizable</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cláusulas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.clauses_detected || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Detectadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.variables_detected || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Identificadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Confianza Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avg_confidence?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Precisión</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumen de Estilo */}
          <Card>
            <CardHeader>
              <CardTitle>Estilo Detectado</CardTitle>
              <CardDescription>Características principales de los documentos analizados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipografía */}
              {summary.typography && (
                <div>
                  <h4 className="font-medium mb-2">Tipografía</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fuente del cuerpo:</span>
                      <p className="font-medium">{summary.typography.body_font || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tamaño del cuerpo:</span>
                      <p className="font-medium">{summary.typography.body_size || 'N/A'} pt</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fuente títulos:</span>
                      <p className="font-medium">{summary.typography.title_font || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Interlineado:</span>
                      <p className="font-medium">{summary.typography.line_spacing || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estructura */}
              {summary.structure && (
                <div>
                  <h4 className="font-medium mb-2">Estructura</h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.structure.sections?.map((section: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{section}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Léxico */}
              {summary.lexicon && (
                <div>
                  <h4 className="font-medium mb-2">Léxico</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Formalidad:</span>
                      <p className="font-medium capitalize">{summary.lexicon.formality || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Persona:</span>
                      <p className="font-medium capitalize">{summary.lexicon.person || 'N/A'}</p>
                    </div>
                  </div>
                  {summary.lexicon.common_phrases && (
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">Frases comunes:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {summary.lexicon.common_phrases.map((phrase: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {phrase}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advertencias */}
          {metrics.warnings && metrics.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Advertencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.warnings.map((warning: string, idx: number) => (
                    <Alert key={idx}>
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
