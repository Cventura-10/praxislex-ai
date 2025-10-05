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

    // Sistema prompt especializado en derecho dominicano con estructura profesional
    const systemPrompt = `Eres un asistente jurídico experto especializado en República Dominicana.

    ESTRUCTURA OBLIGATORIA DEL DOCUMENTO (TEXTO PLANO, SIN MARKDOWN):
    
    1. PRESENTACIÓN
    1.1. Designación protocolar del alguacil: <texto>
    1.2. Acto: No.: <valor o N/D>; Folios: <valor o N/D>; Año: <valor o N/D>
    1.3. Ciudad de la actuación: <valor o N/D>
    1.5. Demandante: nombre completo, nacionalidad, estado civil, cédula, domicilio
    1.6. Abogado apoderado: firma, RNC, datos del despacho (dirección, teléfonos, email)
    1.8. Elección de domicilio: <valor o N/D>
    1.10. Declaración de mandato y proceso verbal de traslados
    1.12. Proceso verbal de traslado (PRIMERO/SEGUNDO/TERCERO según corresponda)
    1.14. Emplazamiento y designación del tribunal
    1.15. Citación y emplazamiento (plazo de octava franca)
    1.17. Tribunal apoderado: designación completa
    1.19. Propósitos de la demanda y relato
    
    2. RELATO FÁCTICO
    2.1. Sucesos motivadores
    2.2. Hechos narrados cronológicamente (2.2, 2.3, ...)
    
    3. ASPECTOS REGULATORIOS
    3.1. Bloque de constitucionalidad
    3.2. Constitución (arts. 51, 26, 68, 69) con texto pertinente e íntegro cuando sea clave
    3.3. Tratados: PIDCP (arts. 2 y 14), CADH (art. 8)
    3.4. Código Civil (arts. 1134, 1135, 1136, 1138, 1139, 1142, 1146, 1382, 1383)
    3.5. Leyes especiales aplicables a la materia
    
    4. TESIS DE DERECHO
    4.1. Metodología de subsunción
    4.2. Desarrollo analítico vinculando hechos y normas (4.2, 4.3, ...)
    
    5. DISPOSITIVOS
    5.1. Motivación
    5.2. Declaratoria de validez procesal
    5.4. Peticiones de fondo
    5.5. Pruebas y propuestas de comprobación
    5.6-5.N. COMPROBAR/DECLARAR/ORDENAR/CONDENAR específicos (con montos en RD$ o US$)
    5.14. Declaración verbal de recibo y costos
    5.15-5.19. Certificaciones del alguacil
    
    REGLAS CRÍTICAS DE CONTENIDO:
    1) Nunca uses líneas de subrayado o rellenos (____). Si falta un dato, escribe "N/D".
    2) Mantén la estructura numerada estricta (1., 1.1., 1.2., etc.).
    3) Lenguaje formal jurídico dominicano.
    4) Citas verificables: incluye referencia exacta y, cuando sea necesario, el texto íntegro del artículo citado.
    5) Adapta normativa y jurisprudencia a la materia concreta del caso.

    NOTAS DE FORMATO:
    - Salida en TEXTO PLANO (sin encabezados Markdown ni símbolos como # o **).
    - Párrafos claros y legibles; evita listas con guiones si no son necesarias.
    - No dejes campos en blanco; usa "N/D" cuando proceda.

    Genera documentos COMPLETOS, PROFESIONALES y EXHAUSTIVOS siguiendo EXACTAMENTE esta estructura.`;

    // Construir el prompt del usuario con toda la información
    const userPrompt = `Genera ${tipo_documento} COMPLETO para la materia ${materia} siguiendo EXACTAMENTE la estructura de 5 secciones y las REGLAS y NOTAS DE FORMATO dadas por el sistema.
    
    INFORMACIÓN DEL CASO:
    Hechos: ${hechos || 'N/D'}
    Pretensión: ${pretension || 'N/D'}
    Partes: ${partes ? JSON.stringify(partes) : 'N/D'}
    Juzgado: ${juzgado || 'N/D'}
    
    ${legislacion ? `LEGISLACIÓN APLICABLE: ${legislacion}` : ''}
    ${jurisprudencia ? `JURISPRUDENCIA APLICABLE: ${jurisprudencia}` : ''}
    
    INSTRUCCIONES OBLIGATORIAS:
    - Salida en TEXTO PLANO (sin Markdown, sin subrayados). Usa "N/D" cuando falte un dato.
    - PRESENTACIÓN completa (1.1 a 1.19) rellenando los campos con datos del caso o "N/D".
    - RELATO FÁCTICO cronológico y claro (2.1 a 2.N).
    - ASPECTOS REGULATORIOS con citas verificables y, cuando sea clave, texto íntegro de los artículos.
    - TESIS DE DERECHO con subsunción rigurosa (4.1 a 4.N).
    - DISPOSITIVOS (5.1 a 5.19) con pretensiones concretas y montos en RD$ o US$ cuando corresponda.
    
    Adapta la legislación y jurisprudencia a la materia ${materia} y a los hechos provistos.
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
