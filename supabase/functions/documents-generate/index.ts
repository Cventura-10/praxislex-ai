import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { format, body, intake, citations } = await req.json();

    console.log('Generando documento en formato:', format);

    // Por ahora retornamos el contenido como texto
    // En producción aquí se usaría una librería para generar DOCX/PDF real
    const content = `${body}\n\n---\nCITAS Y REFERENCIAS:\n${citations.map((c: any, i: number) => 
      `${i + 1}. ${c.organo} - ${c.sala}\n   ${c.num} (${c.fecha})\n   ${c.url}`
    ).join('\n\n')}`;

    const blob = new TextEncoder().encode(content);

    return new Response(blob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="PraxisLex_${intake.materia}_${new Date().toISOString().split('T')[0]}.${format || 'txt'}"`,
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
