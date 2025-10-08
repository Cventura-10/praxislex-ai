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
    const { text, model = 'text-embedding-3-small' } = await req.json();
    
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating embedding for text:', text.substring(0, 100) + '...');

    // Call Lovable AI Gateway for embeddings
    const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Embedding API error:', error);
      throw new Error(`Embedding API failed: ${response.status}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;
    const tokens = data.usage.total_tokens;

    console.log('Embedding generated successfully, tokens used:', tokens);

    // Track AI usage
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (user) {
      await supabaseClient.from('ai_usage').insert({
        user_id: user.id,
        operation_type: 'embedding',
        model_used: 'text-embedding-3-small',
        tokens_used: tokens,
        cost_usd: (tokens / 1000) * 0.00002, // $0.02 per 1M tokens
        request_metadata: { text_length: text.length },
        response_metadata: { embedding_dimensions: embedding.length }
      });
    }

    return new Response(
      JSON.stringify({ embedding, tokens }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-embedding:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
