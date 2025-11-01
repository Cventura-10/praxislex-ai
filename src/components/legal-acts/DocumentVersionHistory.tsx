import { FileText, Download, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useDocumentVersions } from "@/hooks/useDocumentVersions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface DocumentVersionHistoryProps {
  actId: string;
}

export const DocumentVersionHistory = ({ actId }: DocumentVersionHistoryProps) => {
  const { versions, isLoading, downloadVersion, deleteVersion } = useDocumentVersions(actId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando versiones...</p>
        </CardContent>
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Documentos</CardTitle>
          <CardDescription>
            No hay versiones generadas de este documento aún
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de Documentos
        </CardTitle>
        <CardDescription>
          {versions.length} versión{versions.length !== 1 ? "es" : ""} disponible{versions.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{version.file_name}</p>
                    {index === 0 && (
                      <Badge variant="default">Última</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Versión {version.version_number}</span>
                    <span>•</span>
                    <span>{formatFileSize(version.file_size)}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(version.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadVersion(version)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar versión?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente la versión {version.version_number} del
                        documento. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteVersion(version.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
