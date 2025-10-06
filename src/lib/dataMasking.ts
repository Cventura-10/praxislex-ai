/**
 * Data masking utilities for sensitive PII
 */

export const maskEmail = (email: string): string => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visibleChars = Math.min(3, local.length);
  return `${local.substring(0, visibleChars)}***@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***';
  return `***-***-${cleaned.slice(-4)}`;
};

export const maskCedula = (cedula: string): string => {
  if (!cedula) return '';
  const cleaned = cedula.replace(/\D/g, '');
  if (cleaned.length < 4) return '***';
  return `***-***-${cleaned.slice(-4)}`;
};
