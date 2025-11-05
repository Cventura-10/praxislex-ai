import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDocLearningRuns } from "@/hooks/useDocLearning";
import { useStyleProfiles } from "@/hooks/useStyleProfiles";
import { History, CheckCircle2 } from "lucide-react";

export function HistorialTab() {
  const { data: runs } = useDocLearningRuns();
  const { data: profiles } = useStyleProfiles();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {runs?.map((run) => (
              <div key={run.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Análisis {run.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(run.started_at).toLocaleString('es-DO')}
                    </p>
                  </div>
                  <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>
                    {run.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Perfiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profiles?.map((profile) => (
              <div key={profile.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Versión {profile.version}</p>
                    {profile.active && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.published_at).toLocaleString('es-DO')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
