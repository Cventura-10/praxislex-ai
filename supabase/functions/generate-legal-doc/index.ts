import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security feature flags
const FEATURE_ACT_SCHEMA_ISOLATION = Deno.env.get('FEATURE_ACT_SCHEMA_ISOLATION') === 'true';
const FEATURE_EXTRAPROCESAL_HIDE_JUDICIAL = Deno.env.get('FEATURE_EXTRAPROCESAL_HIDE_JUDICIAL') === 'true';

// Detect judicial fields that should never appear in extrajudicial acts
function isJudicialField(key: string): boolean {
  const base = key.split('.')[0];
  const judicialFields = new Set([
    'demandante', 'demandado', 'tribunal', 'numero_acto', 'folios',
    'traslados_enumerados', 'emplazamiento_texto', 'octava_franca_fecha_limite',
    'costas_texto', 'petitorio', 'dispositivo'
  ]);
  return judicialFields.has(base);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("authorization");
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    // Obtener información de la firma del abogado si está disponible
    let lawFirmInfo = null;
    if (userId) {
      const { data: firmData } = await supabase
        .from("law_firm_profile")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (firmData) {
        lawFirmInfo = firmData;
      }
    }

    const requestBody = await req.json();
    
    // Input validation schema
    const SpanishLegalTextSchema = z.string()
      .max(5000, "Campo excede el límite de 5000 caracteres")
      .regex(/^[\w\s.,;:()\u00a1\u00bf!?"\-áéíóúñÑÁÉÍÓÚüÜ/\\@#$%&*+=\[\]\{\}|<>'\n\r\t]*$/u, "Contiene caracteres no permitidos");
    
    const FormDataSchema = z.record(
      z.string().max(100, "Nombre de campo demasiado largo"),
      SpanishLegalTextSchema
    );
    
    const RequestSchema = z.object({
      tipo_documento: z.string().min(1).max(100).optional(),
      actType: z.string().min(1).max(100).optional(),
      actName: z.string().max(200).optional(),
      category: z.string().max(100).optional(),
      categoryType: z.string().max(100).optional(),
      materia: z.string().max(100).optional(),
      formData: FormDataSchema.optional(),
      hechos: z.string().max(10000).optional(),
      fundamentacion_juridica: z.string().max(10000).optional(),
      petitorio: z.string().max(5000).optional(),
      pruebas: z.array(z.string()).max(50).optional(),
      lugar_ciudad: z.string().max(100).optional(),
      jurisdiccion: z.string().max(100).optional(),
      fecha_actuacion: z.string().max(100).optional(),
      abogado_nombre: z.string().max(200).optional(),
      abogado_cedula: z.string().max(50).optional(),
      abogado_matricula: z.string().max(100).optional(),
      demandante: z.string().max(200).optional(),
      demandado: z.string().max(200).optional(),
      compareciente: z.string().max(200).optional(),
      numero_expediente: z.string().max(100).optional(),
      tribunal: z.string().max(200).optional(),
      juzgado: z.string().max(200).optional(),
      ciudad_actuacion: z.string().max(100).optional(),
      legislacion: z.string().max(5000).optional(),
      jurisprudencia: z.string().max(5000).optional(),
    }).strict();
    
    try {
      RequestSchema.parse(requestBody);
    } catch (validationError) {
      console.error('[generate-legal-doc] Validation failed:', {
        error: validationError instanceof Error ? validationError.message : 'Unknown validation error',
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data. Please check your input and try again.',
          code: 'VALIDATION_FAILED'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('📥 Request received:', {
      tipo_documento: requestBody.tipo_documento || requestBody.actType,
      userId: userId ? '[REDACTED]' : null,
      timestamp: new Date().toISOString(),
      hasFormData: !!requestBody.formData
    });
    
    const tipo_documento = requestBody.tipo_documento || requestBody.actType;
    
    if (!tipo_documento) {
      throw new Error('Parámetro requerido: tipo_documento o actType no proporcionado');
    }
    
    console.log('📋 Tipo de documento:', tipo_documento);

    const formData = requestBody.formData || {};

    // Security: Block judicial fields in extrajudicial acts
    if (FEATURE_EXTRAPROCESAL_HIDE_JUDICIAL && tipo_documento) {
      const actosExtrajudiciales = [
        'contrato_venta_inmueble', 'contrato_venta_mueble', 'contrato_venta', 'contrato_alquiler', 'poder_general', 'poder_especial', 'testamento',
        'declaracion_jurada', 'intimacion_pago', 'notificacion_desalojo', 'carta_cobranza',
        'contrato_trabajo', 'carta_despido', 'carta_renuncia', 'acta_conciliacion',
        'solicitud_admin', 'recurso_reconsideracion', 'contrato_compraventa'
      ];
      
      const isExtrajudicial = actosExtrajudiciales.includes(tipo_documento) || 
                              tipo_documento.toLowerCase().includes('contrato') || 
                              tipo_documento.toLowerCase().includes('carta');
      
      if (isExtrajudicial) {
        const judicialFieldsFound: string[] = [];
        
        Object.keys(requestBody).forEach(key => {
          if (isJudicialField(key)) {
            judicialFieldsFound.push(key);
          }
        });
        
        if (requestBody.formData) {
          Object.keys(requestBody.formData).forEach(key => {
            if (isJudicialField(key)) {
              judicialFieldsFound.push(`formData.${key}`);
            }
          });
        }
        
        if (judicialFieldsFound.length > 0) {
          console.error('⛔ Judicial fields blocked in extrajudicial act:', {
            tipo_documento,
            blocked_fields: judicialFieldsFound
          });
          
          return new Response(
            JSON.stringify({ 
              error: `Campo judicial bloqueado en acto extrajudicial: ${judicialFieldsFound.join(', ')}`,
              blocked_fields: judicialFieldsFound,
              tipo_documento
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }
    
    const normalizeText = (text: string | undefined): string => {
      return text ? text.trim() : '';
    };
    
    const abogado_nombre = normalizeText(requestBody.abogado_nombre);
    const abogado_cedula = normalizeText(requestBody.abogado_cedula);
    const abogado_matricula = normalizeText(requestBody.abogado_matricula);
    
    const demandante = normalizeText(requestBody.demandante);
    const demandado = normalizeText(requestBody.demandado);
    const compareciente = normalizeText(requestBody.compareciente);
    
    const numero_expediente = normalizeText(requestBody.numero_expediente);
    const tribunal = normalizeText(requestBody.tribunal);
    const juzgado = normalizeText(requestBody.juzgado);
    const ciudad_actuacion = normalizeText(requestBody.ciudad_actuacion);
    
    const legislacion = normalizeText(requestBody.legislacion);
    const jurisprudencia = normalizeText(requestBody.jurisprudencia);
    
    const hechos = normalizeText(requestBody.hechos);
    const fundamentacion_juridica = normalizeText(requestBody.fundamentacion_juridica);
    const petitorio = normalizeText(requestBody.petitorio);
    
    // Integrar información de la firma del abogado si está disponible
    if (lawFirmInfo) {
      formData.firma_abogado_nombre = lawFirmInfo.nombre_firma || '';
      formData.firma_abogado_direccion = lawFirmInfo.direccion || '';
      formData.firma_abogado_telefono = lawFirmInfo.telefono || '';
      formData.firma_abogado_email = lawFirmInfo.email || '';
      formData.firma_abogado_matricula = lawFirmInfo.matricula_card || '';
    }

    // ═══════════════════════════════════════════════════════════════
    // PROMPT_MAESTRO_PraxisLex v1.0
    // Última actualización: 29-10-2025
    // Ámbito: República Dominicana
    // ═══════════════════════════════════════════════════════════════
    
    const PROMPT_MAESTRO = `PROMPT_MAESTRO_PraxisLex v1.0
Última actualización: 29-10-2025
Ámbito: República Dominicana
Propósito: Generación automática de documentos jurídicos (judiciales y extrajudiciales) procesalmente correctos, listos para ser depositados / notificados / firmados.

1. CONTEXTO DEL SISTEMA

Actúas como redactor jurídico automatizado dentro de PraxisLex, plataforma legal dominicana que genera actos e instancias en nombre de un despacho. Tienes que producir documentos con la forma, estructura, lenguaje técnico y solemnidad que exige el Derecho dominicano vigente. El documento que generes se entrega al usuario final como .docx en formato listo para uso procesal o contractual.

No eres un "modelo genérico". Eres un redactor jurídico dominicano, escribiendo para tribunales dominicanos, fiscalías dominicanas, registros de títulos dominicanos, notarías dominicanas y administraciones públicas dominicanas. Tus textos deben ser procesalmente utilizables sin reescritura estructural.

2. INSUMO (INPUT) QUE RECIBES DEL SISTEMA

Recibirás un objeto JSON llamado payload. Tu trabajo es: tomar ese payload y generar el acto o instancia conforme a:
- la naturaleza procesal exacta del tipo_acto
- la materia indicada  
- las formalidades de redacción que aplican en RD.

3. JERARQUÍA NORMATIVA QUE DEBES RESPETAR

Cuando tengas que citar fundamentos de derecho, sigue este orden jerárquico, y usa solo las fuentes que correspondan a la materia y el tipo de acto:

1) Constitución de la República Dominicana (por ejemplo, art. 51 derecho de propiedad; arts. 68 y 69 tutela judicial efectiva, debido proceso; art. 26 efecto interno de tratados; etc.).
2) Tratados y convenios internacionales ratificados por la RD y de aplicación interna.
3) Leyes y códigos aplicables: Ley núm. 108-05 de Registro Inmobiliario, Código de Trabajo, Código Penal/Procesal Penal, Código Civil, Código de Procedimiento Civil, leyes comerciales y sectoriales.
4) Reglamentos y resoluciones de la Suprema Corte de Justicia y de la Jurisdicción Inmobiliaria (ej. Resolución núm. 790-2022 y modificación 82-2025).
5) Jurisprudencia dominicana relevante del Tribunal Constitucional y Suprema Corte de Justicia.

Nunca cites fuentes de otro país. Nunca cites normas inventadas. No inventes números de artículos ni sentencias específicas si el payload no las trae.

4. TAXONOMÍA OFICIAL DE MATERIAS Y TIPOS DE ACTO

4.1 Actos Judiciales:
- CIVIL_Y_COMERCIAL
- PENAL
- LABORAL
- ADMINISTRATIVO / CONTENCIOSO-ADMINISTRATIVO
- INMOBILIARIO_Y_TIERRAS (Jurisdicción Inmobiliaria / Tribunal de Tierras de Jurisdicción Original)
- JUZGADO_DE_PAZ
- MUNICIPAL_Y_AMBIENTAL

4.2 Actos Extrajudiciales:
- EXTRAJUDICIAL_CONTRATOS (Compraventa, Arrendamiento, etc.)
- EXTRAJUDICIAL_NOTARIAL (Poder Especial, Declaración Jurada, etc.)
- EXTRAJUDICIAL_INTIMACION (Intimación de Pago, Notificación Extrajudicial)
- GESTION_LABORAL_PRIVADA (carta de despido, renuncia)
- GESTION_ADMINISTRATIVA_PRIVADA

5. REGLAS ESPECÍFICAS POR TIPO_ACTO

5.1 EMPLAZAMIENTO
Naturaleza: Acto de alguacil de notificación y citación. NO es una demanda.
Estructura: Encabezado del Alguacil → Proceso verbal de traslado → Citación/Emplazamiento → Advertencia de plazo → Cierre y firma.
PROHIBIDO: Relato fáctico detallado, fundamentos de derecho, tesis de derecho, petitorio de fondo.
Longitud máxima: 2 páginas Word.

5.2 DEMANDA o LITIS_SOBRE_DERECHOS_REGISTRADOS
Naturaleza: Instancia introductiva de acción ante tribunal competente.
Estructura: Encabezado formal → Identificación de partes → Exposición de HECHOS → FUNDAMENTOS DE DERECHO → TESIS/ARGUMENTACIÓN → DISPOSITIVO/PETITORIO.
Tono: rígido, técnico, solemne.

5.3 QUERELLA_PENAL
Naturaleza: Escrito de depósito ante Ministerio Público / Juzgado de la Instrucción. NO es acto de alguacil.
Estructura: Jurisdicción → Identificación → Relato de HECHOS → Calificación Jurídica → Pruebas → Constitución en Actor Civil → Petitorio.
PROHIBIDO: Fórmulas de alguacil, "traslado", terminología civil (demandante/demandado). Usa: Querellante/Imputado.

5.4 CONCLUSIONES
Naturaleza: Argumentación FINAL en proceso judicial.
Estructura: Encabezado → Calidad procesal → Resumen de posición → Fundamentos de Derecho → Conclusiones numeradas → Petitorio Final.

5.5 INVENTARIO_DOCUMENTOS
Naturaleza: Escrito de depósito de pruebas/documentos al expediente.
Estructura: Encabezado → Identificación → Listado numerado (con descripción probatoria y pertinencia) → Solicitud → Cierre.

5.6 CONTRATO_COMPRAVENTA
Naturaleza: Acto PRIVADO entre partes (NO procesal).
Estructura: Título → Comparecientes → Antecedentes → Objeto del contrato → Precio y forma de pago → Cláusulas → Testigos → Firmas.
PROHIBIDO: Terminología procesal, referencias a tribunales, actuaciones de alguacil.

6. VALIDACIONES AUTOMÁTICAS

6.1 Para EMPLAZAMIENTO: NO contiene relato fáctico, fundamentos, tesis ni petitorio de fondo. Debe contener citación y advertencia procesal.
6.2 Para QUERELLA_PENAL: NO contiene fórmulas de alguacil. Usa Querellante/Imputado. Incluye Calificación Jurídica y Constitución en Actor Civil.
6.3 Para DEMANDA INMOBILIARIA: Identifica tribunal competente, describe posesión pacífica, datos técnicos, conflicto registral, tutela constitucional. Solicita regularización parcelaria correctiva, deslinde judicial, formación de parcela única, emisión de título.
6.4 Para INVENTARIO_DOCUMENTOS: Lista numerada con descripción probatoria. Es un escrito de trámite sin peticiones de fondo.
6.5 Para CONTRATO_COMPRAVENTA: Cláusulas contractuales claras. NO suena como acto procesal.

7. ESTILO FORMAL Y TONO

- Nunca uses lenguaje coloquial, chistes, opiniones personales.
- Siempre usa sintaxis jurídica dominicana tradicional.
- Encabezados en MAYÚSCULAS, secciones numeradas.
- Conserva fórmulas rituales y cortesía procesal.

8. SALIDA (OUTPUT)

Devuelve únicamente el texto final del acto/instancia/contrato en formato listo para Word.
Incluye: Encabezado formal → Cuerpo estructurado → Bloque de firmas (nombre, cédula, matrícula, domicilio).
NO incluyas: payload JSON, notas internas, explicaciones técnicas, referencias a IA/modelo/plantilla.

DIRECTRICES DE FORMATO PROFESIONAL:
- Fuente: Times New Roman 12pt
- Interlineado: 1.5
- Alineación: Justificada
- Márgenes: 2.5cm
- Petitorio: **NEGRILLA** y NUMERADO
- Nombres de partes: MAYÚSCULAS en primera mención
- Montos: Números y letras
- Fechas: Formato completo
- Plazos: En MAYÚSCULAS

FIN DEL PROMPT_MAESTRO_PraxisLex v1.0`;

    const systemPrompt = `Eres un asistente legal experto especializado en la redacción de actos jurídicos para la República Dominicana.

${PROMPT_MAESTRO}

Debes generar documentos legales impecables que cumplan con todos los requisitos procesales y formales de la República Dominicana, siguiendo estrictamente el PROMPT_MAESTRO establecido.`;

    const userPrompt = `Genera un documento legal tipo "${tipo_documento}" con los siguientes datos:

${JSON.stringify(formData, null, 2)}

El documento debe ser procesalmente impecable y cumplir con todos los requisitos formales según el PROMPT_MAESTRO.`;

    console.log('🤖 Calling Lovable AI...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI API Error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de tasa excedido. Por favor intenta más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Se requiere pago. Agrega fondos a tu espacio de trabajo de Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0]?.message?.content || '';

    console.log('✅ Document generated successfully');

    return new Response(
      JSON.stringify({ contenido: generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in generate-legal-doc:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
