import { z } from "zod";

export const coerceDateISO = z.preprocess((v) => {
  if (!v) return undefined;
  // admite "YYYY-MM-DD" o "DD/MM/YYYY"
  if (typeof v === "string") {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;               // ISO
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {                      // local
      const [dd, mm, yyyy] = s.split("/").map(Number);
      return `${yyyy}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
    }
  }
  return v;
}, z.string().min(10, "Fecha inválida (usa DD/MM/AAAA)").regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"));

export const coerceTime = z.preprocess((v) => {
  if (!v) return undefined;
  const s = String(v).trim();
  // normaliza "9:7" → "09:07"
  const [h, m] = s.split(":").map(Number);
  if (Number.isInteger(h) && Number.isInteger(m)) {
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }
  return s;
}, z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:mm)"));

export const nonEmptyTrim = (msg = "Requerido") =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, msg));

export const uuid = z.string().uuid("ID inválido");

export const HearingSchema = z.object({
  case_id: uuid.optional().nullable(),
  caso: nonEmptyTrim("Caso requerido"),
  juzgado: nonEmptyTrim("Juzgado requerido"),
  tipo: nonEmptyTrim("Tipo requerido"),
  fecha: coerceDateISO,
  hora: coerceTime,
  ubicacion: z.string().optional().nullable(),
  estado: z.enum(['programada', 'realizada', 'cancelada']).default('programada'),
});

export type HearingInput = z.infer<typeof HearingSchema>;

export const DeadlineSchema = z.object({
  case_id: uuid.optional().nullable(),
  caso: nonEmptyTrim("Caso requerido"),
  tipo: nonEmptyTrim("Tipo de plazo requerido"),
  fecha_vencimiento: coerceDateISO,
  prioridad: z.enum(['baja', 'media', 'alta']).default('media'),
});

export type DeadlineInput = z.infer<typeof DeadlineSchema>;
