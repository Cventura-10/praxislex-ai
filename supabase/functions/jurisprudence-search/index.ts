import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Strict CORS - no wildcard fallback
const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN');
if (!allowedOrigin) {
  console.error('ALLOWED_ORIGIN environment variable not configured');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin || 'https://hpeyqttxzrqctrefjlfq.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Note: In production, replace '*' with your specific domain for better security

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const requestBody = await req.json();
    
    // Comprehensive input validation with Zod
    const SearchSchema = z.object({
      materia: z.string().max(100).optional(),
      keywords: z.string().max(500).optional(),
      limit: z.number().int().min(1).max(50).optional().default(5),
    });
    
    let validated;
    try {
      validated = SearchSchema.parse(requestBody);
    } catch (validationError) {
      console.error('⛔ Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Invalid search parameters', details: validationError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { materia, keywords, limit } = validated;

    console.log('Buscando jurisprudencia:', { materia, keywords, limit });

    // Base de jurisprudencia simulada (en producción sería una BD real)
    const jurisprudenceDB = [
      {
        organo: 'Suprema Corte de Justicia',
        sala: 'Primera Sala - Civil',
        num: 'SCJ-CIVIL-1857-2023',
        fecha: '2023-11-15',
        sumario: 'Responsabilidad civil contractual. Incumplimiento de contrato de servicios.',
        url: 'https://poderjudicial.gob.do/jurisprudencia/2023/civil/1857'
      },
      {
        organo: 'Suprema Corte de Justicia',
        sala: 'Segunda Sala - Penal',
        num: 'SCJ-PENAL-0942-2024',
        fecha: '2024-03-22',
        sumario: 'Procedimiento penal. Garantías procesales del imputado.',
        url: 'https://poderjudicial.gob.do/jurisprudencia/2024/penal/942'
      },
      {
        organo: 'Suprema Corte de Justicia',
        sala: 'Tercera Sala - Laboral',
        num: 'SCJ-LABORAL-0384-2023',
        fecha: '2023-09-08',
        sumario: 'Despido injustificado. Prestaciones laborales.',
        url: 'https://poderjudicial.gob.do/jurisprudencia/2023/laboral/384'
      },
      {
        organo: 'Tribunal Superior Administrativo',
        sala: 'Pleno',
        num: 'TSA-ADM-0127-2024',
        fecha: '2024-01-30',
        sumario: 'Acto administrativo. Principio de legalidad.',
        url: 'https://poderjudicial.gob.do/jurisprudencia/2024/admin/127'
      },
      {
        organo: 'Tribunal Constitucional',
        sala: 'Pleno',
        num: 'TC-0456-2023',
        fecha: '2023-12-12',
        sumario: 'Acción de amparo. Derechos fundamentales.',
        url: 'https://tribunalconstitucional.gob.do/sentencias/2023/456'
      }
    ];

    // Filtrar por materia y keywords
    let results = jurisprudenceDB.filter(j => {
      if (materia && !j.sala.toLowerCase().includes(materia.toLowerCase())) return false;
      if (keywords && !j.sumario.toLowerCase().includes(keywords.toLowerCase())) return false;
      return true;
    });

    // Limitar resultados
    results = results.slice(0, limit);

    console.log(`Encontradas ${results.length} sentencias`);

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error en jurisprudence-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
