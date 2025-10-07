import { z } from "zod";

// Email and basic validation patterns
const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
const phoneRegex = /^[0-9]{10,15}$/;
const cedulaRncRegex = /^[0-9]{3}-?[0-9]{7}-?[0-9]{1}$|^[0-9]{3}-?[0-9]{5}-?[0-9]{1}$/;

// Password strength validation
export const passwordSchema = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres")
  .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
  .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")
  .regex(/[^a-zA-Z0-9]/, "Debe contener al menos un símbolo especial");

// Client validation schema
export const clientSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  cedula_rnc_encrypted: z
    .string()
    .trim()
    .regex(cedulaRncRegex, "Formato de cédula o RNC inválido (XXX-XXXXXXX-X)"),
  email: z
    .string()
    .trim()
    .regex(emailRegex, "Correo electrónico inválido")
    .max(255, "El correo no puede exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  telefono: z
    .string()
    .trim()
    .regex(phoneRegex, "Número de teléfono inválido (10-15 dígitos)")
    .optional()
    .or(z.literal("")),
  direccion: z
    .string()
    .trim()
    .max(500, "La dirección no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
});

// Case validation schema
export const caseSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título no puede exceder 200 caracteres"),
  numero_expediente: z
    .string()
    .trim()
    .max(100, "El número de expediente no puede exceder 100 caracteres")
    .optional()
    .or(z.literal('')),
  materia: z
    .string()
    .refine(
      (val) =>
        [
          "civil",
          "penal",
          "laboral",
          "comercial",
          "administrativo",
          "constitucional",
          "familia",
          "inmobiliario",
          "tributario",
        ].includes(val),
      "Materia jurídica inválida"
    ),
  estado: z
    .string()
    .refine((val) => ["activo", "cerrado", "suspendido"].includes(val), "Estado del caso inválido"),
  descripcion: z
    .string()
    .trim()
    .max(5000, "La descripción no puede exceder 5000 caracteres")
    .optional()
    .or(z.literal("")),
  etapa_procesal: z
    .string()
    .trim()
    .max(200, "La etapa procesal no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  juzgado: z
    .string()
    .trim()
    .max(200, "El juzgado no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  responsable: z
    .string()
    .trim()
    .max(200, "El responsable no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  client_id: z.string().uuid("ID de cliente inválido").optional().nullable(),
});

// Hearing validation schema
export const hearingSchema = z.object({
  caso: z
    .string()
    .trim()
    .min(3, "El caso debe tener al menos 3 caracteres")
    .max(200, "El caso no puede exceder 200 caracteres"),
  fecha: z.string().refine((date) => {
    const d = new Date(date);
    return d >= new Date(new Date().setHours(0, 0, 0, 0));
  }, "La fecha debe ser hoy o en el futuro"),
  hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  juzgado: z
    .string()
    .trim()
    .min(3, "El juzgado debe tener al menos 3 caracteres")
    .max(200, "El juzgado no puede exceder 200 caracteres"),
  tipo: z
    .string()
    .trim()
    .min(3, "El tipo debe tener al menos 3 caracteres")
    .max(100, "El tipo no puede exceder 100 caracteres"),
  ubicacion: z
    .string()
    .trim()
    .max(500, "La ubicación no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  estado: z
    .string()
    .refine(
      (val) => ["programada", "realizada", "cancelada", "reprogramada"].includes(val),
      "Estado de audiencia inválido"
    ),
  case_id: z.string().uuid("ID de caso inválido").optional().nullable(),
});

// Deadline validation schema
export const deadlineSchema = z.object({
  caso: z
    .string()
    .trim()
    .min(3, "El caso debe tener al menos 3 caracteres")
    .max(200, "El caso no puede exceder 200 caracteres"),
  tipo: z
    .string()
    .trim()
    .min(3, "El tipo debe tener al menos 3 caracteres")
    .max(100, "El tipo no puede exceder 100 caracteres"),
  fecha_vencimiento: z.string().refine((date) => {
    const d = new Date(date);
    return d >= new Date(new Date().setHours(0, 0, 0, 0));
  }, "La fecha de vencimiento debe ser hoy o en el futuro"),
  prioridad: z
    .string()
    .refine((val) => ["baja", "media", "alta", "urgente"].includes(val), "Prioridad inválida"),
  case_id: z.string().uuid("ID de caso inválido").optional().nullable(),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  numero_factura: z
    .string()
    .trim()
    .min(3, "El número de factura debe tener al menos 3 caracteres")
    .max(100, "El número de factura no puede exceder 100 caracteres"),
  client_id: z.string().uuid("ID de cliente inválido"),
  concepto: z
    .string()
    .trim()
    .min(3, "El concepto debe tener al menos 3 caracteres")
    .max(1000, "El concepto no puede exceder 1000 caracteres"),
  monto: z
    .number()
    .positive("El monto debe ser mayor a 0")
    .max(999999999, "El monto es demasiado grande"),
  fecha: z.string().refine((date) => !isNaN(Date.parse(date)), "Fecha inválida"),
  estado: z
    .string()
    .refine(
      (val) => ["pendiente", "parcial", "pagado", "vencido", "cancelado"].includes(val),
      "Estado de factura inválido"
    ),
});

// Legal document validation schema
export const legalDocumentSchema = z.object({
  tipo_documento: z
    .string()
    .trim()
    .min(3, "El tipo de documento debe tener al menos 3 caracteres")
    .max(100, "El tipo de documento no puede exceder 100 caracteres"),
  materia: z
    .string()
    .trim()
    .min(3, "La materia debe tener al menos 3 caracteres")
    .max(100, "La materia no puede exceder 100 caracteres"),
  titulo: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(300, "El título no puede exceder 300 caracteres"),
  contenido: z
    .string()
    .trim()
    .min(10, "El contenido debe tener al menos 10 caracteres")
    .max(100000, "El contenido no puede exceder 100000 caracteres"),
  hechos: z
    .string()
    .trim()
    .min(10, "Los hechos deben tener al menos 10 caracteres")
    .max(10000, "Los hechos no pueden exceder 10000 caracteres"),
  pretension: z
    .string()
    .trim()
    .min(10, "La pretensión debe tener al menos 10 caracteres")
    .max(5000, "La pretensión no puede exceder 5000 caracteres"),
  demandante_nombre: z
    .string()
    .trim()
    .max(200, "El nombre del demandante no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  demandado_nombre: z
    .string()
    .trim()
    .max(200, "El nombre del demandado no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  juzgado: z
    .string()
    .trim()
    .max(200, "El juzgado no puede exceder 200 caracteres")
    .optional()
    .or(z.literal("")),
  numero_expediente: z
    .string()
    .trim()
    .max(100, "El número de expediente no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
});

// Edge function validation schemas
export const generateLegalDocSchema = z.object({
  tipo_documento: z.string().min(1, "Tipo de documento requerido"),
  materia: z.string().min(1, "Materia requerida"),
  hechos: z
    .string()
    .min(10, "Los hechos deben tener al menos 10 caracteres")
    .max(10000, "Los hechos no pueden exceder 10000 caracteres"),
  pretension: z
    .string()
    .min(10, "La pretensión debe tener al menos 10 caracteres")
    .max(5000, "La pretensión no puede exceder 5000 caracteres"),
  demandante: z.object({
    nombre: z.string().max(200).optional(),
    nacionalidad: z.string().max(100).optional(),
    edad: z.string().max(3).optional(),
    estado_civil: z.string().max(50).optional(),
    cedula: z.string().max(50).optional(),
    domicilio: z.string().max(500).optional(),
  }),
  abogado: z.object({
    nombre: z.string().max(200).optional(),
    cedula: z.string().max(50).optional(),
    matricula: z.string().max(50).optional(),
    direccion: z.string().max(500).optional(),
    telefono: z.string().max(20).optional(),
    email: z.string().max(255).optional(),
  }),
  demandado: z.object({
    nombre: z.string().max(200).optional(),
    domicilio: z.string().max(500).optional(),
    cargo: z.string().max(200).optional(),
  }),
  juzgado: z.string().max(200).optional(),
  numero_expediente: z.string().max(100).optional(),
  legislacion: z.string().max(5000).optional(),
  jurisprudencia: z.string().max(5000).optional(),
});

export const jurisprudenceSearchSchema = z.object({
  materia: z.string().min(1, "Materia requerida").max(100),
  keywords: z.string().min(1, "Palabras clave requeridas").max(500),
  limit: z.number().min(1).max(50).default(10),
});

export const transcribeAudioSchema = z.object({
  audio: z.string().min(1, "Audio requerido"),
  mimeType: z
    .string()
    .regex(/^audio\/(mp3|mpeg|wav|webm|ogg)$/, "Tipo de audio no soportado")
    .optional(),
});

// Password strength calculator
export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (!password) return { score: 0, label: "Muy débil", color: "bg-red-500" };

  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Complexity
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Scoring
  if (score < 3) return { score, label: "Muy débil", color: "bg-red-500" };
  if (score < 5) return { score, label: "Débil", color: "bg-orange-500" };
  if (score < 6) return { score, label: "Media", color: "bg-yellow-500" };
  if (score < 7) return { score, label: "Fuerte", color: "bg-green-500" };
  return { score, label: "Muy fuerte", color: "bg-emerald-500" };
}
