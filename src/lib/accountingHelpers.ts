import { z } from "zod";
import { paymentSchema, expenseSchema, clientCreditSchema } from "./validation";

/**
 * Helper functions for accounting operations
 */

/**
 * Validate and transform payment data
 */
export const validatePayment = (data: any) => {
  const paymentData = {
    ...data,
    monto: parseFloat(data.monto),
    client_id: data.client_id || null,
    invoice_id: data.invoice_id || null,
    fecha: data.fecha || new Date().toISOString().split('T')[0],
  };

  const result = paymentSchema.safeParse(paymentData);
  
  if (!result.success) {
    const errors = result.error.issues;
    throw new Error(errors.map(err => `• ${err.message}`).join('\n'));
  }

  return result.data;
};

/**
 * Validate and transform expense data
 */
export const validateExpense = (data: any) => {
  const expenseData = {
    ...data,
    monto: parseFloat(data.monto),
    client_id: data.client_id || null,
    case_id: data.case_id || null,
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    reembolsable: data.reembolsable !== undefined ? data.reembolsable : true,
  };

  const result = expenseSchema.safeParse(expenseData);
  
  if (!result.success) {
    const errors = result.error.issues;
    throw new Error(errors.map(err => `• ${err.message}`).join('\n'));
  }

  return result.data;
};

/**
 * Validate and transform client credit/debit data
 */
export const validateClientCredit = (data: any) => {
  const creditData = {
    ...data,
    monto: parseFloat(data.monto),
    client_id: data.client_id || null,
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    interes: data.interes ? parseFloat(data.interes) : 0,
  };

  const result = clientCreditSchema.safeParse(creditData);
  
  if (!result.success) {
    const errors = result.error.issues;
    throw new Error(errors.map(err => `• ${err.message}`).join('\n'));
  }

  return result.data;
};

/**
 * Calculate ITBIS (18% tax in Dominican Republic)
 */
export const calculateITBIS = (amount: number): number => {
  return Number((amount * 0.18).toFixed(2));
};

/**
 * Calculate total amount including ITBIS and interest
 */
export const calculateTotalAmount = (
  baseAmount: number,
  includeITBIS: boolean = false,
  interestAmount: number = 0
): number => {
  let total = baseAmount;
  
  if (includeITBIS) {
    total += calculateITBIS(baseAmount);
  }
  
  if (interestAmount > 0) {
    total += interestAmount;
  }
  
  return Number(total.toFixed(2));
};

/**
 * Format currency for Dominican Republic (DOP)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(amount);
};

/**
 * Format date for Dominican Republic
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Generate client account statement
 */
export interface TransactionItem {
  type: 'invoice' | 'credit' | 'debit' | 'payment';
  fecha: string;
  concepto: string;
  debito: number;
  credito: number;
  referencia: string;
  saldo?: number;
}

export const generateAccountStatement = (
  invoices: any[],
  credits: any[],
  payments: any[]
): TransactionItem[] => {
  const statement: TransactionItem[] = [];
  let runningBalance = 0;

  // Combine all transactions
  const allTransactions: TransactionItem[] = [
    // Invoices (debits - increase balance)
    ...(invoices || []).map(inv => ({
      type: 'invoice' as const,
      fecha: inv.fecha,
      concepto: `Factura ${inv.numero_factura} - ${inv.concepto}`,
      debito: inv.monto,
      credito: 0,
      referencia: inv.numero_factura,
    })),
    // Credits from client_credits
    ...(credits || []).map(cred => ({
      type: cred.tipo === 'debito' ? ('debit' as const) : ('credit' as const),
      fecha: cred.fecha,
      concepto: cred.concepto,
      debito: cred.tipo === 'debito' ? cred.monto : 0,
      credito: cred.tipo === 'credito' ? cred.monto : 0,
      referencia: cred.referencia || '',
    })),
    // Payments (credits - decrease balance)
    ...(payments || []).map(pay => ({
      type: 'payment' as const,
      fecha: pay.fecha,
      concepto: `Pago - ${pay.concepto}`,
      debito: 0,
      credito: pay.monto,
      referencia: pay.referencia || '',
    })),
  ];

  // Sort by date
  allTransactions.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Calculate running balance
  allTransactions.forEach(trans => {
    runningBalance += trans.debito - trans.credito;
    statement.push({
      ...trans,
      saldo: runningBalance,
    });
  });

  return statement;
};

/**
 * Validate required fields in a form
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } => {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Safe number parsing with fallback
 */
export const safeParseNumber = (value: any, fallback: number = 0): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};
