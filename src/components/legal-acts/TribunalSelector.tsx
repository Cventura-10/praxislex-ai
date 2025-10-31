import { useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { TRIBUNALES_REPUBLICA_DOMINICANA } from "@/lib/tribunalesData";
import { Label } from "@/components/ui/label";

interface TribunalSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export function TribunalSelector({ 
  value, 
  onChange, 
  label = "Tribunal/Juzgado",
  required = false 
}: TribunalSelectorProps) {
  const [selectedTribunal, setSelectedTribunal] = useState(value);

  const handleChange = (newValue: string) => {
    setSelectedTribunal(newValue);
    
    // Buscar el tribunal seleccionado para obtener su nombre completo
    const tribunal = TRIBUNALES_REPUBLICA_DOMINICANA.find(t => t.value === newValue);
    onChange(tribunal?.label || newValue);
  };

  // Preparar opciones para el Combobox con categorías
  const options = TRIBUNALES_REPUBLICA_DOMINICANA.map(tribunal => ({
    value: tribunal.value,
    label: tribunal.label,
    categoria: tribunal.provincia || tribunal.categoria
  }));

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Combobox
        options={options}
        value={selectedTribunal}
        onValueChange={handleChange}
        placeholder="Buscar tribunal o juzgado..."
      />
      <p className="text-xs text-muted-foreground">
        Escriba las primeras letras para buscar automáticamente
      </p>
    </div>
  );
}
