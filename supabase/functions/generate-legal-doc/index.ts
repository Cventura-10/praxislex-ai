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
      demandante,
      abogado,
      firma_apoderada,
      demandado,
      acto,
      ciudad_actuacion,
      alguacil_designacion,
      juzgado,
      legislacion,
      jurisprudencia 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    // Jerarquía normativa según materia
    const jerarquiaNormativa: Record<string, string[]> = {
      civil: [
        "Constitución de la República Dominicana (arts. 51, 26, 68, 69)",
        "Pacto Internacional de Derechos Civiles y Políticos (arts. 2 y 14)",
        "Convención Americana sobre Derechos Humanos (art. 8)",
        "Código Civil Dominicano (arts. 1134, 1135, 1382, 1383)",
        "Ley No. 834 sobre Actos del Estado Civil"
      ],
      penal: [
        "Constitución de la República Dominicana (arts. 40, 69)",
        "Pacto Internacional de Derechos Civiles y Políticos (arts. 9, 14, 15)",
        "Convención Americana sobre Derechos Humanos (arts. 7, 8, 9)",
        "Código Procesal Penal (Ley 76-02)",
        "Código Penal Dominicano"
      ],
      laboral: [
        "Constitución de la República Dominicana (arts. 62, 63, 64)",
        "Convenios OIT ratificados por RD",
        "Código de Trabajo (Ley 16-92)",
        "Reglamento 258-93 para aplicación del Código de Trabajo"
      ],
      comercial: [
        "Constitución de la República Dominicana (arts. 50, 51)",
        "Código de Comercio Dominicano",
        "Ley 479-08 General de Sociedades Comerciales",
        "Ley 108-05 de Registro Mercantil"
      ],
      familia: [
        "Constitución de la República Dominicana (art. 55)",
        "Convención sobre los Derechos del Niño",
        "Código Civil (Libro I - Personas)",
        "Ley 136-03 Código para el Sistema de Protección de los Derechos de los Niños, Niñas y Adolescentes"
      ],
      inmobiliario: [
        "Constitución de la República Dominicana (art. 51)",
        "Ley 108-05 de Registro Inmobiliario",
        "Código Civil (arts. 544-710)",
        "Ley 687 sobre Propiedad Horizontal"
      ],
      tributario: [
        "Constitución de la República Dominicana (art. 243)",
        "Ley 11-92 Código Tributario",
        "Ley 557-05 de Reforma Tributaria",
        "Ley 253-12 para el Fortalecimiento de la Capacidad Recaudatoria del Estado"
      ],
      administrativo: [
        "Constitución de la República Dominicana (arts. 138, 149, 150)",
        "Ley 41-08 de Función Pública",
        "Ley 247-12 Orgánica de la Administración Pública",
        "Ley 107-13 sobre los Derechos de las Personas en sus Relaciones con la Administración"
      ]
    };

    const normasAplicables = jerarquiaNormativa[materia] || jerarquiaNormativa.civil;

    const systemPrompt = `Eres un asistente jurídico experto especializado en República Dominicana.

    JERARQUÍA NORMATIVA PARA ${materia.toUpperCase()}:
    ${normasAplicables.map((n, i) => `${i + 1}. ${n}`).join('\n')}

    ESTRUCTURA OBLIGATORIA DEL DOCUMENTO (TEXTO PLANO, SIN MARKDOWN):
    
    1. PRESENTACIÓN
    1.1. Designación Protocolar del Alguacil
    1.2. No. [número], Folios [folios] y [folios] año [año]
    1.3. Ciudad de la Actuación
    1.4. En la Ciudad de [ciudad], a los [día] ([día en letras]) de [mes] del año [año en letras] ([año]);
    1.5. Requeriente
    1.6. [Nombre completo del demandante], [nacionalidad], mayor de edad, [estado civil], portador de la cédula No. [cédula], [domicilio completo]
    1.7. Firma Apoderada
    1.8. [Nombre de la firma], entidad jurídica organizada conforme a las leyes de RD, RNC [número], representada por [representante], quien otorga poder al [abogado], [datos completos del abogado], matrícula No. [matrícula], con estudio profesional en [dirección], teléfonos [teléfonos], email: [email]
    1.9. Elección de Domicilio
    1.10. Elección de domicilio en la dirección del estudio del abogado apoderado
    2. Declaración de mandato y Proceso Verbal Traslados
    2.1. Yo [nombre del alguacil], debidamente nombrado, recibido y juramentado...
    3. Proceso verbal de Traslado
    3.1. PRIMERO: [descripción del traslado al domicilio del demandado]
    4. Mención de la Notificación
    4.1. Por medio del presente acto LE NOTIFICO Y DENUNCIO...
    
    2. RELATO FÁCTICO
    2.1. Sucesos motivadores (narración cronológica)
    
    3. ASPECTOS REGULATORIOS (EN ORDEN JERÁRQUICO ESTRICTO)
    ${normasAplicables.map((n, i) => `3.${i + 1}. ${n} - citar artículos específicos CON TEXTO ÍNTEGRO cuando sea clave`).join('\n')}
    
    4. TESIS DE DERECHO
    4.1. Metodología de subsunción (vincular hechos con normas jerárquicas)
    
    5. DISPOSITIVOS
    5.1. Motivación
    5.2. Declaratoria de validez procesal
    5.3. Peticiones de fondo (COMPROBAR/DECLARAR/ORDENAR/CONDENAR con montos específicos)
    5.4. Costas y gastos
    5.5. Certificaciones del alguacil
    
    REGLAS CRÍTICAS:
    1) NUNCA usar líneas de subrayado o espacios en blanco (____). Usa los datos provistos.
    2) Estructura numerada estricta (1.1., 1.2., etc.)
    3) Lenguaje formal jurídico dominicano
    4) Normas en ORDEN JERÁRQUICO según la materia
    5) Citas con texto íntegro del artículo cuando sea fundamental
    6) Formato para Word: texto plano, sin Markdown, justificado

    Genera documentos COMPLETOS y PROFESIONALES.`;

    // Construir el prompt del usuario con toda la información
    const userPrompt = `Genera ${tipo_documento} COMPLETO para la materia ${materia} siguiendo EXACTAMENTE la estructura y jerarquía normativa.
    
    DATOS DEL ACTO:
    No. Acto: ${acto?.numero || 'N/D'}
    Folios: ${acto?.folios || 'N/D'}
    Año: ${acto?.año || new Date().getFullYear()}
    Ciudad: ${ciudad_actuacion || 'N/D'}
    
    ALGUACIL:
    ${alguacil_designacion || 'N/D'}
    
    DEMANDANTE/REQUERIENTE:
    Nombre: ${demandante?.nombre || 'N/D'}
    Nacionalidad: ${demandante?.nacionalidad || 'dominicano'}
    Estado Civil: ${demandante?.estado_civil || 'N/D'}
    Cédula: ${demandante?.cedula || 'N/D'}
    Domicilio: ${demandante?.domicilio || 'N/D'}
    
    FIRMA APODERADA:
    Nombre: ${firma_apoderada?.nombre || 'N/D'}
    RNC: ${firma_apoderada?.rnc || 'N/D'}
    
    ABOGADO APODERADO:
    Nombre: ${abogado?.nombre || 'N/D'}
    Cédula: ${abogado?.cedula || 'N/D'}
    Matrícula: ${abogado?.matricula || 'N/D'}
    Dirección: ${abogado?.direccion || 'N/D'}
    Teléfono: ${abogado?.telefono || 'N/D'}
    Email: ${abogado?.email || 'N/D'}
    
    DEMANDADO/PARTE CONTRARIA:
    Nombre: ${demandado?.nombre || 'N/D'}
    Domicilio: ${demandado?.domicilio || 'N/D'}
    
    TRIBUNAL:
    ${juzgado || 'N/D'}
    
    HECHOS DEL CASO:
    ${hechos || 'N/D'}
    
    PRETENSIÓN:
    ${pretension || 'N/D'}
    
    ${legislacion ? `LEGISLACIÓN ADICIONAL: ${legislacion}` : ''}
    ${jurisprudencia ? `JURISPRUDENCIA APLICABLE: ${jurisprudencia}` : ''}
    
    INSTRUCCIONES OBLIGATORIAS:
    1. Usa TODOS los datos provistos (no dejar N/D si hay datos reales)
    2. PRESENTACIÓN completa siguiendo el formato del ejemplo (1.1 a 4.1)
    3. ASPECTOS REGULATORIOS en ORDEN JERÁRQUICO según la materia ${materia}
    4. Citar artículos con TEXTO ÍNTEGRO cuando sea clave para el argumento
    5. DISPOSITIVOS específicos con montos en RD$ o US$ según corresponda
    6. Formato para Word: texto plano, sin Markdown, justificado
    
    Genera el documento COMPLETO ahora:`;

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
