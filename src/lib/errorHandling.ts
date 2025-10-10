/**
 * Security utility to sanitize error messages before displaying to users
 * Prevents information leakage about database schema, constraints, and internal structure
 */

/**
 * Sanitizes database error messages to prevent information disclosure
 * Logs full errors server-side for debugging while showing safe messages to users
 * 
 * @param error - The error object from database operations
 * @returns User-friendly error message that doesn't leak internal details
 */
export const sanitizeErrorMessage = (error: any): string => {
  const errorMsg = error?.message || 'Error desconocido';
  
  // Log full error details for debugging (server-side logging)
  console.error('Database operation error:', {
    message: errorMsg,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });
  
  // Map technical database errors to user-friendly messages
  // This prevents leaking table names, column names, constraint names, etc.
  
  if (errorMsg.includes('violates foreign key') || errorMsg.includes('foreign key constraint')) {
    return 'Referencia inválida a datos relacionados';
  }
  
  if (errorMsg.includes('not-null constraint') || errorMsg.includes('null value')) {
    return 'Faltan campos requeridos para completar la operación';
  }
  
  if (errorMsg.includes('row-level security') || errorMsg.includes('RLS') || errorMsg.includes('policy')) {
    return 'No tiene permisos para realizar esta acción';
  }
  
  if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
    return 'Ya existe un registro con estos datos';
  }
  
  if (errorMsg.includes('check constraint')) {
    return 'Los datos no cumplen con los requisitos de validación';
  }
  
  if (errorMsg.includes('invalid input syntax') || errorMsg.includes('invalid text representation')) {
    return 'Formato de datos inválido';
  }
  
  if (errorMsg.includes('permission denied') || errorMsg.includes('insufficient privilege')) {
    return 'No tiene permisos suficientes para esta operación';
  }
  
  if (errorMsg.includes('authentication') || errorMsg.includes('JWT')) {
    return 'Sesión expirada. Por favor, inicie sesión nuevamente';
  }
  
  if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
    return 'Error de conexión. Verifique su conexión a internet';
  }
  
  // Generic safe error message for any unmatched error
  return 'Error al procesar la solicitud. Si el problema persiste, contacte soporte';
};
