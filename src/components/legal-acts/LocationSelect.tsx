import { useMemo } from "react";
import { Control, useWatch } from "react-hook-form";
import { Combobox } from "@/components/ui/combobox";
import bundleData from "@/data/praxislex_bundle_v1_3_2.json";

interface LocationSelectProps {
  control: Control<any>;
  nameProvincia: string;
  nameMunicipio: string;
  nameSector: string;
  disabled?: boolean;
  onProvinciaChange?: (value: string) => void;
  onMunicipioChange?: (value: string) => void;
}

export function LocationSelect({
  control,
  nameProvincia,
  nameMunicipio,
  nameSector,
  disabled = false,
  onProvinciaChange,
  onMunicipioChange,
}: LocationSelectProps) {
  const provinciaId = useWatch({ control, name: nameProvincia });
  const municipioId = useWatch({ control, name: nameMunicipio });

  const provincias = useMemo(() => bundleData.global_catalogs.rd.provincias, []);
  const municipios = useMemo(() => bundleData.global_catalogs.rd.municipios, []);
  const sectores = useMemo(() => bundleData.global_catalogs.rd.ciudades, []);

  const filteredMunicipios = useMemo(() => {
    if (!provinciaId) return [];
    return municipios.filter(m => m.provincia_id === provinciaId);
  }, [provinciaId, municipios]);

  const filteredSectores = useMemo(() => {
    if (!municipioId) return [];
    return sectores.filter(s => s.municipio_id === municipioId);
  }, [municipioId, sectores]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Provincia</label>
        <Combobox
          options={provincias.map(p => ({ value: p.id, label: p.nombre }))}
          value={provinciaId || ""}
          onValueChange={(value) => {
            onProvinciaChange?.(value);
          }}
          placeholder="Seleccionar provincia..."
          searchPlaceholder="Buscar provincia..."
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Municipio</label>
        <Combobox
          options={filteredMunicipios.map(m => ({ value: m.id, label: m.nombre }))}
          value={municipioId || ""}
          onValueChange={(value) => {
            onMunicipioChange?.(value);
          }}
          placeholder={provinciaId ? "Seleccionar municipio..." : "Primero seleccione provincia"}
          searchPlaceholder="Buscar municipio..."
          disabled={!provinciaId || disabled}
        />
        {!provinciaId && (
          <p className="text-xs text-muted-foreground">Debe seleccionar una provincia primero</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Sector/Ciudad</label>
        <Combobox
          options={filteredSectores.map(s => ({ value: s.id, label: s.nombre }))}
          value={useWatch({ control, name: nameSector }) || ""}
          onValueChange={() => {}}
          placeholder={municipioId ? "Seleccionar sector..." : "Primero seleccione municipio"}
          searchPlaceholder="Buscar sector..."
          disabled={!municipioId || disabled}
        />
        {!municipioId && (
          <p className="text-xs text-muted-foreground">Debe seleccionar un municipio primero</p>
        )}
      </div>
    </div>
  );
}
