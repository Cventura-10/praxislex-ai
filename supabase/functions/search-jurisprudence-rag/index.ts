import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { query, materia, limit = 5, threshold = 0.7 } = await req.json();
    
    if (!query) {
      throw new Error('Query text is required');
    }

    console.log('Searching jurisprudence for:', query);

    // Get user from auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check rate limit: 5/min, 50/hour (expensive vector search)
    const { data: rateLimitOk } = await supabaseClient.rpc('check_edge_function_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'search-jurisprudence-rag',
      p_max_per_minute: 5,
      p_max_per_hour: 50,
    });
    
    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Límite de tasa excedido. Intente más tarde.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding for query
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate query embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;
    const tokensUsed = embeddingData.usage.total_tokens;

    console.log('Query embedding generated, searching...');

    // Search using vector similarity
    const { data: results, error } = await supabaseClient.rpc('search_jurisprudence', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: limit,
      filter_materia: materia || null,
      filter_user_id: user.id
    });

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    console.log(`Found ${results?.length || 0} relevant jurisprudence entries`);

    // Track usage
    await supabaseClient.from('ai_usage').insert({
      user_id: user.id,
      operation_type: 'search',
      model_used: 'text-embedding-3-small',
      tokens_used: tokensUsed,
      cost_usd: (tokensUsed / 1000) * 0.00002,
      request_metadata: { 
        query_length: query.length,
        materia,
        limit,
        threshold
      },
      response_metadata: { 
        results_count: results?.length || 0
      }
    });

    return new Response(
      JSON.stringify({ 
        results: results || [],
        query_embedding: queryEmbedding,
        tokens_used: tokensUsed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in search-jurisprudence-rag:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
