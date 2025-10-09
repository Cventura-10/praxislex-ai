import { z } from "zod";

/**
 * Validaciones para formularios de intake jurídico - PraxisLex
 * Basado en FORMS_IA_INTAKE.md
 */

// ============= Esquema Base de Modelo =============
export const modeloBaseSchema = z.object({
  nombre_tecnico: z.string().regex(/^[A-Z0-9_]+$/, "Formato inválido: debe ser MAYÚSCULAS_CON_GUIONES"),
  materia: z.string().min(3, "Materia debe tener al menos 3 caracteres"),
  tipo: z.string().min(3, "Tipo debe tener al menos 3 caracteres"),
  accion: z.string().optional(),
  campos: z.array(z.string().min(3)).nonempty("Debe tener al menos un campo"),
  prompt_base: z.string().min(10, "Prompt base debe ser descriptivo")
});

export type ModeloBase = z.infer<typeof modeloBaseSchema>;

// ============= Esquema de Intake Completo =============
export const intakeCompletoSchema = z.object({
  // Datos del Acto
  acto_numero: z.string().optional(),
  acto_folios: z.string().optional(),
  ciudad_actuacion: z.string().optional(),
  alguacil_nombre: z.string().optional(),

  // Demandante/Accionante
  demandante_nombre: z.string().min(3, "Nombre del demandante requerido").max(200),
  demandante_nacionalidad: z.string().max(100).optional(),
  demandante_edad: z.string().max(3).optional(),
  demandante_estado_civil: z.string().max(50).optional(),
  demandante_profesion: z.string().max(100).optional(),
  demandante_cedula: z.string().max(50).optional(),
  demandante_domicilio: z.string().max(500).optional(),

  // Abogado Apoderado
  abogado_nombre: z.string().min(3, "Nombre del abogado requerido").max(200),
  abogado_cedula: z.string().max(50).optional(),
  abogado_matricula: z.string().max(50).optional(),
  abogado_direccion: z.string().max(500).optional(),
  abogado_telefono: z.string().max(20).optional(),
  abogado_email: z.string().email("Email inválido").max(255).optional(),

  // Demandado/Accionado
  demandado_nombre: z.string().min(3, "Nombre del demandado requerido").max(200),
  demandado_nacionalidad: z.string().max(100).optional(),
  demandado_edad: z.string().max(3).optional(),
  demandado_estado_civil: z.string().max(50).optional(),
  demandado_profesion: z.string().max(100).optional(),
  demandado_cedula: z.string().max(50).optional(),
  demandado_domicilio: z.string().max(500).optional(),
  demandado_cargo: z.string().max(200).optional(),

  // Tribunal
  tribunal_nombre: z.string().min(3, "Nombre del tribunal requerido").max(200),
  tribunal_sala: z.string().max(100).optional(),
  tribunal_materia: z.string().max(100).optional(),
  tribunal_ubicacion: z.string().max(500).optional(),
  expediente_judicial: z.string().max(100).optional(),
  expediente_gedex: z.string().max(100).optional(),

  // Contenido
  objeto: z.string().max(500).optional(),
  monto: z.string().optional(),
  hechos: z.string().min(30, "Hechos deben tener al menos 30 caracteres").max(10000),
  fundamentos: z.string().min(10, "Fundamentos legales requeridos").max(5000),
  pretensiones: z.string().min(10, "Pretensiones requeridas").max(5000),
  
  // Pruebas
  anexos: z.string().max(2000).optional(),
  lista_pruebas: z.string().max(2000).optional()
});

export type IntakeCompleto = z.infer<typeof intakeCompletoSchema>;

// ============= Esquemas específicos por materia =============

// Civil - Cobro de Pesos
export const civilCobroPesosSchema = intakeCompletoSchema.extend({
  monto: z.string().min(1, "Cuantía requerida")
});

// Constitucional - Amparo
export const constitucionalAmparoSchema = intakeCompletoSchema.extend({
  derechosVulnerados: z.string().min(10, "Derechos vulnerados requeridos").max(2000),
  medidas: z.string().max(1000).optional()
});

// Laboral - Prestaciones
export const laboralPrestacionesSchema = intakeCompletoSchema.extend({
  relacionLaboral: z.string().min(20, "Relación laboral requerida").max(1000),
  motivoTerminacion: z.enum(["Desahucio", "Despido", "Dimisión", "Otro"]),
  monto: z.string().min(1, "Cuantía estimada requerida")
});

// Inmobiliario - Deslinde
export const inmobiliarioDeslindeSchema = intakeCompletoSchema.extend({
  inmueble: z.string().min(20, "Identificación del inmueble requerida").max(1000)
});

// Civil - Daños y Perjuicios
export const civilDanosSchema = intakeCompletoSchema.extend({
  danos: z.string().min(20, "Descripción de daños requerida").max(2000),
  monto: z.string().min(1, "Cuantía requerida")
});

// Civil - Referimiento
export const civilReferimientoSchema = intakeCompletoSchema.extend({
  urgencia: z.string().min(20, "Urgencia requerida").max(1000),
  apariencia: z.string().min(20, "Apariencia de buen derecho requerida").max(1000),
  medidas: z.string().min(10, "Medidas solicitadas requeridas").max(1000)
});

// ============= Helpers de validación =============

/**
 * Valida que un campo requerido no esté vacío
 */
export function campoRequerido(valor: string | undefined, nombreCampo: string): string {
  if (!valor || valor.trim() === "") {
    return "[Por completar]";
  }
  return valor.trim();
}

/**
 * Valida formato de cédula dominicana
 */
export function validarCedula(cedula: string): boolean {
  const regex = /^\d{3}-?\d{7}-?\d{1}$/;
  return regex.test(cedula);
}

/**
 * Anonimiza PII antes de enviar al LLM
 */
export function anonimizarPII(texto: string): string {
  return texto
    .replace(/\d{3}-?\d{7}-?\d{1}/g, "[[CEDULA]]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[[EMAIL]]")
    .replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[[TEL]]");
}

/**
 * Restituye PII después de recibir del LLM
 */
export function restituirPII(
  texto: string,
  mapeo: { cedulas?: string[]; emails?: string[]; telefonos?: string[] }
): string {
  let resultado = texto;
  
  if (mapeo.cedulas) {
    mapeo.cedulas.forEach((cedula, i) => {
      resultado = resultado.replace(`[[CEDULA_${i}]]`, cedula);
    });
  }
  
  if (mapeo.emails) {
    mapeo.emails.forEach((email, i) => {
      resultado = resultado.replace(`[[EMAIL_${i}]]`, email);
    });
  }
  
  if (mapeo.telefonos) {
    mapeo.telefonos.forEach((tel, i) => {
      resultado = resultado.replace(`[[TEL_${i}]]`, tel);
    });
  }
  
  return resultado;
}

/**
 * Valida estructura de petitorio numerado
 */
export function validarPetitorioNumerado(pretensiones: string): boolean {
  const regex = /(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO)/i;
  return regex.test(pretensiones);
}
