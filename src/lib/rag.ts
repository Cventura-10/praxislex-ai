/**
 * RAG (Retrieval-Augmented Generation) utilities for PraxisLex
 * Semantic search, embeddings, and citation management
 */

import { supabase } from "@/integrations/supabase/client";

export interface JurisprudenceResult {
  id: string;
  titulo: string;
  materia: string;
  tribunal: string | null;
  numero_sentencia: string | null;
  fecha_sentencia: string | null;
  url_fuente: string | null;
  contenido: string;
  resumen: string | null;
  similarity: number;
}

export interface AIUsageSummary {
  total_tokens: number;
  total_cost: number;
  operations_count: number;
  by_operation: Record<string, {
    count: number;
    tokens: number;
    cost: number;
  }>;
}

/**
 * Search jurisprudence using semantic similarity
 */
export async function searchJurisprudenceRAG(
  query: string,
  options?: {
    materia?: string;
    limit?: number;
    threshold?: number;
  }
): Promise<{ data: JurisprudenceResult[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('search-jurisprudence-rag', {
      body: {
        query,
        materia: options?.materia,
        limit: options?.limit || 5,
        threshold: options?.threshold || 0.7
      }
    });

    if (error) throw error;
    
    return { 
      data: data.results as JurisprudenceResult[], 
      error: null 
    };
  } catch (error) {
    console.error('Failed to search jurisprudence:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Generate embedding for text
 */
export async function generateEmbedding(
  text: string
): Promise<{ data: { embedding: number[]; tokens: number } | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: { text }
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Add jurisprudence with automatic embedding
 */
export async function addJurisprudence(jurisprudence: {
  titulo: string;
  materia: string;
  tribunal?: string;
  sala?: string;
  numero_sentencia?: string;
  fecha_sentencia?: string;
  url_fuente?: string;
  contenido: string;
  resumen?: string;
  tags?: string[];
}): Promise<{ data: any; error: Error | null }> {
  try {
    // Generate embedding
    const { data: embeddingData, error: embeddingError } = await generateEmbedding(
      `${jurisprudence.titulo}\n\n${jurisprudence.resumen || jurisprudence.contenido.substring(0, 500)}`
    );

    if (embeddingError) throw embeddingError;

    // Insert with embedding
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('jurisprudence_embeddings')
      .insert({
        ...jurisprudence,
        user_id: user.id,
        embedding: JSON.stringify(embeddingData!.embedding),
        indexed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Failed to add jurisprudence:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get citations for a legal document
 */
export async function getDocumentCitations(documentId: string) {
  try {
    const { data, error } = await supabase
      .from('document_citations')
      .select(`
        *,
        jurisprudence:jurisprudence_embeddings(
          titulo,
          materia,
          tribunal,
          numero_sentencia,
          fecha_sentencia,
          url_fuente
        )
      `)
      .eq('document_id', documentId)
      .order('position_in_doc', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Failed to fetch citations:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Add citation to a document
 */
export async function addCitation(citation: {
  document_id: string;
  jurisprudence_id: string;
  cited_text: string;
  context_paragraph?: string;
  position_in_doc?: number;
  similarity_score?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('document_citations')
      .insert(citation)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Failed to add citation:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get monthly AI usage for current user
 */
export async function getMonthlyAIUsage(): Promise<{
  data: AIUsageSummary | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.rpc('get_monthly_ai_usage');

    if (error) throw error;
    
    // Parse the aggregated data
    const rawData = data && data.length > 0 ? data[0] : null;
    const summary: AIUsageSummary = {
      total_tokens: rawData?.total_tokens || 0,
      total_cost: rawData?.total_cost || 0,
      operations_count: rawData?.operations_count || 0,
      by_operation: (typeof rawData?.by_operation === 'object' && rawData?.by_operation !== null) 
        ? rawData.by_operation as Record<string, { count: number; tokens: number; cost: number; }>
        : {}
    };

    return { data: summary, error: null };
  } catch (error) {
    console.error('Failed to fetch AI usage:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Anonymize text before sending to LLM
 * Removes PII (names, cedulas, addresses) for privacy
 */
export function anonymizeForLLM(text: string): string {
  let anonymized = text;

  // Remove cédulas (XXX-XXXXXXX-X format)
  anonymized = anonymized.replace(/\d{3}-?\d{7}-?\d{1}/g, '[CEDULA]');

  // Remove phone numbers
  anonymized = anonymized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[TELEFONO]');

  // Remove email addresses
  anonymized = anonymized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');

  // Remove common address patterns (aproximado)
  anonymized = anonymized.replace(/(?:Calle|Av\.|Avenida|C\/)[^,.]+(?:,|\.|$)/gi, '[DIRECCION]');

  return anonymized;
}

/**
 * Format citation for legal document
 */
export function formatCitation(result: JurisprudenceResult): string {
  const parts = [];
  
  if (result.tribunal) parts.push(result.tribunal);
  if (result.numero_sentencia) parts.push(`Sentencia No. ${result.numero_sentencia}`);
  if (result.fecha_sentencia) {
    const date = new Date(result.fecha_sentencia);
    parts.push(date.toLocaleDateString('es-DO'));
  }

  let citation = parts.join(', ');
  
  if (result.url_fuente) {
    citation += `. Disponible en: ${result.url_fuente}`;
  }

  return citation;
}
