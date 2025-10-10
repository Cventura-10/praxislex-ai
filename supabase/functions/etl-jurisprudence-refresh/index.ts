import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting jurisprudence embeddings refresh...');

    // Get all jurisprudence without embeddings or outdated
    const { data: jurisprudence, error: fetchError } = await supabaseClient
      .from('jurisprudence_embeddings')
      .select('id, titulo, contenido, resumen')
      .or('embedding.is.null,indexed_at.lt.' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    if (fetchError) throw fetchError;

    if (!jurisprudence || jurisprudence.length === 0) {
      console.log('No jurisprudence to refresh');
      return new Response(
        JSON.stringify({ message: 'No jurisprudence to refresh', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${jurisprudence.length} jurisprudence entries to refresh`);

    let successCount = 0;
    let errorCount = 0;

    // Process each entry
    for (const entry of jurisprudence) {
      try {
        // Generate embedding using Lovable AI
        const embeddingText = `${entry.titulo}\n\n${entry.resumen || entry.contenido.substring(0, 500)}`;
        
        const { data: embeddingData, error: embeddingError } = await supabaseClient.functions.invoke(
          'generate-embedding',
          { body: { text: embeddingText } }
        );

        if (embeddingError) throw embeddingError;

        // Update with new embedding
        const { error: updateError } = await supabaseClient
          .from('jurisprudence_embeddings')
          .update({
            embedding: JSON.stringify(embeddingData.embedding),
            indexed_at: new Date().toISOString()
          })
          .eq('id', entry.id);

        if (updateError) throw updateError;

        successCount++;
        console.log(`Refreshed embedding for: ${entry.titulo}`);
      } catch (error) {
        console.error(`Error processing ${entry.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Refresh complete: ${successCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        message: 'Jurisprudence refresh complete',
        processed: jurisprudence.length,
        successful: successCount,
        errors: errorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('ETL error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
