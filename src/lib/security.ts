/**
 * Security utilities for PraxisLex
 * Includes audit logging, integrity verification, and secure operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface AuditEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  action: string;
  payload_hash: string;
  changes: any; // JSONB from database
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Log an audit event for a sensitive operation
 */
export async function logAuditEvent(
  entityType: string,
  entityId: string,
  action: string,
  changes?: Record<string, any>
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_action: action,
      p_changes: changes || null,
      p_ip_address: null, // TODO: Get from request headers in production
      p_user_agent: navigator.userAgent
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Failed to log audit event:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Verify the integrity of an audit event
 */
export async function verifyAuditIntegrity(eventId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('verify_audit_integrity', {
      p_event_id: eventId
    });

    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error('Failed to verify audit integrity:', error);
    return false;
  }
}

/**
 * Fetch audit events for a specific entity
 */
export async function getAuditEvents(
  entityType: string,
  entityId: string,
  limit = 50
): Promise<{ data: AuditEvent[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('events_audit')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as AuditEvent[], error: null };
  } catch (error) {
    console.error('Failed to fetch audit events:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get recent audit events for the current user's actions
 */
export async function getMyAuditEvents(limit = 100): Promise<{
  data: AuditEvent[] | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('events_audit')
      .select('*')
      .eq('actor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data as AuditEvent[], error: null };
  } catch (error) {
    console.error('Failed to fetch user audit events:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Sanitize sensitive data before logging
 */
export function sanitizeForAudit(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  
  // Remove or mask sensitive fields
  const sensitiveFields = [
    'password',
    'cedula',
    'cedula_rnc',
    'cedula_rnc_encrypted',
    'telefono',
    'email',
    'direccion'
  ];

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Generate a secure hash of data (client-side verification)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if current user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
}
