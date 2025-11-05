import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Endpoint de SOLO LECTURA para el módulo de Generación de Documentos
 * Retorna el perfil de estilo activo del tenant
 */
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

    // Obtener perfil activo usando la función helper
    const { data: profiles, error: profileError } = await supabase
      .rpc('get_active_style_profile', { p_tenant_id: tenantData });

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (profileError || !profile) {
      // No hay perfil activo, retornar perfil por defecto
      return new Response(
        JSON.stringify({ 
          has_profile: false,
          message: 'No hay perfil de estilo configurado. Usando valores por defecto.',
          profile: {
            layout_json: {
              body_font: 'Times New Roman',
              body_size: 12,
              title_font: 'Times New Roman',
              title_size: 14,
              line_spacing: 1.5,
              margins: { top: 2.5, bottom: 2.5, left: 3, right: 3 }
            },
            lexicon_json: {
              formality: 'alta',
              person: 'impersonal',
              currency_format: 'RD$ 0,00',
              date_format: 'a los _ días del mes de ___ del año __',
              number_duplication: true
            },
            clause_library_json: [],
            variable_map_json: []
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retornar perfil activo
    return new Response(
      JSON.stringify({ 
        has_profile: true,
        profile: {
          id: profile.id,
          version: profile.version,
          layout_json: profile.layout_json,
          lexicon_json: profile.lexicon_json,
          clause_library_json: profile.clause_library_json,
          variable_map_json: profile.variable_map_json,
          metrics_json: profile.metrics_json,
          published_at: profile.published_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en integration-style-profile:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({ error: 'Error al obtener perfil. Contacte soporte.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
