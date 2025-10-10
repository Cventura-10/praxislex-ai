import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CaseStatus = "demanda" | "contestacion" | "pruebas" | "sentencia" | "apelacion" | "archivado";

interface CaseStatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

const statusConfig: Record<CaseStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  demanda: { label: "Demanda", variant: "default" },
  contestacion: { label: "Contestación", variant: "secondary" },
  pruebas: { label: "Pruebas", variant: "outline" },
  sentencia: { label: "Sentencia", variant: "default" },
  apelacion: { label: "Apelación", variant: "secondary" },
  archivado: { label: "Archivado", variant: "destructive" },
};

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) {
    return (
      <Badge variant="secondary" className={cn("font-medium", className)}>
        {status || "Sin estado"}
      </Badge>
    );
  }
  
  return (
    <Badge variant={config.variant} className={cn("font-medium", className)}>
      {config.label}
    </Badge>
  );
}
