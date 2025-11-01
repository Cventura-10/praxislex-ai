import { UseFormReturn } from 'react-hook-form';

type Base = Record<string, any>;

/**
 * Hidrata campos de cliente en el formulario
 */
export function hydrateClient<Form extends Base>(f: UseFormReturn<Form>, base: string, c: any) {
  const set = f.setValue;
  set(`${base}.cliente_id` as any, c.id);
  set(`${base}.nombre_completo` as any, c.nombre_completo ?? c.nombre ?? '');
  set(`${base}.cedula_rnc` as any, c.cedula_rnc_encrypted ?? c.cedula ?? '');
  set(`${base}.nacionalidad` as any, c.nacionalidad ?? '');
  set(`${base}.estado_civil` as any, c.estado_civil ?? '');
  set(`${base}.profesion` as any, c.profesion ?? c.ocupacion ?? '');
  set(`${base}.email` as any, c.email ?? '');
  set(`${base}.telefono` as any, c.telefono ?? '');
  set(`${base}.direccion` as any, c.direccion ?? '');
  set(`${base}.provincia_id` as any, c.provincia_id ?? null);
  set(`${base}.municipio_id` as any, c.municipio_id ?? null);
  set(`${base}.sector_id` as any, c.sector_id ?? null);
}

/**
 * Hidrata campos de notario en el formulario
 */
export function hydrateNotario<Form extends Base>(f: UseFormReturn<Form>, n: any) {
  const set = f.setValue;
  set('notario.id' as any, n.id);
  set('notario.nombre_completo' as any, n.nombre ?? n.nombre_completo ?? '');
  set('notario.exequatur' as any, n.exequatur ?? n.matricula_cdn ?? '');
  set('notario.cedula_mask' as any, n.cedula_mask ?? n.cedula_encrypted ?? '');
  set('notario.oficina' as any, n.oficina_direccion ?? n.oficina ?? '');
  const jurisd = [n.municipio_nombre, n.provincia_nombre].filter(Boolean).join(' / ');
  set('notario.jurisdiccion' as any, jurisd || n.jurisdiccion || '');
  set('notario.telefono' as any, n.telefono ?? '');
  set('notario.email' as any, n.email ?? '');
}

/**
 * Hidrata campos de abogado/profesional en el formulario
 */
export function hydrateLawyer<Form extends Base>(f: UseFormReturn<Form>, base: string, l: any) {
  const set = f.setValue;
  set(`${base}.professional_id` as any, l.id ?? null);
  set(`${base}.nombre_completo` as any, l.nombre ?? l.nombre_completo ?? '');
  set(`${base}.cedula_rnc` as any, l.cedula ?? l.cedula_mask ?? '');
  set(`${base}.matricula` as any, l.matricula_card ?? l.exequatur ?? '');
  set(`${base}.email` as any, l.email ?? '');
  set(`${base}.telefono` as any, l.telefono ?? '');
  set(`${base}.oficina` as any, l.despacho_direccion ?? l.oficina ?? '');
  set(`${base}.provincia_id` as any, l.provincia_id ?? null);
  set(`${base}.municipio_id` as any, l.municipio_id ?? null);
  set(`${base}.sector_id` as any, l.sector_id ?? null);
}

/**
 * Resetea cascada geográfica (municipio y sector cuando cambia provincia)
 */
export function resetGeoCascade<Form extends Base>(f: UseFormReturn<Form>, base: string) {
  f.resetField(`${base}.municipio_id` as any);
  f.resetField(`${base}.sector_id` as any);
}
