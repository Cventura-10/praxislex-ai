/**
 * VALIDADORES ESPECÍFICOS PARA DEMANDA CIVIL
 * Según plantilla canónica
 */

import { z } from "zod";

/**
 * Esquema de validación para Traslado del Alguacil
 */
export const trasladoAlguacilSchema = z.object({
  domicilio: z.string().min(10, "Domicilio del traslado requerido"),
  receptor: z.string().min(3, "Nombre del receptor requerido"),
  cargo: z.string().min(3, "Cargo/investidura del receptor requerido"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:mm)"),
});

export type TrasladoAlguacil = z.infer<typeof trasladoAlguacilSchema>;

/**
 * Esquema completo para Demanda Civil
 */
export const demandaCivilSchema = z.object({
  // Identificación
  numero_acto: z.string().min(1, "Número de acto requerido"),
  folios: z.number().int().positive("Folios debe ser positivo"),
  ciudad_actuacion: z.string().min(3, "Ciudad requerida"),
  provincia_actuacion: z.string().min(3, "Provincia requerida"),
  fecha_acto: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),

  // Partes
  demandante_identificacion_completa: z.string().min(20, "Identificación completa del demandante"),
  demandados_lista: z.array(z.string().min(10)).nonempty("Al menos un demandado"),
  domicilio_procesal: z.string().min(10, "Domicilio procesal requerido"),

  // Abogado
  abogado_nombre: z.string().min(3, "Nombre del abogado"),
  abogado_matricula: z.string().min(3, "Matrícula CARD"),
  abogado_cedula: z.string().regex(/^\d{3}-?\d{7}-?\d{1}$/, "Cédula inválida"),
  abogado_estudio: z.string().min(10, "Dirección del estudio"),
  abogado_contacto: z.string().min(5, "Contacto requerido"),

  // Ministerio
  mandato_texto: z.string().min(20, "Texto del mandato requerido"),
  traslados_enumerados: z.array(trasladoAlguacilSchema).nonempty("Al menos un traslado"),
  emplazamiento_texto: z.string().min(20, "Texto de emplazamiento"),
  tribunal_competente: z.string().min(5, "Tribunal requerido"),
  ubicacion_tribunal: z.string().min(5, "Ubicación del tribunal"),
  octava_franca_fecha_limite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),

  // Síntesis
  proposito_breve: z.string().min(20, "Propósito de la demanda"),

  // Hechos
  hechos_detallados: z.string().min(100, "Hechos deben ser detallados (mínimo 100 caracteres)"),

  // Derecho
  fundamento_bloque_constitucional: z.array(z.string()).optional(),
  fundamento_tratados: z.array(z.string()).optional(),
  fundamento_codigos: z.array(z.string().min(10)).nonempty("Al menos una cita legal"),
  otras_normas: z.array(z.string()).optional(),

  // Tesis
  tesis_argumental: z.string().min(50, "Tesis de derecho requerida"),
  subsuncion_hechos_norma: z.string().min(50, "Subsunción requerida"),
  citas_jurisprudenciales: z.array(z.string()).optional(),
  citas_doctrina: z.array(z.string()).optional(),

  // Dispositivo
  petitorio_items: z.array(z.string().min(10)).nonempty("Al menos una pretensión"),
  costas_texto: z.string().min(10, "Texto de costas"),

  // Declaración ministerial (opcional)
  recibido_por: z.string().optional(),
  folios_totales: z.number().int().positive().optional(),
  hora_inicio: z.string().optional(),
  hora_fin: z.string().optional(),
  costo_actuacion: z.string().optional(),
  certificacion_ministerial: z.string().optional(),
});

export type DemandaCivilData = z.infer<typeof demandaCivilSchema>;

/**
 * Calcula la fecha límite de octava franca
 * @param fechaNotificacion - Fecha de notificación del acto
 * @returns Fecha límite (8 días después sin contar feriados)
 */
export function calcularOctavaFranca(fechaNotificacion: Date): Date {
  const limite = new Date(fechaNotificacion);
  let diasAgregados = 0;
  
  while (diasAgregados < 8) {
    limite.setDate(limite.getDate() + 1);
    const diaSemana = limite.getDay();
    
    // Excluir domingos (0) y sábados (6) opcional según jurisdicción
    if (diaSemana !== 0) {
      diasAgregados++;
    }
  }
  
  return limite;
}

/**
 * Valida que haya al menos un traslado por demandado
 */
export function validarTrasladosPorDemandado(
  demandados: string[],
  traslados: TrasladoAlguacil[]
): boolean {
  return traslados.length >= demandados.length;
}
