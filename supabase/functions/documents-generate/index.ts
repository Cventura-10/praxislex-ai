import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Note: In production, replace '*' with your specific domain for better security

// Rate limiting map (simple in-memory, resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // Max 10 requests per hour per user
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in ms

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const now = Date.now();
    const userLimit = rateLimitMap.get(user.id);
    
    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT_MAX) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(user.id, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(user.id, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    const { format, body, intake, citations } = await req.json();

    // Input validation
    const allowedFormats = ['docx', 'pdf', 'txt'];
    if (format && !allowedFormats.includes(format)) {
      return new Response(JSON.stringify({ error: 'Invalid format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body || typeof body !== 'string' || body.length > 100000) {
      return new Response(JSON.stringify({ error: 'Invalid body content' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (citations && (!Array.isArray(citations) || citations.length > 50)) {
      return new Response(JSON.stringify({ error: 'Invalid citations' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generando documento en formato:', format);

    // Por ahora retornamos el contenido como texto
    // En producción aquí se usaría una librería para generar DOCX/PDF real
    const content = `${body}\n\n---\nCITAS Y REFERENCIAS:\n${citations.map((c: any, i: number) => 
      `${i + 1}. ${c.organo} - ${c.sala}\n   ${c.num} (${c.fecha})\n   ${c.url}`
    ).join('\n\n')}`;

    const blob = new TextEncoder().encode(content);

    // Sanitize filename - only allow alphanumeric, hyphens, and underscores
    const sanitizedMateria = (intake?.materia || 'documento').replace(/[^a-zA-Z0-9-_]/g, '_');
    const sanitizedFilename = `PraxisLex_${sanitizedMateria}_${new Date().toISOString().split('T')[0]}.${format || 'txt'}`;

    return new Response(blob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
      },
    });

  } catch (error) {
    console.error('Error en documents-generate:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
