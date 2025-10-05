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

ESTRUCTURA OBLIGATORIA DEL DOCUMENTO:

1. PRESENTACIÓN
   1.1. Designación Protocolar del Alguacil
   1.2. Acto No. ______, Folios ______ y ______ año ______
   1.3. Ciudad de la Actuación
   1.5. Demandante (datos completos: nombre, nacionalidad, estado civil, cédula, domicilio)
   1.6. Abogado apoderado (firma, RNC, gerente, abogados con matrículas, dirección, teléfonos, email)
   1.8. Elección de Domicilio
   1.10. Declaración de mandato y Proceso Verbal Traslados
   1.12. Proceso verbal de Traslado (PRIMERO, SEGUNDO, TERCERO según corresponda)
   1.14. Declaración Emplazamiento Y Designación Tribunal
   1.15. Citación y Emplazamiento (plazo de octava franca)
   1.17. Tribunal apoderado (designación completa del tribunal)
   1.19. Propósitos de la Demanda Y Relato

2. RELATO FACTICO
   2.1. Sucesos motivadores
   2.2. - 2.N. Narración cronológica detallada de los hechos

3. ASPECTOS REGULATORIOS
   3.1. Normativa del Bloque Constitucional
   3.2. Artículo 51 de la Constitución (derecho de propiedad)
   3.3. Artículo 26 (relaciones internacionales)
   3.4. Artículo 68 (garantías de derechos fundamentales)
   3.5. Artículo 69 (tutela judicial efectiva y debido proceso)
   3.6. Pacto Internacional de Derechos Civiles y Políticos, Artículo 2
   3.7. Artículo 14 del Pacto (garantías procesales)
   3.8. Artículo 8 de la Convención Americana sobre Derechos Humanos
   3.9-3.22. Normativa del Código Civil (Arts. 1134, 1135, 1136, 1138, 1139, 1142, 1146, 1382, 1383)

4. TESIS DE DERECHO
   4.1. Introducción a la subsunción jurídica
   4.2-4.N. Análisis jurídico detallado subsumiendo hechos en normas

5. DISPOSITIVOS
   5.1. Motivación general
   5.2. Declaratoria de validez procesal
   5.4. Petición de contenido
   5.5. Propuestas de comprobación
   5.6-5.N. COMPROBAR Y DECLARAR / ORDENAR / CONDENAR específicos
   5.14. Declaración Verbal De Recibo Y Costo
   5.15-5.19. Certificaciones finales del alguacil

REGLAS CRÍTICAS DE CONTENIDO:
1. Citar SIEMPRE artículos constitucionales, tratados internacionales y códigos relevantes
2. Incluir texto COMPLETO de artículos clave (no solo referencias)
3. Estructura numerada rigurosa (1., 1.1., 1.2., etc.)
4. Lenguaje formal jurídico dominicano
5. Adaptar legislación específica según materia (Civil, Penal, Laboral, etc.)
6. Petitorio con montos en RD$ o US$ según corresponda
7. Referencias a tribunales dominicanos específicos
8. Uso de mayúsculas en términos jurídicos clave (COMPROBAR, DECLARAR, ORDENAR, CONDENAR)

CITAS VERIFICABLES:
- Constitución: "Artículo XX de la Constitución Dominicana..."
- Código Civil: "Artículo XXXX del Código Civil..."
- Leyes especiales según materia
- Tratados internacionales ratificados

Genera documentos COMPLETOS, PROFESIONALES y EXHAUSTIVOS siguiendo EXACTAMENTE esta estructura.`;

    // Construir el prompt del usuario con toda la información
    const userPrompt = `Genera ${tipo_documento} COMPLETO para la materia ${materia} siguiendo EXACTAMENTE la estructura de 5 secciones.

INFORMACIÓN DEL CASO:
Hechos: ${hechos || 'No especificados'}
Pretensión: ${pretension || 'No especificada'}
Partes: ${partes ? JSON.stringify(partes) : 'No especificadas'}
Juzgado: ${juzgado || 'No especificado'}

${legislacion ? `LEGISLACIÓN APLICABLE: ${legislacion}` : ''}
${jurisprudencia ? `JURISPRUDENCIA APLICABLE: ${jurisprudencia}` : ''}

INSTRUCCIONES OBLIGATORIAS:
1. Sigue EXACTAMENTE la estructura de 5 secciones con numeración
2. PRESENTACIÓN completa (1.1 a 1.19)
3. RELATO FACTICO detallado (2.1 a 2.N)
4. ASPECTOS REGULATORIOS con artículos COMPLETOS de:
   - Constitución Dominicana (Arts. 51, 26, 68, 69)
   - Pacto Internacional Derechos Civiles y Políticos
   - Convención Americana Derechos Humanos
   - Código Civil (Arts. 1134, 1135, 1136, 1138, 1139, 1142, 1146, 1382, 1383)
   - Legislación especial según materia ${materia}
5. TESIS DE DERECHO con análisis jurídico (4.1 a 4.N)
6. DISPOSITIVOS completos (5.1 a 5.19) con peticiones específicas

Adapta legislación específica para materia ${materia}.
Genera documento PROFESIONAL y EXHAUSTIVO ahora:`;

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
