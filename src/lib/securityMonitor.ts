/**
 * Security Monitoring and Logging
 * Tracks security events and potential threats
 */

import { supabase } from '@/integrations/supabase/client';

export type SecurityEventType =
  | 'failed_login'
  | 'rate_limit_exceeded'
  | 'invalid_input'
  | 'unauthorized_access'
  | 'suspicious_activity'
  | 'xss_attempt'
  | 'sql_injection_attempt';

interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: Record<string, any>;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 100;

  /**
   * Log a security event
   */
  async logEvent(event: SecurityEvent): Promise<void> {
    // Add to in-memory log
    this.events.push({
      ...event,
      metadata: {
        ...event.metadata,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
    });

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      const emoji = event.severity === 'critical' ? '🚨' :
                    event.severity === 'high' ? '⚠️' :
                    event.severity === 'medium' ? '⚡' : 'ℹ️';
      console.warn(`${emoji} [Security] ${event.type}:`, event.message, event.metadata);
    }

    // For critical events, attempt to log to database
    if (event.severity === 'critical' || event.severity === 'high') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('data_access_audit').insert({
            user_id: user.id,
            table_name: 'security_events',
            action: event.type,
            record_id: crypto.randomUUID(),
          });
        }
      } catch (error) {
        console.error('Failed to log security event to database:', error);
      }
    }
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Check for suspicious patterns
   */
  detectSuspiciousActivity(): boolean {
    const recentEvents = this.events.slice(-20);
    const criticalCount = recentEvents.filter(e => e.severity === 'critical').length;
    const highCount = recentEvents.filter(e => e.severity === 'high').length;

    // More than 3 critical or 5 high severity events in recent history
    return criticalCount > 3 || highCount > 5;
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor();

/**
 * Helper function to detect potential XSS in input
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /eval\s*\(/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Helper function to detect potential SQL injection
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
    /(--|\#|\/\*)/g, // SQL comments
    /';/g,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize input with security monitoring
 */
export async function validateSecureInput(input: string, fieldName: string): Promise<string> {
  // Check for XSS
  if (detectXSS(input)) {
    await securityMonitor.logEvent({
      type: 'xss_attempt',
      severity: 'high',
      message: `Potential XSS detected in ${fieldName}`,
      metadata: { input: input.substring(0, 100) },
    });
    throw new Error('Invalid input detected');
  }

  // Check for SQL injection
  if (detectSQLInjection(input)) {
    await securityMonitor.logEvent({
      type: 'sql_injection_attempt',
      severity: 'critical',
      message: `Potential SQL injection detected in ${fieldName}`,
      metadata: { input: input.substring(0, 100) },
    });
    throw new Error('Invalid input detected');
  }

  return input.trim();
}
