/**
 * Helper único de autollenado (una sola fuente de verdad)
 * Hidrata formularios con datos de clientes, notarios y abogados
 */

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

export type Cliente = Civiles & Domicilio & Contacto & {
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

export type NotarioView = {
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

export type AbogadoView = {
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
 * @param setValue - Función setValue de react-hook-form
 * @param base - Path base del formulario (ej: 'primera_parte', 'segunda_parte', 'contraparte.0')
 * @param c - Datos del cliente
 */
export function hydrateClient(
  setValue: (name: string, value: any) => void,
  base: string, 
  c: Cliente
) {
  // Identificación
  setValue(`${base}.cliente_id`, c.id);
  setValue(`${base}.nombre_completo`, c.nombre_completo ?? '');
  setValue(`${base}.cedula_rnc`, c.cedula_rnc ?? '');
  setValue(`${base}.tipo_persona`, c.tipo_persona ?? 'fisica');
  
  // Datos civiles
  setValue(`${base}.nacionalidad`, c.nacionalidad ?? '');
  setValue(`${base}.estado_civil`, c.estado_civil ?? '');
  setValue(`${base}.profesion`, c.profesion ?? c.ocupacion ?? '');
  
  // Domicilio y geografía
  setValue(`${base}.provincia_id`, c.provincia_id ?? null);
  setValue(`${base}.municipio_id`, c.municipio_id ?? null);
  setValue(`${base}.sector_id`, c.sector_id ?? null);
  setValue(`${base}.direccion`, c.direccion ?? '');
  setValue(`${base}.ciudad`, c.ciudad ?? '');
  
  // Contacto
  setValue(`${base}.email`, c.email ?? '');
  setValue(`${base}.telefono`, c.telefono ?? '');
  
  // Persona jurídica (si aplica)
  setValue(`${base}.razon_social`, c.razon_social ?? '');
  setValue(`${base}.representante_legal`, c.representante_legal ?? '');
  setValue(`${base}.cargo_representante`, c.cargo_representante ?? '');
  
  // Profesionales (si aplica)
  setValue(`${base}.matricula_card`, c.matricula_card ?? '');
  setValue(`${base}.matricula_profesional`, c.matricula_profesional ?? '');
}

/**
 * Hidrata (autollena) todos los campos de un notario en el formulario
 * @param setValue - Función setValue de react-hook-form
 * @param n - Datos del notario
 */
export function hydrateNotario(
  setValue: (name: string, value: any) => void,
  n: NotarioView
) {
  setValue('notario.id', n.id);
  setValue('notario.nombre_completo', n.nombre_completo ?? n.nombre ?? '');
  setValue('notario.exequatur', n.exequatur ?? '');
  setValue('notario.cedula_mask', n.cedula_mask ?? '');
  setValue('notario.oficina', n.oficina ?? n.oficina_direccion ?? '');
  setValue('notario.telefono', n.telefono ?? '');
  setValue('notario.email', n.email ?? '');
  
  // Jurisdicción compuesta
  const jurisd = n.jurisdiccion ?? [n.municipio_nombre, n.provincia_nombre]
    .filter(Boolean)
    .join(' / ');
  setValue('notario.jurisdiccion', jurisd);
}

/**
 * Hidrata (autollena) todos los campos de un abogado en el formulario
 * @param setValue - Función setValue de react-hook-form
 * @param base - Path base del formulario (ej: 'abogado', 'abogado_contrario.0')
 * @param a - Datos del abogado
 */
export function hydrateAbogado(
  setValue: (name: string, value: any) => void,
  base: string, 
  a: AbogadoView
) {
  setValue(`${base}.id`, a.id);
  setValue(`${base}.nombre`, a.nombre ?? '');
  setValue(`${base}.cedula`, a.cedula ?? '');
  setValue(`${base}.matricula_card`, a.matricula_card ?? '');
  setValue(`${base}.email`, a.email ?? '');
  setValue(`${base}.telefono`, a.telefono ?? '');
  setValue(`${base}.despacho_direccion`, a.despacho_direccion ?? '');
}

/**
 * Resetea cascada de municipio y sector cuando cambia la provincia
 * @param resetField - Función resetField de react-hook-form
 * @param base - Path base del formulario
 */
export function resetGeoCascade(
  resetField: (name: string) => void,
  base: string
) {
  resetField(`${base}.municipio_id`);
  resetField(`${base}.sector_id`);
}
