import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema de validación
const publishSchema = z.object({
  run_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener tenant_id
    const { data: tenantData } = await supabase
      .rpc('get_user_tenant_id', { p_user_id: user.id });

    if (!tenantData) {
      return new Response(
        JSON.stringify({ error: 'Tenant no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawPayload = await req.json();
    
    // Validar payload
    const validationResult = publishSchema.safeParse(rawPayload);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Datos inválidos', 
          detalles: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = validationResult.data;

    // Obtener run
    const { data: run, error: runError } = await supabase
      .from('doc_learning_runs')
      .select('*')
      .eq('id', payload.run_id)
      .eq('tenant_id', tenantData)
      .eq('status', 'completed')
      .single();

    if (runError || !run) {
      return new Response(
        JSON.stringify({ error: 'Análisis no encontrado o incompleto' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener variables y cláusulas
    const { data: variables } = await supabase
      .from('doc_learning_variables')
      .select('*')
      .eq('run_id', run.id);

    const { data: clauses } = await supabase
      .from('doc_learning_clauses')
      .select('*')
      .eq('run_id', run.id);

    // Obtener próxima versión
    const { data: latestProfile } = await supabase
      .from('style_profiles')
      .select('version')
      .eq('tenant_id', tenantData)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestProfile?.version || 0) + 1;

    // Construir perfil
    const layoutJson = run.summary?.typography || {
      body_font: 'Times New Roman',
      body_size: 12,
      title_font: 'Times New Roman',
      title_size: 14,
      line_spacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 3, right: 3 }
    };

    const lexiconJson = {
      formality: run.summary?.lexicon?.formality || 'alta',
      person: run.summary?.lexicon?.person || 'impersonal',
      common_phrases: run.summary?.lexicon?.common_phrases || [],
      currency_format: 'RD$ 0,00',
      date_format: 'a los _ días del mes de ___ del año __',
      number_duplication: true // duplicar números en letras
    };

    const clauseLibraryJson = (clauses || []).map(c => ({
      title: c.title,
      body: c.body,
      hash: c.hash,
      frequency: c.frequency,
      confidence: c.confidence
    }));

    const variableMapJson = (variables || []).map(v => ({
      name: v.name,
      pattern: v.pattern,
      examples: v.examples,
      required: v.required,
      confidence: v.confidence
    }));

    const metricsJson = run.metrics || {};

    // Crear perfil
    const { data: profile, error: profileError } = await supabase
      .from('style_profiles')
      .insert({
        tenant_id: tenantData,
        user_id: user.id,
        run_id: run.id,
        version: nextVersion,
        layout_json: layoutJson,
        lexicon_json: lexiconJson,
        clause_library_json: clauseLibraryJson,
        variable_map_json: variableMapJson,
        metrics_json: metricsJson,
        active: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error al publicar perfil:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error al publicar perfil. Contacte soporte.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile_id: profile.id,
        version: nextVersion,
        message: `Perfil v${nextVersion} publicado exitosamente` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en doc-learning-publish:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({ error: 'Error al publicar perfil. Contacte soporte.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
