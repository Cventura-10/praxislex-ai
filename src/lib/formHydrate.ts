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
export function hydrateClient<Form extends Record<string, any>>(
  f: UseFormReturn<Form>, 
  base: string, 
  c: Cliente
) {
  const set = f.setValue;
  
  // Identificación
  set(`${base}.cliente_id` as any, c.id);
  set(`${base}.nombre_completo` as any, c.nombre_completo ?? '');
  set(`${base}.cedula_rnc` as any, c.cedula_rnc ?? '');
  set(`${base}.tipo_persona` as any, c.tipo_persona ?? 'fisica');
  
  // Datos civiles
  set(`${base}.nacionalidad` as any, c.nacionalidad ?? '');
  set(`${base}.estado_civil` as any, c.estado_civil ?? '');
  set(`${base}.profesion` as any, c.profesion ?? c.ocupacion ?? '');
  
  // Domicilio y geografía
  set(`${base}.provincia_id` as any, c.provincia_id ?? null);
  set(`${base}.municipio_id` as any, c.municipio_id ?? null);
  set(`${base}.sector_id` as any, c.sector_id ?? null);
  set(`${base}.direccion` as any, c.direccion ?? '');
  set(`${base}.ciudad` as any, c.ciudad ?? '');
  
  // Contacto
  set(`${base}.email` as any, c.email ?? '');
  set(`${base}.telefono` as any, c.telefono ?? '');
  
  // Persona jurídica (si aplica)
  set(`${base}.razon_social` as any, c.razon_social ?? '');
  set(`${base}.representante_legal` as any, c.representante_legal ?? '');
  set(`${base}.cargo_representante` as any, c.cargo_representante ?? '');
  
  // Profesionales (si aplica)
  set(`${base}.matricula_card` as any, c.matricula_card ?? '');
  set(`${base}.matricula_profesional` as any, c.matricula_profesional ?? '');
}

/**
 * Hidrata (autollena) todos los campos de un notario en el formulario
 * @param f - React Hook Form instance
 * @param n - Datos del notario
 */
export function hydrateNotario<Form extends Record<string, any>>(
  f: UseFormReturn<Form>, 
  n: NotarioView
) {
  const set = f.setValue;
  
  set('notario.id' as any, n.id);
  set('notario.nombre_completo' as any, n.nombre_completo ?? n.nombre ?? '');
  set('notario.exequatur' as any, n.exequatur ?? '');
  set('notario.cedula_mask' as any, n.cedula_mask ?? '');
  set('notario.oficina' as any, n.oficina ?? n.oficina_direccion ?? '');
  set('notario.telefono' as any, n.telefono ?? '');
  set('notario.email' as any, n.email ?? '');
  
  // Jurisdicción compuesta
  const jurisd = n.jurisdiccion ?? [n.municipio_nombre, n.provincia_nombre]
    .filter(Boolean)
    .join(' / ');
  set('notario.jurisdiccion' as any, jurisd);
}

/**
 * Hidrata (autollena) todos los campos de un abogado en el formulario
 * @param f - React Hook Form instance
 * @param base - Path base del formulario (ej: 'abogado', 'abogado_contrario.0')
 * @param a - Datos del abogado
 */
export function hydrateAbogado<Form extends Record<string, any>>(
  f: UseFormReturn<Form>, 
  base: string, 
  a: AbogadoView
) {
  const set = f.setValue;
  
  set(`${base}.id` as any, a.id);
  set(`${base}.nombre` as any, a.nombre ?? '');
  set(`${base}.cedula` as any, a.cedula ?? '');
  set(`${base}.matricula_card` as any, a.matricula_card ?? '');
  set(`${base}.email` as any, a.email ?? '');
  set(`${base}.telefono` as any, a.telefono ?? '');
  set(`${base}.despacho_direccion` as any, a.despacho_direccion ?? '');
}

/**
 * Resetea cascada de municipio y sector cuando cambia la provincia
 * @param f - React Hook Form instance
 * @param base - Path base del formulario
 */
export function resetGeoCascade<Form extends Record<string, any>>(
  f: UseFormReturn<Form>,
  base: string
) {
  f.resetField(`${base}.municipio_id` as any);
  f.resetField(`${base}.sector_id` as any);
}
