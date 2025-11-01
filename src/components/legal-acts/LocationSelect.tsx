import { useEffect } from "react";
import { Control, useWatch, UseFormSetValue } from "react-hook-form";
import { Combobox } from "@/components/ui/combobox";
import { useProvincias, useMunicipios, useSectores } from "@/hooks/useGeografia";
import { Loader2, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";

interface LocationSelectProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  nameProvincia: string;
  nameMunicipio: string;
  nameSector: string;
  disabled?: boolean;
  required?: boolean;
  labels?: {
    provincia?: string;
    municipio?: string;
    sector?: string;
  };
}

export function LocationSelect({
  control,
  setValue,
  nameProvincia,
  nameMunicipio,
  nameSector,
  disabled = false,
  required = false,
  labels = {},
}: LocationSelectProps) {
  const provinciaId = useWatch({ control, name: nameProvincia });
  const municipioId = useWatch({ control, name: nameMunicipio });

  const { data: provincias = [], isLoading: loadingProvincias } = useProvincias();
  const { data: municipios = [], isLoading: loadingMunicipios } = useMunicipios(provinciaId);
  const { data: sectores = [], isLoading: loadingSectores } = useSectores(municipioId);

  // Reset municipio y sector cuando cambia provincia
  useEffect(() => {
    setValue(nameMunicipio, null);
    setValue(nameSector, null);
  }, [provinciaId, nameMunicipio, nameSector, setValue]);

  // Reset sector cuando cambia municipio
  useEffect(() => {
    setValue(nameSector, null);
  }, [municipioId, nameSector, setValue]);

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
          <Label htmlFor={nameProvincia}>
            {labels.provincia || "Provincia"}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Combobox
            options={provincias.map(p => ({ value: String(p.id), label: p.nombre }))}
            value={provinciaId ? String(provinciaId) : ""}
            onValueChange={(value) => {
              setValue(nameProvincia, value ? Number(value) : null);
            }}
            placeholder="Seleccionar provincia..."
            searchPlaceholder="Buscar provincia..."
            emptyMessage="No se encontró la provincia"
            disabled={disabled}
          />
        </div>

        {/* Municipio */}
        <div className="space-y-2">
          <Label htmlFor={nameMunicipio}>
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
              value={municipioId ? String(municipioId) : ""}
              onValueChange={(value) => {
                setValue(nameMunicipio, value ? Number(value) : null);
              }}
              placeholder={provinciaId ? "Seleccionar municipio..." : "Primero seleccione provincia"}
              searchPlaceholder="Buscar municipio..."
              emptyMessage="No se encontró el municipio"
              disabled={!provinciaId || disabled}
            />
          )}
          {!provinciaId && (
            <p className="text-xs text-muted-foreground">⚠️ Debe seleccionar una provincia primero</p>
          )}
        </div>

        {/* Sector */}
        <div className="space-y-2">
          <Label htmlFor={nameSector}>
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
              value={useWatch({ control, name: nameSector }) ? String(useWatch({ control, name: nameSector })) : ""}
              onValueChange={(value) => {
                setValue(nameSector, value ? Number(value) : null);
              }}
              placeholder={municipioId ? "Seleccionar sector..." : "Primero seleccione municipio"}
              searchPlaceholder="Buscar sector..."
              emptyMessage="No se encontró el sector"
              disabled={!municipioId || disabled}
            />
          )}
          {!municipioId && provincias.length > 0 && (
            <p className="text-xs text-muted-foreground">⚠️ Debe seleccionar un municipio primero</p>
          )}
        </div>
      </div>
    </div>
  );
}
