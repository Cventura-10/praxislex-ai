import { useEffect } from "react";
import { Control, useWatch, UseFormSetValue } from "react-hook-form";
import { Combobox } from "@/components/ui/combobox";
import { useProvincias, useMunicipios, useSectores } from "@/hooks/useGeografia";
import { Loader2 } from "lucide-react";

interface LocationSelectProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  nameProvincia: string;
  nameMunicipio: string;
  nameSector: string;
  disabled?: boolean;
}

export function LocationSelect({
  control,
  setValue,
  nameProvincia,
  nameMunicipio,
  nameSector,
  disabled = false,
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Provincia *</label>
        <Combobox
          options={provincias.map(p => ({ value: String(p.id), label: p.nombre }))}
          value={provinciaId ? String(provinciaId) : ""}
          onValueChange={(value) => {
            setValue(nameProvincia, value ? Number(value) : null);
          }}
          placeholder="Seleccionar provincia..."
          searchPlaceholder="Buscar provincia..."
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Municipio *</label>
        {loadingMunicipios ? (
          <div className="flex items-center p-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Cargando municipios...
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
            disabled={!provinciaId || disabled}
          />
        )}
        {!provinciaId && (
          <p className="text-xs text-muted-foreground">Debe seleccionar una provincia primero</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Sector/Ciudad</label>
        {loadingSectores ? (
          <div className="flex items-center p-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Cargando sectores...
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
            disabled={!municipioId || disabled}
          />
        )}
        {!municipioId && (
          <p className="text-xs text-muted-foreground">Debe seleccionar un municipio primero</p>
        )}
      </div>
    </div>
  );
}
