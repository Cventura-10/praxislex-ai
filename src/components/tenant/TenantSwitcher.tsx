import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function TenantSwitcher() {
  const { tenant, isLoading, isPro, isEnterprise, isFree } = useTenant();

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  if (!tenant) {
    return null;
  }

  const getPlanBadge = () => {
    if (isEnterprise) return <Badge variant="default">Enterprise</Badge>;
    if (isPro) return <Badge variant="secondary">Pro</Badge>;
    return <Badge variant="outline">Free</Badge>;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate max-w-[150px]">{tenant.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{tenant.name}</h4>
              <p className="text-xs text-muted-foreground">@{tenant.slug}</p>
            </div>
            {getPlanBadge()}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usuarios máx:</span>
              <span className="font-medium">{tenant.max_users}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Documentos/mes:</span>
              <span className="font-medium">{tenant.max_documents_per_month}</span>
            </div>
          </div>

          {isFree && (
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <p className="text-xs font-medium">Plan Gratis</p>
              <p className="text-xs text-muted-foreground">
                Actualiza a Pro para desbloquear más usuarios y documentos.
              </p>
              <Button variant="default" size="sm" className="w-full">
                Actualizar Plan
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
