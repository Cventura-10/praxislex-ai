import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateSuccessRate,
  calculateAverageCaseDuration,
  calculateARaging,
  calculateMonthlyTrend,
  getDateRange,
  DateRange,
} from "@/lib/analytics";

interface AnalyticsData {
  cases: {
    total: number;
    active: number;
    closed: number;
    successRate: number;
    averageDuration: number;
  };
  financial: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    arAging: {
      current: number;
      overdue30: number;
      overdue60: number;
      overdue90: number;
    };
  };
  trends: {
    revenue: { month: string; value: number }[];
    expenses: { month: string; value: number }[];
    cases: { month: string; value: number }[];
  };
}

/**
 * Hook for analytics data and calculations
 * Provides comprehensive analytics for the law firm
 */
export function useAnalytics(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const dateRange = getDateRange(period);

        // Fetch cases
        const { data: cases, error: casesError } = await supabase
          .from('cases')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());

        if (casesError) throw casesError;

        // Fetch invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .gte('fecha', dateRange.start.toISOString().split('T')[0])
          .lte('fecha', dateRange.end.toISOString().split('T')[0]);

        if (invoicesError) throw invoicesError;

        // Fetch expenses
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('fecha', dateRange.start.toISOString().split('T')[0])
          .lte('fecha', dateRange.end.toISOString().split('T')[0]);

        if (expensesError) throw expensesError;

        // Calculate metrics
        const totalRevenue = invoices
          ?.filter(i => i.estado === 'pagado')
          .reduce((sum, i) => sum + (Number(i.monto) || 0), 0) || 0;

        const totalExpenses = expenses
          ?.reduce((sum, e) => sum + (Number(e.monto) || 0), 0) || 0;

        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 
          ? Math.round((netProfit / totalRevenue) * 100) 
          : 0;

        const analyticsData: AnalyticsData = {
          cases: {
            total: cases?.length || 0,
            active: cases?.filter(c => c.estado === 'activo').length || 0,
            closed: cases?.filter(c => c.estado === 'cerrado').length || 0,
            successRate: calculateSuccessRate(cases || []),
            averageDuration: calculateAverageCaseDuration(cases || []),
          },
          financial: {
            totalRevenue,
            totalExpenses,
            netProfit,
            profitMargin,
            arAging: calculateARaging(invoices || []),
          },
          trends: {
            revenue: calculateMonthlyTrend(invoices || [], 'fecha', 'monto', 12),
            expenses: calculateMonthlyTrend(expenses || [], 'fecha', 'monto', 12),
            cases: calculateMonthlyTrend(cases || [], 'created_at', 'id', 12),
          },
        };

        setData(analyticsData);
      } catch (err) {
        console.error('Analytics error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [period]);

  return { data, loading, error };
}
