import { PostgrestError } from '@supabase/supabase-js';

/**
 * Enhanced error for Supabase operations
 */
export class SupabaseError extends Error {
  code: string;
  details: string | null;
  hint: string | null;
  
  constructor(error: PostgrestError) {
    const message = `[Supabase Error ${error.code}] ${error.message}`;
    super(message);
    this.name = 'SupabaseError';
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

/**
 * Helper to throw enriched errors from Supabase responses
 * Usage: const data = must(await supabase.from('table').select())
 */
export function must<T>(response: { data: T | null; error: PostgrestError | null }): T {
  if (response.error) {
    throw new SupabaseError(response.error);
  }
  
  if (response.data === null) {
    throw new Error('Supabase returned null data without error');
  }
  
  return response.data;
}
