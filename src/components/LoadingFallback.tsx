import { Loader2 } from "lucide-react";

export const LoadingFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Cargando módulo...</p>
      </div>
    </div>
  );
};

export const PageLoadingFallback = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
};
