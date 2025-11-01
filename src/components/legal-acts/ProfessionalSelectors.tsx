import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, User, Gavel, UserCog, DollarSign, UserPlus } from "lucide-react";
import { useNotariosView } from "@/hooks/useNotariosView";
import { useAlguaciles, type Alguacil } from "@/hooks/useAlguaciles";
import { usePeritos, type Perito } from "@/hooks/usePeritos";
import { useTasadores, type Tasador } from "@/hooks/useTasadores";
import { useLawyers, type Lawyer } from "@/hooks/useLawyers";

interface LawyerSelectorProps {
  value: string | null;
  onChange: (lawyer: Lawyer | null) => void;
  onFieldUpdate: (fields: Record<string, string>) => void;
}

export function LawyerSelector({ value, onChange, onFieldUpdate }: LawyerSelectorProps) {
  const { lawyers, loading } = useLawyers();

  const handleSelection = (lawyerId: string) => {
    const lawyer = lawyers.find(l => l.id === lawyerId);
    if (lawyer) {
      onChange(lawyer);
      onFieldUpdate({
        abogado_nombre: lawyer.nombre,
        abogado_cedula: lawyer.cedula || '',
        abogado_matricula: lawyer.matricula_card || '',
        abogado_despacho: lawyer.despacho_direccion || '',
        abogado_email: lawyer.email || '',
        abogado_telefono: lawyer.telefono || '',
        abogado_direccion: lawyer.direccion || lawyer.despacho_direccion || '',
        abogado_nacionalidad: lawyer.nacionalidad || '',
        abogado_estado_civil: lawyer.estado_civil || '',
        abogado_fecha_nacimiento: lawyer.fecha_nacimiento || '',
        abogado_lugar_nacimiento: lawyer.lugar_nacimiento || '',
        abogado_pasaporte: lawyer.pasaporte || '',
      });
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
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        Abogado Redactor
      </Label>
      <Select value={value || ""} onValueChange={handleSelection}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar abogado..." />
        </SelectTrigger>
        <SelectContent>
          {lawyers.map((lawyer) => (
            <SelectItem key={lawyer.id} value={lawyer.id}>
              {lawyer.nombre} {lawyer.matricula_card ? `(Mat. ${lawyer.matricula_card})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface NotarioSelectorProps {
  value: string | null;
  onChange: (notarioId: string | null) => void;
  onFieldUpdate: (fields: Record<string, any>) => void;
  required?: boolean;
}

export function NotarioSelector({ value, onChange, onFieldUpdate, required = false }: NotarioSelectorProps) {
  const { data: notarios = [], isLoading: loading } = useNotariosView();

  const handleSelection = (notarioId: string) => {
    if (notarioId === "manual") {
      onChange(null);
      onFieldUpdate({
        notario_nombre: "",
        notario_exequatur: "",
        notario_cedula_mask: "",
        notario_oficina: "",
        notario_jurisdiccion: "",
        notario_telefono: "",
        notario_email: "",
      });
      return;
    }

    const notario = notarios.find(n => n.id === notarioId);
    if (notario) {
      onChange(notarioId);
      onFieldUpdate({
        notario_nombre: notario.nombre,
        notario_exequatur: notario.exequatur,
        notario_cedula_mask: notario.cedula_mask,
        notario_oficina: notario.oficina,
        notario_jurisdiccion: [notario.municipio_nombre, notario.provincia_nombre]
          .filter(Boolean)
          .join(' / ') || notario.jurisdiccion || '',
        notario_telefono: notario.telefono,
        notario_email: notario.email,
      });
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
    <div className="space-y-3 p-4 border border-border rounded-lg bg-card">
      <Label className="flex items-center gap-2 text-base font-semibold">
        <Gavel className="h-5 w-5 text-primary" />
        Notario Público
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value || ""} onValueChange={handleSelection}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar notario..." />
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
              <div className="flex flex-col">
                <span className="font-medium">{notario.nombre}</span>
                {notario.exequatur && (
                  <span className="text-xs text-muted-foreground">
                    Exequátur: {notario.exequatur}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        💡 Selecciona un notario para autocompletar exequátur, oficina y jurisdicción
      </p>
    </div>
  );
}

interface AlguacilSelectorProps {
  value: string | null;
  onChange: (alguacil: Alguacil | null) => void;
  onFieldUpdate: (fields: Record<string, string>) => void;
}

export function AlguacilSelector({ value, onChange, onFieldUpdate }: AlguacilSelectorProps) {
  const { alguaciles, loading } = useAlguaciles();

  const handleSelection = (alguacilId: string) => {
    const alguacil = alguaciles.find(a => a.id === alguacilId);
    if (alguacil) {
      onChange(alguacil);
      onFieldUpdate({
        alguacil_nombre: alguacil.nombre,
        alguacil_cedula: alguacil.cedula_encrypted || '',
        alguacil_matricula: alguacil.matricula || '',
        alguacil_jurisdiccion: alguacil.jurisdiccion || '',
        alguacil_direccion: alguacil.direccion_notificaciones || '',
        alguacil_telefono: alguacil.telefono || '',
        alguacil_nacionalidad: alguacil.nacionalidad || '',
        alguacil_estado_civil: alguacil.estado_civil || '',
        alguacil_fecha_nacimiento: alguacil.fecha_nacimiento || '',
        alguacil_lugar_nacimiento: alguacil.lugar_nacimiento || '',
        alguacil_pasaporte: alguacil.pasaporte || '',
      });
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
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <UserCog className="h-4 w-4 text-primary" />
        Alguacil
      </Label>
      <Select value={value || ""} onValueChange={handleSelection}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar alguacil..." />
        </SelectTrigger>
        <SelectContent>
          {alguaciles.map((alguacil) => (
            <SelectItem key={alguacil.id} value={alguacil.id}>
              {alguacil.nombre} - {alguacil.jurisdiccion}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface PeritoSelectorProps {
  value: string | null;
  onChange: (perito: Perito | null) => void;
  onFieldUpdate: (fields: Record<string, string>) => void;
}

export function PeritoSelector({ value, onChange, onFieldUpdate }: PeritoSelectorProps) {
  const { peritos, loading } = usePeritos();

  const handleSelection = (peritoId: string) => {
    const perito = peritos.find(p => p.id === peritoId);
    if (perito) {
      onChange(perito);
      onFieldUpdate({
        perito_nombre: perito.nombre,
        perito_cedula: perito.cedula_encrypted || '',
        perito_especialidad: perito.especialidad || '',
        perito_matricula: perito.matricula || '',
        perito_jurisdiccion: perito.jurisdiccion || '',
        perito_institucion: perito.institucion || '',
        perito_telefono: perito.telefono || '',
        perito_email: perito.email || '',
        perito_nacionalidad: perito.nacionalidad || '',
        perito_estado_civil: perito.estado_civil || '',
        perito_fecha_nacimiento: perito.fecha_nacimiento || '',
        perito_lugar_nacimiento: perito.lugar_nacimiento || '',
        perito_pasaporte: perito.pasaporte || '',
      });
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
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <UserCog className="h-4 w-4 text-primary" />
        Perito Evaluador
      </Label>
      <Select value={value || ""} onValueChange={handleSelection}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar perito..." />
        </SelectTrigger>
        <SelectContent>
          {peritos.map((perito) => (
            <SelectItem key={perito.id} value={perito.id}>
              {perito.nombre} - {perito.especialidad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface TasadorSelectorProps {
  value: string | null;
  onChange: (tasador: Tasador | null) => void;
  onFieldUpdate: (fields: Record<string, string>) => void;
}

export function TasadorSelector({ value, onChange, onFieldUpdate }: TasadorSelectorProps) {
  const { tasadores, loading } = useTasadores();

  const handleSelection = (tasadorId: string) => {
    const tasador = tasadores.find(t => t.id === tasadorId);
    if (tasador) {
      onChange(tasador);
      onFieldUpdate({
        tasador_nombre: tasador.nombre,
        tasador_cedula: tasador.cedula_encrypted || '',
        tasador_especialidad: tasador.especialidad || '',
        tasador_matricula: tasador.matricula || '',
        tasador_jurisdiccion: tasador.jurisdiccion || '',
        tasador_direccion: tasador.direccion || '',
        tasador_telefono: tasador.telefono || '',
        tasador_email: tasador.email || '',
        tasador_nacionalidad: tasador.nacionalidad || '',
        tasador_estado_civil: tasador.estado_civil || '',
        tasador_fecha_nacimiento: tasador.fecha_nacimiento || '',
        tasador_lugar_nacimiento: tasador.lugar_nacimiento || '',
        tasador_pasaporte: tasador.pasaporte || '',
      });
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
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        Tasador
      </Label>
      <Select value={value || ""} onValueChange={handleSelection}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar tasador..." />
        </SelectTrigger>
        <SelectContent>
          {tasadores.map((tasador) => (
            <SelectItem key={tasador.id} value={tasador.id}>
              {tasador.nombre} - {tasador.especialidad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
