import { UseFormReturn } from 'react-hook-form';

type Domicilio = { 
  provincia_id?: number | null; 
  municipio_id?: number | null; 
  sector_id?: number | null; 
  direccion?: string | null; 
  ciudad?: string | null;
};

type Civiles = { 
  nacionalidad?: string | null; 
  estado_civil?: string | null; 
  profesion?: string | null; 
  ocupacion?: string | null;
};

type Contacto = { 
  email?: string | null; 
  telefono?: string | null;
};

type Cliente = Civiles & Domicilio & Contacto & {
  id: string; 
  nombre_completo?: string | null; 
  cedula_rnc?: string | null; 
  tipo_persona?: 'fisica' | 'juridica';
  razon_social?: string | null; 
  representante_legal?: string | null; 
  cargo_representante?: string | null;
  matricula_card?: string | null; 
  matricula_profesional?: string | null;
};

type NotarioView = {
  id: string; 
  nombre?: string | null;
  nombre_completo?: string | null; 
  exequatur?: string | null; 
  cedula_mask?: string | null;
  oficina?: string | null;
  oficina_direccion?: string | null;
  municipio_nombre?: string | null; 
  provincia_nombre?: string | null;
  jurisdiccion?: string | null;
  telefono?: string | null;
  email?: string | null;
};

type AbogadoView = {
  id: string;
  nombre?: string | null;
  cedula?: string | null;
  matricula_card?: string | null;
  email?: string | null;
  telefono?: string | null;
  despacho_direccion?: string | null;
};

/**
 * Hidrata (autollena) todos los campos de un cliente en el formulario
 * @param f - React Hook Form instance
 * @param base - Path base del formulario (ej: 'primera_parte', 'segunda_parte', 'contraparte.0')
 * @param c - Datos del cliente
 */
export function hydrateClient(
  f: UseFormReturn<any>, 
  base: string, 
  c: Cliente
) {
  const set = (path: string, value: any) => f.setValue(path as any, value);
  
  // Identificación
  set(`${base}.cliente_id`, c.id);
  set(`${base}.nombre_completo`, c.nombre_completo ?? '');
  set(`${base}.cedula_rnc`, c.cedula_rnc ?? '');
  set(`${base}.tipo_persona`, c.tipo_persona ?? 'fisica');
  
  // Datos civiles
  set(`${base}.nacionalidad`, c.nacionalidad ?? '');
  set(`${base}.estado_civil`, c.estado_civil ?? '');
  set(`${base}.profesion`, c.profesion ?? c.ocupacion ?? '');
  
  // Domicilio y geografía
  set(`${base}.provincia_id`, c.provincia_id ?? null);
  set(`${base}.municipio_id`, c.municipio_id ?? null);
  set(`${base}.sector_id`, c.sector_id ?? null);
  set(`${base}.direccion`, c.direccion ?? '');
  set(`${base}.ciudad`, c.ciudad ?? '');
  
  // Contacto
  set(`${base}.email`, c.email ?? '');
  set(`${base}.telefono`, c.telefono ?? '');
  
  // Persona jurídica (si aplica)
  set(`${base}.razon_social`, c.razon_social ?? '');
  set(`${base}.representante_legal`, c.representante_legal ?? '');
  set(`${base}.cargo_representante`, c.cargo_representante ?? '');
  
  // Profesionales (si aplica)
  set(`${base}.matricula_card`, c.matricula_card ?? '');
  set(`${base}.matricula_profesional`, c.matricula_profesional ?? '');
}

/**
 * Hidrata (autollena) todos los campos de un notario en el formulario
 * @param f - React Hook Form instance
 * @param n - Datos del notario
 */
export function hydrateNotario(
  f: UseFormReturn<any>, 
  n: NotarioView
) {
  const set = (path: string, value: any) => f.setValue(path as any, value);
  
  set('notario.id', n.id);
  set('notario.nombre_completo', n.nombre_completo ?? n.nombre ?? '');
  set('notario.exequatur', n.exequatur ?? '');
  set('notario.cedula_mask', n.cedula_mask ?? '');
  set('notario.oficina', n.oficina ?? n.oficina_direccion ?? '');
  set('notario.telefono', n.telefono ?? '');
  set('notario.email', n.email ?? '');
  
  // Jurisdicción compuesta
  const jurisd = n.jurisdiccion ?? [n.municipio_nombre, n.provincia_nombre]
    .filter(Boolean)
    .join(' / ');
  set('notario.jurisdiccion', jurisd);
}

/**
 * Hidrata (autollena) todos los campos de un abogado en el formulario
 * @param f - React Hook Form instance
 * @param base - Path base del formulario (ej: 'abogado', 'abogado_contrario.0')
 * @param a - Datos del abogado
 */
export function hydrateAbogado(
  f: UseFormReturn<any>, 
  base: string, 
  a: AbogadoView
) {
  const set = (path: string, value: any) => f.setValue(path as any, value);
  
  set(`${base}.id`, a.id);
  set(`${base}.nombre`, a.nombre ?? '');
  set(`${base}.cedula`, a.cedula ?? '');
  set(`${base}.matricula_card`, a.matricula_card ?? '');
  set(`${base}.email`, a.email ?? '');
  set(`${base}.telefono`, a.telefono ?? '');
  set(`${base}.despacho_direccion`, a.despacho_direccion ?? '');
}

/**
 * Resetea cascada de municipio y sector cuando cambia la provincia
 * @param f - React Hook Form instance
 * @param base - Path base del formulario
 */
export function resetGeoCascade(
  f: UseFormReturn<any>,
  base: string
) {
  f.resetField(`${base}.municipio_id` as any);
  f.resetField(`${base}.sector_id` as any);
}
