/**
 * Analytics calculation utilities
 * Provides functions for KPI calculations and data aggregation
 */

// KPI Calculations

export function calculateSuccessRate(cases: any[]): number {
  if (!cases || cases.length === 0) return 0;
  
  const closedCases = cases.filter(c => c.estado === 'cerrado');
  if (closedCases.length === 0) return 0;
  
  // Consider 'ganado' cases as successful
  const wonCases = closedCases.filter(c => 
    c.descripcion?.toLowerCase().includes('ganado') ||
    c.descripcion?.toLowerCase().includes('favorable')
  );
  
  return Math.round((wonCases.length / closedCases.length) * 100);
}

export function calculateAverageCaseDuration(cases: any[]): number {
  if (!cases || cases.length === 0) return 0;
  
  const closedCases = cases.filter(c => c.estado === 'cerrado');
  if (closedCases.length === 0) return 0;
  
  const totalDays = closedCases.reduce((sum, c) => {
    const start = new Date(c.created_at);
    const end = new Date(c.updated_at);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0);
  
  return Math.round(totalDays / closedCases.length);
}

export function calculateClientProfitability(
  clientId: string,
  invoices: any[],
  expenses: any[]
): number {
  const revenue = invoices
    .filter(i => i.client_id === clientId && i.estado === 'pagado')
    .reduce((sum, i) => sum + (Number(i.monto) || 0), 0);
    
  const costs = expenses
    .filter(e => e.client_id === clientId)
    .reduce((sum, e) => sum + (Number(e.monto) || 0), 0);
    
  return revenue - costs;
}

export function calculateARaging(invoices: any[]) {
  const today = new Date();
  const unpaidInvoices = invoices.filter(i => 
    i.estado === 'pendiente' || i.estado === 'vencido'
  );
  
  function getDaysOverdue(invoiceDate: string): number {
    const date = new Date(invoiceDate);
    const diff = today.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  
  return {
    current: unpaidInvoices
      .filter(i => getDaysOverdue(i.fecha) <= 0)
      .reduce((sum, i) => sum + (Number(i.monto) || 0), 0),
    
    overdue30: unpaidInvoices
      .filter(i => {
        const days = getDaysOverdue(i.fecha);
        return days > 0 && days <= 30;
      })
      .reduce((sum, i) => sum + (Number(i.monto) || 0), 0),
    
    overdue60: unpaidInvoices
      .filter(i => {
        const days = getDaysOverdue(i.fecha);
        return days > 30 && days <= 60;
      })
      .reduce((sum, i) => sum + (Number(i.monto) || 0), 0),
    
    overdue90: unpaidInvoices
      .filter(i => getDaysOverdue(i.fecha) > 60)
      .reduce((sum, i) => sum + (Number(i.monto) || 0), 0),
  };
}

// Trend Calculations

export function calculateMonthlyTrend(
  data: any[],
  dateField: string,
  valueField: string,
  months: number = 12
) {
  const result: { month: string; value: number }[] = [];
  const today = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString('es-DO', { month: 'short', year: 'numeric' });
    
    const monthData = data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate.getMonth() === date.getMonth() && 
             itemDate.getFullYear() === date.getFullYear();
    });
    
    const value = monthData.reduce((sum, item) => sum + (Number(item[valueField]) || 0), 0);
    
    result.push({ month: monthKey, value });
  }
  
  return result;
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Aggregations

export function groupByField<T>(
  data: T[],
  field: keyof T,
  valueField?: keyof T
): { name: string; value: number }[] {
  const grouped = data.reduce((acc, item) => {
    const key = String(item[field]);
    if (!acc[key]) {
      acc[key] = { name: key, value: 0, count: 0 };
    }
    acc[key].count++;
    if (valueField) {
      acc[key].value += Number(item[valueField]) || 0;
    }
    return acc;
  }, {} as Record<string, { name: string; value: number; count: number }>);
  
  return Object.values(grouped).map(g => ({
    name: g.name,
    value: valueField ? g.value : g.count,
  }));
}

export function topN<T>(
  data: { name: string; value: number }[],
  n: number = 5
): { name: string; value: number }[] {
  return data
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

// Financial Calculations

export function calculateNetProfit(revenue: number, expenses: number): number {
  return revenue - expenses;
}

export function calculateProfitMargin(revenue: number, expenses: number): number {
  if (revenue === 0) return 0;
  return Math.round(((revenue - expenses) / revenue) * 100);
}

export function calculateROI(profit: number, investment: number): number {
  if (investment === 0) return 0;
  return Math.round((profit / investment) * 100);
}

// Formatting Utilities

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-DO').format(value);
}

// Period Helpers

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom', customRange?: DateRange): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
      };
      
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return {
        start: weekStart,
        end: today,
      };
      
    case 'month':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today,
      };
      
    case 'quarter':
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      return {
        start: quarterStart,
        end: today,
      };
      
    case 'year':
      return {
        start: new Date(today.getFullYear(), 0, 1),
        end: today,
      };
      
    case 'custom':
      return customRange || { start: today, end: today };
      
    default:
      return { start: today, end: today };
  }
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  
  return {
    start: new Date(range.start.getTime() - duration),
    end: new Date(range.end.getTime() - duration),
  };
}

// Alert Generation

export interface Alert {
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
}

export function generateAlerts(data: {
  cashFlow: number;
  arOverdue90: number;
  successRate: number;
  activeCases: number;
}): Alert[] {
  const alerts: Alert[] = [];
  
  // Low cash flow alert
  if (data.cashFlow < 0) {
    alerts.push({
      type: 'danger',
      title: 'Flujo de caja negativo',
      message: `El flujo de caja es negativo: ${formatCurrency(data.cashFlow)}`,
      action: '/contabilidad',
    });
  }
  
  // High AR aging alert
  if (data.arOverdue90 > 50000) {
    alerts.push({
      type: 'warning',
      title: 'Cuentas por cobrar vencidas',
      message: `Hay ${formatCurrency(data.arOverdue90)} con más de 90 días vencidos`,
      action: '/facturacion',
    });
  }
  
  // Case success rate alert
  if (data.successRate < 70 && data.activeCases > 5) {
    alerts.push({
      type: 'warning',
      title: 'Tasa de éxito baja',
      message: `La tasa de éxito de casos es ${data.successRate}%`,
      action: '/casos',
    });
  }
  
  // High performance alert
  if (data.successRate >= 90 && data.activeCases > 10) {
    alerts.push({
      type: 'success',
      title: '¡Excelente desempeño!',
      message: `Tasa de éxito de ${data.successRate}% con ${data.activeCases} casos activos`,
    });
  }
  
  return alerts;
}
