import { useEffect } from "react";
import { Combobox } from "@/components/ui/combobox";
import { useProvincias, useMunicipios, useSectores } from "@/hooks/useGeografia";
import { Loader2, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";

interface SimpleLocationSelectProps {
  valueProvincia: number | null;
  valueMunicipio: number | null;
  valueSector: number | null;
  onChangeProvincia: (v: number | null) => void;
  onChangeMunicipio: (v: number | null) => void;
  onChangeSector: (v: number | null) => void;
  disabled?: boolean;
  required?: boolean;
  labels?: {
    provincia?: string;
    municipio?: string;
    sector?: string;
  };
}

export function SimpleLocationSelect({
  valueProvincia,
  valueMunicipio,
  valueSector,
  onChangeProvincia,
  onChangeMunicipio,
  onChangeSector,
  disabled = false,
  required = false,
  labels = {},
}: SimpleLocationSelectProps) {
  const { data: provincias = [], isLoading: loadingProvincias } = useProvincias();
  const { data: municipios = [], isLoading: loadingMunicipios } = useMunicipios(valueProvincia || null);
  const { data: sectores = [], isLoading: loadingSectores } = useSectores(valueMunicipio || null);

  useEffect(() => {
    // Reset cascada al cambiar provincia
    onChangeMunicipio(null);
    onChangeSector(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueProvincia]);

  useEffect(() => {
    // Reset sector al cambiar municipio
    onChangeSector(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMunicipio]);

  if (loadingProvincias) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando geografía...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Ubicación Geográfica</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Provincia */}
        <div className="space-y-2">
          <Label>
            {labels.provincia || "Provincia"}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Combobox
            options={provincias.map(p => ({ value: String(p.id), label: p.nombre }))}
            value={valueProvincia ? String(valueProvincia) : ""}
            onValueChange={(value) => onChangeProvincia(value ? Number(value) : null)}
            placeholder="Seleccionar provincia..."
            searchPlaceholder="Buscar provincia..."
            emptyMessage="No se encontró la provincia"
            disabled={disabled}
          />
        </div>

        {/* Municipio */}
        <div className="space-y-2">
          <Label>
            {labels.municipio || "Municipio"}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {loadingMunicipios ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando municipios...</span>
            </div>
          ) : (
            <Combobox
              options={municipios.map(m => ({ value: String(m.id), label: m.nombre }))}
              value={valueMunicipio ? String(valueMunicipio) : ""}
              onValueChange={(value) => onChangeMunicipio(value ? Number(value) : null)}
              placeholder={valueProvincia ? "Seleccionar municipio..." : "Primero seleccione provincia"}
              searchPlaceholder="Buscar municipio..."
              emptyMessage="No se encontró el municipio"
              disabled={!valueProvincia || disabled}
            />
          )}
          {!valueProvincia && (
            <p className="text-xs text-muted-foreground">⚠️ Debe seleccionar una provincia primero</p>
          )}
        </div>

        {/* Sector */}
        <div className="space-y-2">
          <Label>
            {labels.sector || "Sector / Barrio"}
          </Label>
          {loadingSectores ? (
            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando sectores...</span>
            </div>
          ) : (
            <Combobox
              options={sectores.map(s => ({ value: String(s.id), label: s.nombre }))}
              value={valueSector ? String(valueSector) : ""}
              onValueChange={(value) => onChangeSector(value ? Number(value) : null)}
              placeholder={valueMunicipio ? "Seleccionar sector..." : "Primero seleccione municipio"}
              searchPlaceholder="Buscar sector..."
              emptyMessage="No se encontró el sector"
              disabled={!valueMunicipio || disabled}
            />
          )}
          {!valueMunicipio && provincias.length > 0 && (
            <p className="text-xs text-muted-foreground">⚠️ Debe seleccionar un municipio primero</p>
          )}
        </div>
      </div>
    </div>
  );
}
