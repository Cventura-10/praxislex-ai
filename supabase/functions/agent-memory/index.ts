import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RememberRequest {
  action: 'remember';
  act_slug: string;
  formData: Record<string, any>;
  metadata?: Record<string, any>;
}

interface SuggestRequest {
  action: 'suggest';
  act_slug: string;
  partialFormData?: Record<string, any>;
}

type AgentRequest = RememberRequest | SuggestRequest;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    const userId = user.id;
    const body: AgentRequest = await req.json();
    const { action, act_slug } = body;

    console.log(`[agent-memory] User: ${userId}, Action: ${action}, Slug: ${act_slug}`);

    // REMEMBER: Save usage patterns
    if (action === 'remember') {
      const { formData, metadata = {} } = body as RememberRequest;
      
      // Log the event
      await supabase.from('agent_events').insert({
        user_id: userId,
        act_slug,
        event_type: 'generate',
        summary: `Generated act: ${act_slug}`,
        payload: { formData, metadata }
      });

      // Extract and save patterns
      const patterns: Array<{ key: string; value: any }> = [];
      
      // Common field patterns
      for (const [key, value] of Object.entries(formData)) {
        if (value && typeof value === 'string' && value.trim()) {
          patterns.push({ key: `field_${key}`, value: { common_value: value } });
        } else if (typeof value === 'number') {
          patterns.push({ key: `field_${key}`, value: { common_value: value } });
        } else if (Array.isArray(value) && value.length > 0) {
          patterns.push({ key: `field_${key}_count`, value: { typical_count: value.length } });
        }
      }

      // Upsert patterns
      for (const pattern of patterns) {
        await supabase.rpc('upsert_agent_pattern', {
          p_user_id: userId,
          p_act_slug: act_slug,
          p_pattern_key: pattern.key,
          p_pattern_value: pattern.value
        });
      }

      console.log(`[agent-memory] Saved ${patterns.length} patterns for ${act_slug}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Saved ${patterns.length} patterns`,
          patterns_saved: patterns.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SUGGEST: Get intelligent suggestions
    if (action === 'suggest') {
      const { partialFormData = {} } = body as SuggestRequest;

      // Get stored patterns
      const { data: patterns, error: patternsError } = await supabase.rpc('get_agent_suggestions', {
        p_user_id: userId,
        p_act_slug: act_slug,
        p_limit: 20
      });

      if (patternsError) {
        console.error('[agent-memory] Error fetching patterns:', patternsError);
      }

      const suggestions: Record<string, any> = {};
      
      if (patterns && patterns.length > 0) {
        // Build suggestions from patterns
        for (const pattern of patterns) {
          const fieldMatch = pattern.pattern_key.match(/^field_(.+)$/);
          if (fieldMatch) {
            const fieldName = fieldMatch[1];
            if (!partialFormData[fieldName] && pattern.pattern_value?.common_value) {
              suggestions[fieldName] = {
                value: pattern.pattern_value.common_value,
                confidence: Math.min(pattern.usage_count / 10, 1),
                source: 'pattern'
              };
            }
          }
        }
      }

      // Enhance with AI if Lovable API key is available
      let aiSuggestions: any = null;
      if (lovableApiKey && Object.keys(partialFormData).length > 0) {
        try {
          const context = `Acto: ${act_slug}\nCampos completados: ${JSON.stringify(partialFormData, null, 2)}`;
          
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'Eres un asistente legal que sugiere valores para formularios de actos jurídicos. Responde en español dominicano. Sé conciso y práctico.'
                },
                {
                  role: 'user',
                  content: `Basado en este contexto, sugiere 2-3 campos que el usuario debería completar a continuación:\n\n${context}`
                }
              ],
              max_tokens: 200
            })
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiSuggestions = aiData.choices?.[0]?.message?.content;
            console.log('[agent-memory] AI suggestions generated');
          }
        } catch (aiError) {
          console.error('[agent-memory] AI enhancement failed:', aiError);
          // Continue without AI enhancement
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          suggestions,
          ai_guidance: aiSuggestions,
          patterns_used: patterns?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Invalid action: ${action}`);

  } catch (error) {
    console.error('[agent-memory] Error:', error);

    // Log error to database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from('error_logs').insert({
        origin: 'edge:function',
        operation: 'agent-memory',
        error_message: error instanceof Error ? error.message : String(error),
        payload: { timestamp: new Date().toISOString() }
      });
    } catch (logError) {
      console.error('[agent-memory] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
