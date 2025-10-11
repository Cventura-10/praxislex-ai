/**
 * Data masking utilities for sensitive PII
 * SECURITY: These functions provide client-side masking only
 * Server-side validation and encryption is still required
 */

/**
 * Mask email address, showing only first 2 characters and domain
 */
export const maskEmail = (email: string): string => {
  if (!email) return '';
  
  // Basic validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return email; // Return as-is if invalid format
  }
  
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const visibleChars = Math.min(3, local.length);
  return `${local.substring(0, visibleChars)}***@${domain}`;
};

/**
 * Mask phone number, showing only last 4 digits
 */
export const maskPhone = (phone: string): string => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***';
  
  return `***-***-${cleaned.slice(-4)}`;
};

/**
 * Mask cedula/RNC, showing only last 4 digits
 */
export const maskCedula = (cedula: string): string => {
  if (!cedula) return '';
  
  const cleaned = cedula.replace(/\D/g, '');
  if (cleaned.length < 4) return '***';
  
  return `***-***-${cleaned.slice(-4)}`;
};

/**
 * Mask address, showing only last 10 characters
 */
export const maskAddress = (address: string): string => {
  if (!address) return '';
  
  if (address.length <= 10) return '***';
  
  return '***' + address.slice(-10);
};
