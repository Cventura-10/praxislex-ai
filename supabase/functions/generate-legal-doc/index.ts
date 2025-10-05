import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { 
      tipo_documento,
      materia,
      hechos,
      pretension,
      partes,
      juzgado,
      legislacion,
      jurisprudencia 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    // Sistema prompt especializado en derecho dominicano
    const systemPrompt = `Eres un asistente jurídico especializado en República Dominicana. 

REGLAS CRÍTICAS:
1. NUNCA generes texto sin citas verificables de fuentes jurídicas
2. Cada afirmación legal DEBE tener una cita con: órgano, número, fecha y extracto
3. Si no puedes citar fuentes verificables, responde: "Información insuficiente para generar documento con citas verificables"
4. Usa lenguaje jurídico formal dominicano
5. Estructura: Encabezado, Hechos, Fundamentos de Derecho (con citas), Petitorio

FORMATO DE CITAS REQUERIDO:
- Sentencias: "SCJ-3ra-2020-123, de fecha 12 de marzo de 2020..."
- Leyes: "Artículo X de la Ley No. XXX-XX..."
- Códigos: "Artículo XXX del Código Civil..."

Genera documentos jurídicos profesionales con citas verificables.`;

    // Construir el prompt del usuario con toda la información
    const userPrompt = `Genera ${tipo_documento} para la materia ${materia}.

INFORMACIÓN DEL CASO:
Hechos: ${hechos || 'No especificados'}
Pretensión: ${pretension || 'No especificada'}
Partes: ${partes ? JSON.stringify(partes) : 'No especificadas'}
Juzgado: ${juzgado || 'No especificado'}

${legislacion ? `LEGISLACIÓN APLICABLE: ${legislacion}` : ''}
${jurisprudencia ? `JURISPRUDENCIA APLICABLE: ${jurisprudencia}` : ''}

INSTRUCCIONES:
1. Genera el documento completo con estructura formal
2. Incluye MÍNIMO 2 citas verificables en Fundamentos de Derecho
3. Usa formato: 
   - I. HECHOS
   - II. FUNDAMENTOS DE DERECHO (con citas)
   - III. PETITORIO

4. Cada cita debe tener: órgano, número/artículo, fecha, extracto relevante

Genera el documento ahora:`;

    console.log('Generando documento jurídico con IA...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Límite de solicitudes excedido. Intenta nuevamente en unos momentos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos de IA agotados. Por favor, recarga en Configuración.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Error de AI Gateway:', response.status, errorText);
      throw new Error('Error al generar documento');
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No se generó contenido');
    }

    console.log('Documento generado exitosamente');

    return new Response(
      JSON.stringify({ 
        documento: generatedText,
        metadata: {
          tipo_documento,
          materia,
          fecha_generacion: new Date().toISOString(),
          modelo: 'google/gemini-2.5-flash'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error en generate-legal-doc:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
