import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDocLearningRuns } from "@/hooks/useDocLearning";
import { useStyleProfiles, usePublishStyleProfile, useActiveStyleProfile } from "@/hooks/useStyleProfiles";
import { Rocket, CheckCircle2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PerfilPublicacionTab() {
  const { data: runs } = useDocLearningRuns();
  const { data: activeProfile } = useActiveStyleProfile();
  const publishMutation = usePublishStyleProfile();
  const navigate = useNavigate();
  const latestRun = runs?.find(r => r.status === 'completed');

  const handlePublish = async () => {
    if (!latestRun) return;
    await publishMutation.mutateAsync(latestRun.id);
  };

  if (!latestRun) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Perfil</CardTitle>
          <CardDescription>Ejecuta un análisis para crear un perfil de estilo</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil Compilado</CardTitle>
          <CardDescription>Resumen del perfil de estilo generado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestRun.summary && (
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium mb-2">Layout</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(latestRun.summary.typography, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={handlePublish} disabled={publishMutation.isPending}>
              <Rocket className="mr-2 h-4 w-4" />
              {publishMutation.isPending ? 'Publicando...' : 'Publicar Perfil'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/generacion-documentos')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Probar en Generación
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Perfil Activo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="default">Versión {activeProfile.version}</Badge>
              <span className="text-sm text-muted-foreground">
                Publicado: {new Date(activeProfile.published_at).toLocaleString('es-DO')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
