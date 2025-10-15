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

    const materiaRaw = requestBody.materia || 'civil';
    const mapeoMaterias: Record<string, string> = {
      'civil y comercial': 'civil',
      'civil': 'civil',
      'penal': 'penal',
      'laboral': 'laboral',
      'administrativo': 'administrativo',
      'familia': 'familia',
      'inmobiliario': 'inmobiliario',
      'tributario': 'tributario',
      'comercial': 'comercial'
    };
    const materia = mapeoMaterias[materiaRaw.toLowerCase()] || 'civil';
    
    const jerarquiaNormativa = [
      "Constitución de la República",
      "Tratados Internacionales",
      "Leyes Ordinarias y Códigos",
      "Reglamentos",
      "Decretos",
      "Resoluciones",
      "Circulares"
    ];
    
    const jerarquiaNormativaMarkdown = jerarquiaNormativa.map((item, index) => `${index + 1}. ${item}`).join("\\n");

    // ═══════════════════════════════════════════════════════════════
    // SISTEMA DE MANDATOS Y MODELOS DE ACTOS JURÍDICOS v1.0
    // Autor: Manus AI | Fecha: 15 de octubre de 2025
    // Basado en: Documento Maestro de Integración
    // ═══════════════════════════════════════════════════════════════
    
    // MANDATOS DE CORRECCIÓN CRÍTICOS
    // Resuelven errores identificados:
    // 1. ❌ Emplazamientos con estructura de demanda → CORREGIDO
    // 2. ❌ Querellas como actos de alguacil → CORREGIDO
    // 3. ❌ Materias judiciales mal clasificadas → CORREGIDO
    
    const mandatos: Record<string, string> = {
      'demanda_civil': `
═══════════════════════════════════════════════════════════════
MANDATO: ACTO DE TRASLADO (DEMANDA CIVIL)
Versión 1.0 | Basado en: Modelo DEMANDAENDEVOLUCIONVALORES.pdf
═══════════════════════════════════════════════════════════════

⚠️ NATURALEZA DUAL: Este acto es SIMULTÁNEAMENTE:
1. Demanda de Fondo (argumentación completa)
2. Acto de Emplazamiento (citación por alguacil)

ESTRUCTURA OBLIGATORIA COMPLETA:

1. ENCABEZADO FORMAL
- Tribunal competente
- Partes: Demandante vs. Demandado
- Número expediente (si existe)
- Times New Roman 12pt, interlineado 1.5, justificado

2. DESIGNACIÓN DEL ALGUACIL

"Yo, [NOMBRE], Alguacil Ordinario adscrito al [TRIBUNAL], Cédula No. [NÚMERO],
actuando a requerimiento de [DEMANDANTE], representado por Lcdo. [NOMBRE],
Matrícula CARD No. [NÚMERO], con estudio en [DIRECCIÓN], donde hace ELECCIÓN DE DOMICILIO."

3. PROCESO VERBAL DE TRASLADO

"ME TRASLADÉ el [FECHA], a las [HORA], al domicilio de [DEMANDADO],
ubicado en [DIRECCIÓN], donde hablando con [PERSONA, CARGO], le hice saber
y entregué copia íntegra del presente acto."

4. CITACIÓN Y EMPLAZAMIENTO

"CITA Y EMPLAZA a [DEMANDADO] para que dentro de la OCTAVA (8) FRANCA,
constituya abogado y fije domicilio en [CIUDAD], bajo apercibimiento de DEFECTO."

5. RELATO FÁCTICO DETALLADO (Mínimo 3 párrafos)
- Origen de la relación jurídica
- Hechos cronológicos relevantes
- Incumplimientos y perjuicios

6. ASPECTOS REGULATORIOS (Jerarquía normativa)
- Constitución de la República
- Tratados Internacionales
- Códigos y Leyes especiales
- Citas textuales de artículos

7. TESIS DE DERECHO
- Subsunción hechos-norma
- Obligaciones incumplidas
- Jurisprudencia aplicable

8. DISPOSITIVOS (PETITORIO EN NEGRILLA)
**PRIMERO:** Declarar buena y válida la demanda.
**SEGUNDO:** Acogerla en cuanto al fondo.
**TERCERO:** [Dispositivo específico con montos]
**CUARTO:** Condena a COSTAS con DISTRACCIÓN en favor del abogado.

9. DECLARACIÓN MINISTERIAL

"DOY FE: Entregué copia íntegra. [FOLIOS] fojas útiles.
Iniciado [HORA], concluido [HORA]. Costo: RD$ [MONTO]"
[Firma y Sello del Alguacil]

✅ VERIFICACIONES:
- Octava (8) Franca mencionada
- Elección de domicilio del abogado
- Petitorio en negrilla numerado
- Costas con distracción
- Firma y certificación del alguacil
`,
      'emplazamiento': `
═══════════════════════════════════════════════════════════════
⚠️ MANDATO CRÍTICO: EMPLAZAMIENTO PURO
Corrección de Error Procesal Crítico Identificado
═══════════════════════════════════════════════════════════════

⛔ REGLA FUNDAMENTAL:
EMPLAZAMIENTO ≠ DEMANDA
Es un ACTO DE NOTIFICACIÓN PURA para CITAR a comparecer.

⛔ ELIMINACIÓN OBLIGATORIA (ERROR CRÍTICO):
❌ Relato Fáctico detallado
❌ Fundamentos de Derecho  
❌ Aspectos Regulatorios extensos
❌ Tesis de Derecho
❌ Argumentación jurídica
❌ Petitorio con dispositivos

ESTRUCTURA MINIMALISTA (MÁXIMO 2 PÁGINAS):

1. ENCABEZADO

"ACTO No. [NÚMERO]
Alguacilazgo del [TRIBUNAL]"

2. DESIGNACIÓN

"Yo, [NOMBRE], Alguacil Ordinario, Cédula No. [NÚMERO]"

3. ACTUANDO A REQUERIMIENTO

"De [DEMANDANTE], asistido por Lcdo. [NOMBRE],
Matrícula CARD [NÚMERO], estudio en [DIRECCIÓN] (ELECCIÓN DE DOMICILIO)."

4. TRASLADO

"ME TRASLADÉ el [FECHA], a las [HORA], al domicilio de [DEMANDADO]
en [DIRECCIÓN], donde hablando con [PERSONA/CARGO]"

5. NOTIFICACIÓN Y CITACIÓN (EL AVENIR)

"Le notifiqué que ha sido demandado en [OBJETO BREVE - máximo 2 líneas]
ante [TRIBUNAL].

Se le CITA Y EMPLAZA para que dentro de la OCTAVA (8) FRANCA,
constituya abogado en [CIUDAD], bajo apercibimiento de DEFECTO."

O (si es para audiencia):

"Se le CITA para comparecer el [FECHA], a las [HORA], en [SALA/TRIBUNAL]."

6. ADVERTENCIA

"Se advierte que de no comparecer, será declarado en DEFECTO."

7. CIERRE

"Le dejé copia íntegra. [FOLIOS] fojas.
Iniciado [HORA], concluido [HORA]. Costo: RD$ [MONTO]"
[Firma y Sello]

✅ VERIFICACIONES:
- Longitud MÁXIMA: 2 páginas
- NO contiene relato fáctico
- NO contiene fundamentos
- Objeto en máximo 2 líneas
- Tono: formal, notificatorio, sin argumentación
`,
      'querella_penal': `
═══════════════════════════════════════════════════════════════
⚠️ MANDATO CRÍTICO: QUERELLA PENAL CON CONSTITUCIÓN EN ACTOR CIVIL
Corrección de Error de Naturaleza Identificado
═══════════════════════════════════════════════════════════════

⛔ ERROR MÁS GRAVE:
QUERELLA ≠ ACTO DE ALGUACIL
Es un ESCRITO que se DEPOSITA en Fiscalía/Juzgado de Instrucción.

⛔ NO INCLUIR:
❌ Designación de alguacil
❌ Proceso verbal de traslado
❌ Terminología civil (demandante/demandado)

TERMINOLOGÍA CORRECTA:
✅ Querellante (víctima)
✅ Imputado (acusado)
✅ Infracción penal
✅ Ministerio Público
✅ Juez de la Instrucción

ESTRUCTURA:

1. JURISDICCIÓN

"AL MINISTERIO PÚBLICO DEL [Distrito]"
O "AL JUZGADO DE LA INSTRUCCIÓN DE [Jurisdicción]"

2. IDENTIFICACIÓN
- QUERELLANTE: [datos completos de víctima]
- IMPUTADO: [datos del acusado]

3. EXPOSICIÓN DE HECHOS (DETALLADA)
Relato cronológico: ¿Qué? ¿Cuándo? ¿Dónde? ¿Cómo?

4. CALIFICACIÓN JURÍDICA

"Constituye [INFRACCIÓN] (Art. [NÚMERO] del [CÓDIGO/LEY])"

5. PRUEBAS
- Documentales (contratos, recibos, correos)
- Testimoniales (testigos)
- Periciales (peritajes técnicos)

6. CONSTITUCIÓN EN ACTOR CIVIL

"[Nombre] se constituye en ACTOR CIVIL y reclama:
- Daños materiales: RD$ [MONTO]
- Daños morales: RD$ [MONTO]"

7. PETITORIO
- Apertura de investigación
- Medidas de coerción
- Envío a juicio
- Condena penal e indemnización civil

✅ FORMATO: Escrito para DEPOSITAR, NO acto de alguacil
`,
      'inventario_documentos': `
═══════════════════════════════════════════════════════════════
MANDATO: INVENTARIO DE DOCUMENTOS
═══════════════════════════════════════════════════════════════

NATURALEZA: Escrito de MERO TRÁMITE para registrar documentos depositados.

⛔ NO INCLUIR:
❌ Argumentos de fondo
❌ Peticiones sustantivas
❌ Conclusiones extensas

ESTRUCTURA:

1. ENCABEZADO
- Tribunal y Expediente
- "DEPÓSITO DE DOCUMENTOS"
- Abogado depositante

2. IDENTIFICACIÓN

"[Nombre], en calidad de [Demandante/Demandado] en el caso [Número]"

3. LISTADO NUMERADO (cada uno con):
- Número secuencial
- Tipo de documento
- Fecha del documento
- Emisor/Instrumentador

Ejemplo:

"1. Contrato de Alquiler de fecha 15/03/2024,
    legalizado por el Notario Lic. Juan Pérez.
 2. Recibo de pago No. 12345 de fecha 20/03/2024,
    emitido por ABC Inmobiliaria."

4. SOLICITUD

"Solicitamos a la Secretaría tenga por depositados los documentos
inventariados y los anexe al expediente."

5. CIERRE
Lugar, fecha y firma del abogado.

✅ CLARIDAD: Cada documento identificable sin ambigüedad
`,
      'conclusiones': `
═══════════════════════════════════════════════════════════════
MANDATO: ESCRITO DE CONCLUSIONES
═══════════════════════════════════════════════════════════════

NATURALEZA: Argumentación FINAL antes del cierre de debates.

ESTRUCTURA:

1. ENCABEZADO
Tribunal, Expediente, Parte que concluye

2. CALIDAD PROCESAL

"[Nombre], [Demandante/Demandado] en el presente proceso"

3. RESUMEN DE POSICIÓN
Síntesis de argumentos principales (2-3 párrafos)

4. FUNDAMENTOS DE DERECHO
Normas que sustentan la posición

5. CONCLUSIONES FORMALES (NUMERADAS)
**PRIMERA:** [Posición sobre validez procesal]
**SEGUNDA:** [Posición sobre fondo del asunto]
**TERCERA:** [Petición específica]
**CUARTA:** [Reserva de derechos]

6. PETITORIO FINAL

"Por tales motivos, solicitamos al Tribunal dictar sentencia
conforme a derecho acogiendo estas conclusiones."

Lugar, fecha y firma.

✅ CLARIDAD: Conclusiones numeradas y específicas
`,
      'contrato_compraventa': `
═══════════════════════════════════════════════════════════════
MANDATO: CONTRATO DE COMPRAVENTA INMOBILIARIA
Corrección de Clasificación: ACTO EXTRAJUDICIAL
═══════════════════════════════════════════════════════════════

⚠️ NATURALEZA: Acto PRIVADO entre partes (NO procesal)

⛔ NO INCLUIR:
❌ Terminología procesal (demandante, petitorio)
❌ Referencias a tribunales
❌ Actuaciones de alguacil

TERMINOLOGÍA CORRECTA:
✅ VENDEDOR / COMPRADOR
✅ PARTES CONTRATANTES
✅ CLÁUSULAS (no dispositivos)
✅ CONSENTIMIENTO
✅ PRECIO y FORMA DE PAGO

ESTRUCTURA:

1. TÍTULO

"CONTRATO DE COMPRAVENTA INMOBILIARIA"

2. COMPARECIENTES

"VENDEDOR: [Nombre], cédula [Número], domiciliado en [Dirección]
 COMPRADOR: [Nombre], cédula [Número], domiciliado en [Dirección]"

3. ANTECEDENTES
Propiedad del vendedor (matrícula, certificado de título)

4. OBJETO DEL CONTRATO
Descripción detallada del inmueble:
- Ubicación exacta
- Linderos (Norte, Sur, Este, Oeste)
- Área en metros cuadrados
- Matrícula del Registro de Títulos

5. PRECIO Y FORMA DE PAGO
- Precio total pactado
- Forma de pago (contado, financiado)
- Fechas de pagos parciales

6. CLÁUSULAS PRINCIPALES
- Tradición del inmueble
- Saneamiento
- Gastos de transferencia
- Penalidades por incumplimiento
- Obligaciones del vendedor
- Obligaciones del comprador

7. TESTIGOS (opcional)
Datos de 2 testigos

8. LUGAR, FECHA Y FIRMAS
- Vendedor
- Comprador
- Testigos

✅ LENGUAJE: Contractual, privado, NO procesal
`
    };

    const mandatoEspecifico = mandatos[tipo_documento] || '';

    const systemPrompt = `Eres un asistente legal experto especializado en la redacción de actos jurídicos para la República Dominicana.

${mandatoEspecifico}

DIRECTRICES DE DISEÑO Y FORMATO PROFESIONAL:

TIPOGRAFÍA:
- Fuente: Times New Roman o Georgia (fuentes serif profesionales)
- Tamaño: 12pt para cuerpo, 14pt para títulos
- Interlineado: 1.5 (doble espacio entre párrafos)
- Alineación: Justificada

ESPACIADO Y MÁRGENES:
- Márgenes: 2.5cm todos los lados
- Sangría primera línea: 1.27cm
- Espacio entre secciones: 2 líneas en blanco

JERARQUÍA VISUAL:
- TÍTULOS DE SECCIÓN: MAYÚSCULAS, NEGRILLA, CENTRADO
- Subtítulos: Primera Letra Mayúscula, Negrilla, Alineado izquierda
- Numeración: Romana para secciones principales (I, II, III)
- Listas: Números arábigos o viñetas según corresponda

ELEMENTOS DESTACADOS:
- Petitorio: **NEGRILLA** y NUMERADO
- Nombres de partes: MAYÚSCULAS en primera mención
- Montos: Números y letras (Ej: "RD$100,000.00 (CIEN MIL PESOS 00/100)")
- Fechas: Formato completo (15 de octubre de 2025)
- Plazos: En MAYÚSCULAS (OCTAVA FRANCA)

PROFESIONALISMO:
- Lenguaje formal y técnico
- Sin errores ortográficos
- Terminología jurídica precisa
- Coherencia en numeración
- Citas legales completas

Debes generar documentos legales impecables que cumplan con todos los requisitos procesales
y formales de la República Dominicana, siguiendo estrictamente los mandatos establecidos.`;

    const specificInstructions = mandatoEspecifico 
      ? `

🔍 MANDATO ESPECÍFICO PARA ESTE TIPO DE ACTO:
${mandatoEspecifico}

Sigue ESTRICTAMENTE este mandato.`
      : '';

    const userPrompt = `Genera un documento legal tipo "${tipo_documento}" con los siguientes datos:

${JSON.stringify(formData, null, 2)}

${specificInstructions}

El documento debe ser procesalmente impecable y cumplir con todos los requisitos formales.`;

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
