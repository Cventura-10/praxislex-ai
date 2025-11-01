import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, User, Search, UserPlus, CheckCircle2 } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { hydrateClient } from "@/lib/formHydrate";

interface ClientSelectorProps {
  label: string;
  fieldPrefix: string; // ej: "demandante", "primera_parte", "vendedor"
  value: string | null;
  onChange: (clientId: string | null) => void;
  onFieldUpdate?: (fields: Record<string, any>) => void; // Legacy - opcional
  form?: UseFormReturn<any>; // Nuevo: pasar form directamente
  required?: boolean;
}

export function ClientSelector({ 
  label, 
  fieldPrefix, 
  value, 
  onChange, 
  onFieldUpdate,
  form,
  required = false
}: ClientSelectorProps) {
  const { clients, loading, getClientById, searchClientByCedula } = useClients();
  const { toast } = useToast();
  const [searchCedula, setSearchCedula] = useState("");
  const [searching, setSearching] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);

  const handleSelection = async (clientId: string) => {
    if (clientId === "manual") {
      onChange(null);
      setIsAutofilled(false);
      
      // Limpiar solo si hay callback legacy
      if (onFieldUpdate) {
        onFieldUpdate({
          [`${fieldPrefix}_nombre`]: "",
          [`${fieldPrefix}_cedula`]: "",
          [`${fieldPrefix}_direccion`]: "",
          [`${fieldPrefix}_nacionalidad`]: "",
          [`${fieldPrefix}_estado_civil`]: "",
          [`${fieldPrefix}_profesion`]: "",
          [`${fieldPrefix}_provincia_id`]: null,
          [`${fieldPrefix}_municipio_id`]: null,
          [`${fieldPrefix}_sector_id`]: null,
          [`${fieldPrefix}_email`]: "",
          [`${fieldPrefix}_telefono`]: "",
        });
      }
      return;
    }

    const clientData = await getClientById(clientId);
    if (clientData) {
      onChange(clientId);
      setIsAutofilled(true);
      
      // Usar helper centralizado si hay form
      if (form) {
        hydrateClient(form, fieldPrefix, {
          id: clientData.id,
          nombre_completo: clientData.nombre_completo,
          cedula_rnc: clientData.cedula_rnc,
          nacionalidad: clientData.nacionalidad,
          estado_civil: clientData.estado_civil,
          profesion: clientData.profesion,
          ocupacion: clientData.ocupacion,
          provincia_id: clientData.provincia_id ? Number(clientData.provincia_id) : null,
          municipio_id: clientData.municipio_id ? Number(clientData.municipio_id) : null,
          sector_id: clientData.sector_id ? Number(clientData.sector_id) : null,
          direccion: clientData.direccion,
          ciudad: clientData.lugar_nacimiento,
          email: clientData.email,
          telefono: clientData.telefono,
          tipo_persona: (clientData as any).tipo_persona || 'fisica',
          razon_social: (clientData as any).razon_social,
          representante_legal: (clientData as any).representante_legal,
          cargo_representante: (clientData as any).cargo_representante,
          matricula_card: clientData.matricula_card,
          matricula_profesional: clientData.matricula_profesional,
        });
      } else if (onFieldUpdate) {
        // Fallback legacy
        onFieldUpdate({
          [`${fieldPrefix}_nombre`]: clientData.nombre_completo,
          [`${fieldPrefix}_cedula`]: clientData.cedula_rnc,
          [`${fieldPrefix}_direccion`]: clientData.direccion || "",
          [`${fieldPrefix}_nacionalidad`]: clientData.nacionalidad || "",
          [`${fieldPrefix}_estado_civil`]: clientData.estado_civil || "",
          [`${fieldPrefix}_profesion`]: clientData.profesion || "",
          [`${fieldPrefix}_provincia_id`]: clientData.provincia_id ? Number(clientData.provincia_id) : null,
          [`${fieldPrefix}_municipio_id`]: clientData.municipio_id ? Number(clientData.municipio_id) : null,
          [`${fieldPrefix}_sector_id`]: clientData.sector_id ? Number(clientData.sector_id) : null,
          [`${fieldPrefix}_email`]: clientData.email || "",
          [`${fieldPrefix}_telefono`]: clientData.telefono || "",
        });
      }
      
      toast({
        title: "✓ Cliente cargado",
        description: `Datos de ${clientData.nombre_completo} autocompletados exitosamente`,
      });
    }
  };

  const handleSearchByCedula = async () => {
    if (!searchCedula.trim()) return;
    
    setSearching(true);
    try {
      const clientData = await searchClientByCedula(searchCedula);
      if (clientData) {
        onChange(clientData.id);
        setIsAutofilled(true);
        
        // Usar helper centralizado
        if (form) {
          hydrateClient(form, fieldPrefix, {
            id: clientData.id,
            nombre_completo: clientData.nombre_completo,
            cedula_rnc: clientData.cedula_rnc,
            nacionalidad: clientData.nacionalidad,
            estado_civil: clientData.estado_civil,
            profesion: clientData.profesion,
            ocupacion: clientData.ocupacion,
            provincia_id: clientData.provincia_id ? Number(clientData.provincia_id) : null,
            municipio_id: clientData.municipio_id ? Number(clientData.municipio_id) : null,
            sector_id: clientData.sector_id ? Number(clientData.sector_id) : null,
            direccion: clientData.direccion,
            ciudad: clientData.lugar_nacimiento,
            email: clientData.email,
            telefono: clientData.telefono,
            tipo_persona: (clientData as any).tipo_persona || 'fisica',
            razon_social: (clientData as any).razon_social,
            representante_legal: (clientData as any).representante_legal,
            cargo_representante: (clientData as any).cargo_representante,
            matricula_card: clientData.matricula_card,
            matricula_profesional: clientData.matricula_profesional,
          });
        } else if (onFieldUpdate) {
          // Fallback legacy
          onFieldUpdate({
            [`${fieldPrefix}_nombre`]: clientData.nombre_completo,
            [`${fieldPrefix}_cedula`]: clientData.cedula_rnc,
            [`${fieldPrefix}_direccion`]: clientData.direccion || "",
            [`${fieldPrefix}_nacionalidad`]: clientData.nacionalidad || "",
            [`${fieldPrefix}_estado_civil`]: clientData.estado_civil || "",
            [`${fieldPrefix}_profesion`]: clientData.profesion || "",
            [`${fieldPrefix}_provincia_id`]: clientData.provincia_id ? Number(clientData.provincia_id) : null,
            [`${fieldPrefix}_municipio_id`]: clientData.municipio_id ? Number(clientData.municipio_id) : null,
            [`${fieldPrefix}_sector_id`]: clientData.sector_id ? Number(clientData.sector_id) : null,
            [`${fieldPrefix}_email`]: clientData.email || "",
            [`${fieldPrefix}_telefono`]: clientData.telefono || "",
          });
        }
        
        toast({
          title: "✓ Cliente encontrado",
          description: `Datos de ${clientData.nombre_completo} autocompletados exitosamente`,
        });
        setSearchCedula("");
      } else {
        toast({
          title: "⚠️ Cliente no encontrado",
          description: "No existe un cliente con esa cédula. Puedes ingresarlo manualmente.",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <User className="h-5 w-5 text-primary" />
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
      
      {/* Búsqueda rápida por cédula */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por cédula..."
          value={searchCedula}
          onChange={(e) => setSearchCedula(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchByCedula()}
          className="flex-1"
        />
        <Button 
          onClick={handleSearchByCedula} 
          disabled={searching || !searchCedula.trim()}
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

      {/* Selector de cliente existente */}
      <Select value={value || ""} onValueChange={handleSelection}>
        <SelectTrigger>
          <SelectValue placeholder="O selecciona un cliente..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manual">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Ingresar datos manualmente</span>
            </div>
          </SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex flex-col">
                <span className="font-medium">{client.nombre_completo}</span>
                {client.cedula_rnc_masked && (
                  <span className="text-xs text-muted-foreground">
                    Cédula: {client.cedula_rnc_masked}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {!value && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          💡 <span>Selecciona un cliente existente para autocompletar todos sus datos automáticamente</span>
        </p>
      )}
    </div>
  );
}
