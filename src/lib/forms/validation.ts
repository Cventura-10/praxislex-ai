import { z } from "zod";

/**
 * Validaciones fail-fast para generación de documentos
 * FASE 4: Prevenir generación con datos incompletos
 */

export const documentGenerationSchema = z.object({
  // Primera Parte (requerido)
  primera_parte: z.object({
    cliente_id: z.string().min(1, "Debe seleccionar un cliente para la primera parte"),
    nombre: z.string().trim().min(1, "Nombre de primera parte requerido"),
    cedula: z.string().trim().min(1, "Cédula de primera parte requerida"),
    nacionalidad: z.string().trim().min(1, "Nacionalidad requerida"),
    estado_civil: z.string().trim().min(1, "Estado civil requerido"),
    profesion: z.string().trim().min(1, "Profesión u ocupación requerida"),
    provincia_id: z.number().nullable(),
    municipio_id: z.number().nullable(),
    direccion: z.string().trim().min(1, "Dirección requerida"),
  }),

  // Segunda Parte (requerido)
  segunda_parte: z.object({
    cliente_id: z.string().min(1, "Debe seleccionar un cliente para la segunda parte"),
    nombre: z.string().trim().min(1, "Nombre de segunda parte requerido"),
    cedula: z.string().trim().min(1, "Cédula de segunda parte requerida"),
    nacionalidad: z.string().trim().min(1, "Nacionalidad requerida"),
    estado_civil: z.string().trim().min(1, "Estado civil requerido"),
    profesion: z.string().trim().min(1, "Profesión u ocupación requerida"),
    provincia_id: z.number().nullable(),
    municipio_id: z.number().nullable(),
    direccion: z.string().trim().min(1, "Dirección requerida"),
  }),

  // Notario (requerido)
  notario: z.object({
    nombre: z.string().trim().min(1, "Debe seleccionar un notario"),
    exequatur: z.string().trim().min(1, "Exequátur del notario requerido"),
    oficina: z.string().trim().min(1, "Oficina del notario requerida"),
    jurisdiccion: z.string().trim().min(1, "Jurisdicción del notario requerida"),
  }),

  // Contrato (validar montos)
  contrato: z.object({
    canon_monto: z.number()
      .positive("El monto del canon debe ser mayor a 0")
      .refine(val => val > 0, "El canon no puede ser RD$0.00"),
    plazo_meses: z.number()
      .int("El plazo debe ser un número entero")
      .positive("El plazo debe ser mayor a 0")
      .min(1, "El plazo mínimo es 1 mes"),
  }).optional(),
});

export type DocumentGenerationData = z.infer<typeof documentGenerationSchema>;

/**
 * Valida datos antes de generar documento
 * Retorna array de errores o null si todo OK
 */
export function validateBeforeGeneration(data: any): string[] | null {
  try {
    documentGenerationSchema.parse(data);
    return null; // Todo OK
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
    }
    return ["Error de validación desconocido"];
  }
}

/**
 * Validación de montos para evitar RD$0.00
 */
export function validateMontos(data: any): string[] {
  const errors: string[] = [];

  if (data.contrato?.canon_monto !== undefined) {
    const canon = Number(data.contrato.canon_monto);
    if (isNaN(canon) || canon <= 0) {
      errors.push("El canon debe ser un monto válido mayor a RD$0.00");
    }
  }

  if (data.contrato?.plazo_meses !== undefined) {
    const plazo = Number(data.contrato.plazo_meses);
    if (isNaN(plazo) || plazo < 1 || !Number.isInteger(plazo)) {
      errors.push("El plazo debe ser un número entero de meses mayor a 0");
    }
  }

  return errors;
}

/**
 * Validación de domicilio completo
 */
export function validateDomicilio(parte: any, nombreParte: string): string[] {
  const errors: string[] = [];

  if (!parte.provincia_id) {
    errors.push(`${nombreParte}: Debe seleccionar una provincia`);
  }

  if (!parte.municipio_id) {
    errors.push(`${nombreParte}: Debe seleccionar un municipio`);
  }

  if (!parte.direccion || parte.direccion.trim() === "") {
    errors.push(`${nombreParte}: Debe proporcionar una dirección`);
  }

  return errors;
}

