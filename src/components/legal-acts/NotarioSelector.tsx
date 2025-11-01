import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Scale, Search, UserPlus, CheckCircle2, Building2 } from "lucide-react";
import { useNotariosView } from "@/hooks/useNotariosView";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface NotarioSelectorProps {
  label?: string;
  fieldPrefix?: string;
  value: string | null;
  onChange: (notarioId: string | null) => void;
  onFieldUpdate: (fields: Record<string, any>) => void;
  required?: boolean;
}

export function NotarioSelector({ 
  label = "Notario Público",
  fieldPrefix = "notario", 
  value, 
  onChange, 
  onFieldUpdate,
  required = false
}: NotarioSelectorProps) {
  const { data: notarios = [], isLoading } = useNotariosView();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);

  const handleSelection = (notarioId: string) => {
    if (notarioId === "manual") {
      // Limpiar campos para entrada manual
      onChange(null);
      setIsAutofilled(false);
      onFieldUpdate({
        [`${fieldPrefix}_id`]: null,
        [`${fieldPrefix}_nombre`]: "",
        [`${fieldPrefix}_exequatur`]: "",
        [`${fieldPrefix}_telefono`]: "",
        [`${fieldPrefix}_email`]: "",
        [`${fieldPrefix}_oficina`]: "",
        [`${fieldPrefix}_provincia_id`]: null,
        [`${fieldPrefix}_municipio_id`]: null,
        [`${fieldPrefix}_jurisdiccion`]: "",
        [`${fieldPrefix}_cedula`]: "",
      });
      return;
    }

    const notarioData = notarios.find(n => n.id === notarioId);
    if (notarioData) {
      onChange(notarioId);
      setIsAutofilled(true);
      onFieldUpdate({
        [`${fieldPrefix}_id`]: notarioData.id,
        [`${fieldPrefix}_nombre`]: notarioData.nombre || "",
        [`${fieldPrefix}_exequatur`]: notarioData.exequatur || "",
        [`${fieldPrefix}_telefono`]: notarioData.telefono || "",
        [`${fieldPrefix}_email`]: notarioData.email || "",
        [`${fieldPrefix}_oficina`]: notarioData.oficina || "",
        [`${fieldPrefix}_provincia_id`]: notarioData.provincia_id || null,
        [`${fieldPrefix}_municipio_id`]: notarioData.municipio_id || null,
        [`${fieldPrefix}_jurisdiccion`]: notarioData.jurisdiccion || "",
        [`${fieldPrefix}_cedula`]: notarioData.cedula_mask || "",
      });
      
      toast({
        title: "✓ Notario cargado",
        description: `Datos de ${notarioData.nombre} autocompletados exitosamente`,
      });
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const query = searchQuery.toLowerCase();
      const notarioData = notarios.find(n => 
        n.nombre.toLowerCase().includes(query) || 
        n.exequatur?.toLowerCase().includes(query) ||
        n.email?.toLowerCase().includes(query)
      );

      if (notarioData) {
        onChange(notarioData.id);
        setIsAutofilled(true);
        onFieldUpdate({
          [`${fieldPrefix}_id`]: notarioData.id,
          [`${fieldPrefix}_nombre`]: notarioData.nombre || "",
          [`${fieldPrefix}_exequatur`]: notarioData.exequatur || "",
          [`${fieldPrefix}_telefono`]: notarioData.telefono || "",
          [`${fieldPrefix}_email`]: notarioData.email || "",
          [`${fieldPrefix}_oficina`]: notarioData.oficina || "",
          [`${fieldPrefix}_provincia_id`]: notarioData.provincia_id || null,
          [`${fieldPrefix}_municipio_id`]: notarioData.municipio_id || null,
          [`${fieldPrefix}_jurisdiccion`]: notarioData.jurisdiccion || "",
          [`${fieldPrefix}_cedula`]: notarioData.cedula_mask || "",
        });
        
        toast({
          title: "✓ Notario encontrado",
          description: `Datos de ${notarioData.nombre} autocompletados exitosamente`,
        });
        setSearchQuery("");
      } else {
        toast({
          title: "⚠️ Notario no encontrado",
          description: "No existe un notario con ese criterio de búsqueda.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error en búsqueda",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando notarios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Scale className="h-5 w-5 text-primary" />
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {isAutofilled && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Autocompletado
          </Badge>
        )}
      </div>
      
      {/* Búsqueda rápida */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nombre o exequátur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch} 
          disabled={searching || !searchQuery.trim()}
          size="sm"
          variant="secondary"
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Selector de notario existente */}
      <Select value={value || ""} onValueChange={handleSelection}>
        <SelectTrigger>
          <SelectValue placeholder="O selecciona un notario..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manual">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Ingresar datos manualmente</span>
            </div>
          </SelectItem>
          {notarios.map((notario) => (
            <SelectItem key={notario.id} value={notario.id}>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{notario.nombre}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {notario.exequatur && (
                    <span>Exequátur: {notario.exequatur}</span>
                  )}
                  {notario.municipio_nombre && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {notario.municipio_nombre}, {notario.provincia_nombre}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {!value && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          💡 <span>Selecciona un notario para autocompletar sus datos y jurisdicción</span>
        </p>
      )}
      
      {notarios.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1 p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
          ⚠️ <span>No hay notarios registrados. Debes agregar notarios desde el módulo de Profesionales.</span>
        </p>
      )}
    </div>
  );
}
