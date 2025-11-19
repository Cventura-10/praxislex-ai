import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AIMetrics {
  total_sessions: number;
  avg_confidence: number;
  success_rate: number;
  total_intents: number;
  avg_response_time: number;
  intent_distribution: Array<{
    intent: string;
    count: number;
    avg_confidence: number;
    success_rate: number;
  }>;
  agent_performance: Array<{
    agent_name: string;
    count: number;
    avg_confidence: number;
    success_rate: number;
  }>;
  daily_trend: Array<{
    date: string;
    sessions: number;
    success_rate: number;
  }>;
}

interface UserPattern {
  id: string;
  pattern_type: string;
  pattern_data: any;
  frequency: number;
  occurrences: number;
  last_occurred_at: string;
  last_suggested_at: string | null;
  accepted: boolean | null;
}

export function useAIAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['ai-analytics', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase.rpc('get_ai_os_metrics', {
        p_user_id: user.id,
        p_days: days
      });

      if (error) throw error;
      return data as unknown as AIMetrics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUserPatterns() {
  return useQuery({
    queryKey: ['user-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_user_patterns')
        .select('*')
        .order('frequency', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as UserPattern[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useProactiveSuggestions() {
  return useQuery({
    queryKey: ['proactive-suggestions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase.rpc('get_proactive_suggestions', {
        p_user_id: user.id,
        p_limit: 5
      });

      if (error) throw error;
      return data as unknown as Array<{
        suggestion: string;
        pattern_type: string;
        confidence: number;
      }>;
    },
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
}

export function useClassificationPerformance() {
  return useQuery({
    queryKey: ['classification-performance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase.rpc('analyze_classification_performance', {
        p_user_id: user.id,
        p_days: 30
      });

      if (error) throw error;
      return data as unknown as Array<{
        intent: string;
        total_attempts: number;
        avg_confidence: number;
        success_rate: number;
        avg_response_time_ms: number;
      }>;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
