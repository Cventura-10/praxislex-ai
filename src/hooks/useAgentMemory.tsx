import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AgentSuggestion {
  value: any;
  confidence: number;
  source: 'pattern' | 'ai';
}

interface SuggestResponse {
  success: boolean;
  suggestions: Record<string, AgentSuggestion>;
  ai_guidance?: string;
  patterns_used: number;
}

interface RememberResponse {
  success: boolean;
  message?: string;
  patterns_saved?: number;
}

export const useAgentMemory = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Obtener sugerencias inteligentes basadas en patrones previos
   */
  const suggest = async (
    actSlug: string,
    partialFormData?: Record<string, any>
  ): Promise<SuggestResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-memory', {
        body: {
          action: 'suggest',
          act_slug: actSlug,
          partialFormData: partialFormData || {}
        }
      });

      if (error) {
        console.error('[useAgentMemory] Error getting suggestions:', error);
        toast({
          title: 'Error al obtener sugerencias',
          description: 'No se pudieron cargar sugerencias automáticas',
          variant: 'destructive'
        });
        return null;
      }

      if (data?.success) {
        console.log(`[useAgentMemory] Got ${data.patterns_used} pattern-based suggestions`);
        return data as SuggestResponse;
      }

      return null;
    } catch (err) {
      console.error('[useAgentMemory] Unexpected error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Guardar patrones de uso después de generar un acto
   */
  const remember = async (
    actSlug: string,
    formData: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('agent-memory', {
        body: {
          action: 'remember',
          act_slug: actSlug,
          formData,
          metadata: metadata || {}
        }
      });

      if (error) {
        console.error('[useAgentMemory] Error saving patterns:', error);
        return false;
      }

      if (data?.success) {
        console.log(`[useAgentMemory] Saved ${data.patterns_saved || 0} patterns`);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useAgentMemory] Unexpected error saving:', err);
      return false;
    }
  };

  return {
    suggest,
    remember,
    isLoading
  };
};
