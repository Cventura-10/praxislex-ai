/**
 * Error Sanitization Utility for Edge Functions
 * 
 * Prevents information leakage by returning safe error messages to clients
 * while logging full details server-side for debugging.
 */

interface ErrorMapping {
  pattern: string;
  message: string;
}

const ERROR_MAPPINGS: ErrorMapping[] = [
  { pattern: 'Template not found', message: 'La plantilla solicitada no existe' },
  { pattern: 'Permission denied', message: 'No tiene permisos para esta acción' },
  { pattern: 'Invalid input', message: 'Los datos proporcionados son inválidos' },
  { pattern: 'LOVABLE_API_KEY not configured', message: 'Servicio temporalmente no disponible' },
  { pattern: 'RESEND_API_KEY', message: 'Servicio de correo no disponible' },
  { pattern: 'OPENAI_API_KEY', message: 'Servicio de transcripción no disponible' },
  { pattern: 'not found', message: 'Recurso no encontrado' },
  { pattern: 'unauthorized', message: 'No autorizado' },
  { pattern: 'forbidden', message: 'Acceso denegado' },
  { pattern: 'validation failed', message: 'Error de validación de datos' },
  { pattern: 'database', message: 'Error en la base de datos' },
  { pattern: 'timeout', message: 'La operación tardó demasiado tiempo' },
];

export function sanitizeError(error: unknown, context: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Log full error details server-side for debugging
  console.error(`[${context}] Error:`, {
    message: errorMessage,
    stack,
    timestamp: new Date().toISOString(),
  });

  // Check for known patterns and return safe messages
  for (const mapping of ERROR_MAPPINGS) {
    if (errorMessage.toLowerCase().includes(mapping.pattern.toLowerCase())) {
      return mapping.message;
    }
  }

  // Generic error for unknown issues
  return 'Ocurrió un error procesando su solicitud. Por favor, contacte al soporte si el problema persiste.';
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
