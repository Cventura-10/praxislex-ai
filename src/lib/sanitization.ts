/**
 * Input sanitization utilities for PraxisLex
 * Prevents XSS, injection attacks, and data corruption
 */

/**
 * Remove HTML tags from string to prevent XSS
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .trim();
}

/**
 * Sanitize string for safe display (remove HTML but keep formatting)
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Sanitize input for SQL-like operations (though we use RLS)
 */
export function sanitizeForDatabase(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/['";\\]/g, '') // Remove SQL special chars
    .slice(0, 10000); // Max length
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'file';
  
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
    .replace(/\.{2,}/g, '.') // Prevent directory traversal
    .replace(/^\.+/, '') // No hidden files
    .slice(0, 255); // Max filename length
}

/**
 * Sanitize URL to prevent XSS and open redirects
 */
export function sanitizeURL(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    // Remove javascript: and data: schemes
    if (url.toLowerCase().includes('javascript:') || 
        url.toLowerCase().includes('data:')) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Encode for URL parameters (WhatsApp, email, etc.)
 */
export function encodeForURL(text: string): string {
  if (!text) return '';
  
  return encodeURIComponent(
    sanitizeText(text).slice(0, 2000) // Limit length for URLs
  );
}

/**
 * Sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  return phone
    .replace(/[^\d+()-\s]/g, '') // Only allow digits, +, (), -, space
    .trim()
    .slice(0, 20);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._+-]/g, '')
    .slice(0, 255);
}

/**
 * Sanitize cedula/RNC
 */
export function sanitizeCedula(cedula: string): string {
  if (!cedula) return '';
  
  return cedula
    .replace(/[^\d-]/g, '') // Only digits and dashes
    .trim()
    .slice(0, 20);
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(value: string | number): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  
  if (isNaN(num) || !isFinite(num)) return null;
  
  return num;
}

/**
 * Sanitize amount (money) - max 2 decimals
 */
export function sanitizeAmount(value: string | number): number | null {
  const num = sanitizeNumber(value);
  
  if (num === null) return null;
  
  // Round to 2 decimals and ensure positive
  return Math.max(0, Math.round(num * 100) / 100);
}

/**
 * Escape special regex characters in user input
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate and sanitize date string
 */
export function sanitizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    // Return ISO format
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize time string (HH:MM)
 */
export function sanitizeTime(timeStr: string): string | null {
  if (!timeStr) return null;
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const cleaned = timeStr.trim();
  
  if (!timeRegex.test(cleaned)) return null;
  
  return cleaned;
}

/**
 * Truncate text to max length safely (don't cut words)
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Remove null bytes that could cause issues
 */
export function removeNullBytes(str: string): string {
  return str.replace(/\0/g, '');
}

/**
 * Normalize whitespace
 */
export function normalizeWhitespace(str: string): string {
  return str
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
}

/**
 * Check if string contains only safe characters for names
 */
export function isSafeName(name: string): boolean {
  // Allow letters (including accented), spaces, hyphens, apostrophes
  const safeNameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/;
  return safeNameRegex.test(name);
}

/**
 * Check if string contains potentially dangerous patterns
 */
export function containsDangerousPatterns(str: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /data:text\/html/i,
    /<iframe/i,
    /eval\(/i,
    /expression\(/i, // CSS expression
    /import\s/i, // ES6 imports in strings
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(str));
}

/**
 * Sanitize object by applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeText(value) as T[keyof T];
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value);
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

/**
 * Rate limit checker (client-side, for UI feedback)
 * Server-side rate limiting should be implemented separately
 */
const rateLimitMap = new Map<string, number[]>();

export function checkClientRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remainingMs: number } {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  
  // Filter timestamps within window
  const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);
  
  if (recentTimestamps.length >= maxRequests) {
    const oldestTimestamp = Math.min(...recentTimestamps);
    const remainingMs = windowMs - (now - oldestTimestamp);
    
    return { allowed: false, remainingMs };
  }
  
  // Add current timestamp
  recentTimestamps.push(now);
  rateLimitMap.set(key, recentTimestamps);
  
  return { allowed: true, remainingMs: 0 };
}

/**
 * Clear rate limit for a key (e.g., after successful auth)
 */
export function clearRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
