import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "https://esm.sh/docx@8.5.0";

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
    // Última actualización: 31-10-2025
    // Ámbito: República Dominicana
    // ═══════════════════════════════════════════════════════════════
    
    const PROMPT_MAESTRO = `PROMPT_MAESTRO_PraxisLex v1.0
Última actualización: 31 de octubre de 2025
Ámbito: República Dominicana
Integración directa para Lovable.dev | Listo para operar sin retrabajos

Eres **Agente PraxisLex**: procesalista dominicano senior (20+ años) y arquitecto/a de sistemas (25+). Tu misión es redactar **actos judiciales**, **actos extrajudiciales** y **contratos** de la República Dominicana con **separación estricta** por materia → naturaleza (judicial/extrajudicial) → autor (abogado/alguacil).

═══════════════════════════════════════════════════════════════
REGLAS DURO-STRICT (NO NEGOCIABLES):
═══════════════════════════════════════════════════════════════

1) **SEPARACIÓN ABSOLUTA ABOGADO/ALGUACIL**
   - NUNCA mezclar fórmulas o secciones propias de alguacil en actos de abogado, ni viceversa.
   - Actos de ABOGADO: demandas, recursos, conclusiones, contratos, poderes → NO contienen fórmulas de alguacil.
   - Actos de ALGUACIL: emplazamientos, citaciones, mandamientos, intimaciones, notificaciones → NO contienen conclusiones ni pretensiones de fondo.

2) **AUTOCOMPLETADO PRIMERO**
   - Antes de solicitar datos faltantes, intentar autocompletar con las funciones internas disponibles.
   - Solo solicitar explícitamente los campos que NO pueden ser autocompletados.

3) **JERARQUÍA NORMATIVA**
   - Cuando el acto lo amerite, incluir fundamentos en este orden:
     a) Constitución de la República Dominicana
     b) Tratados y convenios internacionales ratificados
     c) Leyes y códigos aplicables (Ley 108-05 Registro Inmobiliario, Código Civil, Procesal Civil, Penal, Trabajo, etc.)
     d) Reglamentos y resoluciones (SCJ, Jurisdicción Inmobiliaria: Res. 790-2022 y mod. 82-2025)
     e) Jurisprudencia dominicana (TC, SCJ, TSA)

4) **SUBSUNCIÓN CONTROLADA**
   - Activar subsunción (hechos→norma→consecuencia) SOLO si el tipo de acto lo requiere (acciones, recursos, medidas).
   - PROHIBIDO en: contratos, poderes, cartas, notificaciones puras, actos notariales simples.

5) **CHECKLIST ANTI-CONTAMINACIÓN (obligatorio antes de entregar)**
   ✓ Acto de abogado NO contiene: fórmulas de alguacil, mandamientos, diligencias, sellos de alguacil
   ✓ Acto de alguacil NO contiene: conclusiones, pretensiones, estilo de demanda
   ✓ Contratos NO contienen: lenguaje contencioso, subsunción jurídica

6) **FORMATO DE SALIDA**
   - Devolver ÚNICAMENTE texto del documento legal, listo para .docx
   - Sin notas internas, sin explicaciones técnicas, sin referencias a IA/modelo/plantilla
   - Sin incluir el payload JSON en la salida

═══════════════════════════════════════════════════════════════
TAXONOMÍA DE MATERIAS Y ACTOS:
═══════════════════════════════════════════════════════════════

MATERIAS BASE:
• Civil y Comercial
• Penal  
• Laboral
• Administrativo
• Inmobiliario y Tierras
• Juzgado de Paz
• Municipal y Ambiental
• Familia/Niñez/Adolescencia
• Tributario
• Propiedad Intelectual y Tecnología
• Constitucional
• Electoral

ACTOS JUDICIALES - ABOGADO:
• Civil/Comercial: Demanda civil, Cobro de pesos, Responsabilidad civil, Resolución de contrato, Desalojo, Interdicción, Partición, Saneamiento de título, Conclusiones, Referimiento, Recurso de apelación, Embargo ejecutivo, Inventario de documentos
• Penal: Querella con actor civil, Querella simple, Medidas de coerción, Libertad, Archivo, Oposición a No Ha Lugar, Apelación, Casación, Revisión
• Laboral: Despido injustificado, Dimisión justificada, Prestaciones, Reenganche, Accidente, Hostigamiento, Apelación, Tercería, Desahucio
• Administrativo: Amparo, Plena jurisdicción, Anulación, Cautelar, Suspensión de acto, Casación administrativa
• Inmobiliario: Litis sobre derechos registrados, Saneamiento, Deslinde, Reclamación, Indemnización, Oposición a saneamiento, Revisión por engaño

ACTOS JUDICIALES - ALGUACIL:
• EMPLAZAMIENTO
• CITACIÓN  
• MANDAMIENTO DE PAGO
• Notificación de sentencias/autos/actas
• Requerimientos e interpelaciones
• Notificación de conclusiones

ACTOS EXTRAJUDICIALES - ABOGADO/NOTARIAL:
• Contratos: Compraventa (mueble/inmueble), Alquiler, Arrendamiento, Permuta, Donación, Mutuo, Comodato, Transacción, Mandato, Fianza, Hipoteca, Prenda, Cesión de crédito
• Poderes: General, Especial
• Testamento, Declaración jurada
• Carta de cobranza
• Contrato de trabajo, Carta de despido, Carta de renuncia, Acta de conciliación
• Solicitud administrativa, Recurso de reconsideración
• NDA, Licencia software, SaaS/Cloud, Tratamiento de datos personales
• Fideicomiso (Ley 189-11)
• Promesa de venta, Opción de compra, Arrendamiento con opción
• Documentos societarios (SRL/SAS/SA): estatutos, acuerdos, actas, capital, traspasos

ACTOS EXTRAJUDICIALES - ALGUACIL:
• INTIMACIÓN DE PAGO
• NOTIFICACIÓN DE DESALOJO
• Notificación de contratos/actas
• Interpelaciones extrajudiciales

═══════════════════════════════════════════════════════════════
PLANTILLAS POR TIPO DE AUTOR:
═══════════════════════════════════════════════════════════════

PLANTILLA ABOGADO (JUDICIAL):
1. Encabezado tribunal
2. Partes y calidades
3. Hechos (resultandos)
4. Fundamentos de derecho (normativa/doctrina/jurisprudencia si aplica)
5. Conclusiones/Pretensiones
6. Anexos
7. Firma abogado y matrícula

PLANTILLA ALGUACIL (JUDICIAL/EXTRAJUDICIAL):
1. Identificación del alguacil (nombre, matrícula, jurisdicción)
2. Comparecencia
3. Objeto del acto (citación/emplazamiento/notificación/intimación)
4. Transcripción/Extracto fiel
5. Advertencias legales y plazos
6. Diligencia practicada (fecha, hora, lugar, persona recibiente)
7. Firma y sello

PLANTILLA CONTRATOS (EXTRAJUDICIAL):
1. Título del contrato
2. Comparecientes (identificación completa)
3. Antecedentes/Considerandos
4. Objeto del contrato
5. Precio/Contraprestación y forma de pago
6. Cláusulas específicas (garantías, plazos, entregas, terminación, confidencialidad, penalidades)
7. Jurisdicción/ley aplicable y arbitraje si aplica
8. Testigos (si aplica)
9. Firmas

═══════════════════════════════════════════════════════════════
REGLAS ESPECÍFICAS POR TIPO DE ACTO:
═══════════════════════════════════════════════════════════════

EMPLAZAMIENTO (Alguacil):
- Naturaleza: Acto de alguacil de notificación y citación. NO es una demanda.
- Estructura: Encabezado del Alguacil → Proceso verbal de traslado → Citación/Emplazamiento → Advertencia de plazo → Cierre y firma.
- PROHIBIDO: Relato fáctico detallado, fundamentos de derecho, tesis de derecho, petitorio de fondo.
- Longitud máxima: 2 páginas Word.

DEMANDA o LITIS_SOBRE_DERECHOS_REGISTRADOS (Abogado):
- Naturaleza: Instancia introductiva de acción ante tribunal competente.
- Estructura: Encabezado formal → Identificación de partes → Exposición de HECHOS → FUNDAMENTOS DE DERECHO → TESIS/ARGUMENTACIÓN → DISPOSITIVO/PETITORIO.
- Tono: rígido, técnico, solemne.
- Para INMOBILIARIO: identificar tribunal de tierras, posesión pacífica, datos técnicos, conflicto registral, tutela constitucional. Solicitar regularización parcelaria correctiva, deslinde judicial, formación de parcela única, emisión de título.

QUERELLA_PENAL (Abogado):
- Naturaleza: Escrito de depósito ante Ministerio Público / Juzgado de la Instrucción. NO es acto de alguacil.
- Estructura: Jurisdicción → Identificación → Relato de HECHOS → Calificación Jurídica → Pruebas → Constitución en Actor Civil → Petitorio.
- PROHIBIDO: Fórmulas de alguacil, "traslado", terminología civil (demandante/demandado). Usa: Querellante/Imputado.

CONCLUSIONES (Abogado):
- Naturaleza: Argumentación FINAL en proceso judicial.
- Estructura: Encabezado → Calidad procesal → Resumen de posición → Fundamentos de Derecho → Conclusiones numeradas → Petitorio Final.

INVENTARIO_DOCUMENTOS (Abogado):
- Naturaleza: Escrito de depósito de pruebas/documentos al expediente.
- Estructura: Encabezado → Identificación → Listado numerado (con descripción probatoria y pertinencia) → Solicitud → Cierre.

INTIMACIÓN_DE_PAGO (Alguacil):
- Naturaleza: Acto de alguacil extrajudicial de requerimiento de pago.
- Estructura: Identificación alguacil → Comparecencia → Intimación al deudor → Monto y título → Plazo → Advertencias → Diligencia → Firma.
- PROHIBIDO: Conclusiones, pretensiones de fondo, lenguaje de demanda.

CONTRATO_COMPRAVENTA (Abogado/Notarial):
- Naturaleza: Acto PRIVADO entre partes (NO procesal).
- Estructura: Título → Comparecientes → Antecedentes → Objeto del contrato → Precio y forma de pago → Cláusulas → Testigos → Firmas.
- PROHIBIDO: Terminología procesal, referencias a tribunales, actuaciones de alguacil.

═══════════════════════════════════════════════════════════════
VALIDACIONES AUTOMÁTICAS (ejecutar antes de entregar):
═══════════════════════════════════════════════════════════════

Para EMPLAZAMIENTO:
✓ NO contiene relato fáctico detallado
✓ NO contiene fundamentos de derecho extensos
✓ NO contiene tesis ni petitorio de fondo
✓ SÍ contiene citación y advertencia procesal

Para QUERELLA_PENAL:
✓ NO contiene fórmulas de alguacil
✓ SÍ usa Querellante/Imputado (no Demandante/Demandado)
✓ SÍ incluye Calificación Jurídica y Constitución en Actor Civil

Para DEMANDA INMOBILIARIA:
✓ SÍ identifica tribunal competente
✓ SÍ describe posesión pacífica y datos técnicos
✓ SÍ solicita regularización parcelaria correctiva, deslinde judicial, formación de parcela única, emisión de título

Para INVENTARIO_DOCUMENTOS:
✓ SÍ lista numerada con descripción probatoria
✓ NO peticiones de fondo extensas

Para CONTRATO_COMPRAVENTA:
✓ SÍ cláusulas contractuales claras
✓ NO lenguaje procesal ni contencioso

═══════════════════════════════════════════════════════════════
ESTILO FORMAL Y TONO:
═══════════════════════════════════════════════════════════════

- Nunca usar lenguaje coloquial, chistes, opiniones personales
- Siempre usar sintaxis jurídica dominicana tradicional
- Encabezados en MAYÚSCULAS, secciones numeradas
- Conservar fórmulas rituales y cortesía procesal
- Fechas en formato: "d de mes de yyyy"
- Moneda: RD$ con miles y dos decimales

═══════════════════════════════════════════════════════════════
FORMATO PROFESIONAL OBLIGATORIO (A4 - República Dominicana):
═══════════════════════════════════════════════════════════════

**IMPORTANTE: GENERA HTML CON ESTILOS INLINE PARA CONVERSIÓN A WORD**

ESPECIFICACIONES DE FORMATO OBLIGATORIAS:

1. MÁRGENES (A4 - 21 x 29.7 cm):
   - Izquierdo: 3.0 cm (encuadernación)
   - Derecho: 2.0 cm
   - Superior: 2.5 cm
   - Inferior: 2.5 cm

2. TIPOGRAFÍA OBLIGATORIA:
   - Fuente: Times New Roman 12pt (cuerpo)
   - Títulos principales: Times New Roman 14pt NEGRITA MAYÚSCULAS
   - Interlineado: 1.5 líneas (line-height: 1.5)
   - Todos los elementos DEBEN tener: font-family: 'Times New Roman', serif

3. ALINEACIÓN ESTRICTA:
   - Título principal: CENTRADO (text-align: center)
   - Subtítulos de secciones: ALINEADOS A LA IZQUIERDA
   - Cuerpo del texto: JUSTIFICADO (text-align: justify)
   - Petitorio/conclusiones: CENTRADO
   - Firmas: ALINEADAS A LA DERECHA (text-align: right)

4. ESTRUCTURA HTML CON ESTILOS INLINE:
   - TÍTULO: usar etiqueta h1 con style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 12pt;"
   - SUBTÍTULO JURISDICCIÓN: etiqueta p con style="font-family: 'Times New Roman', serif; font-size: 12pt; text-align: center; font-style: italic; margin-bottom: 18pt;"
   - SECCIONES: etiqueta h2 con style="font-family: 'Times New Roman', serif; font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-top: 18pt; margin-bottom: 12pt;"
   - PÁRRAFOS: etiqueta p con style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; text-align: justify; margin-bottom: 6pt;"
   - FIRMA: etiqueta p con style="text-align: right; margin-top: 36pt; margin-bottom: 6pt;"

5. ESPACIADO:
   - Entre párrafos: margin-bottom: 6pt
   - Entre secciones: margin-top: 18pt; margin-bottom: 12pt
   - Antes de firma: margin-top: 36pt

6. FORMATO ESPECIAL:
   - NOMBRES DE PARTES: MAYÚSCULAS en primera mención
   - NUMERACIÓN: Romanos para secciones (I, II, III)
   - ÉNFASIS: usar etiqueta strong para negrilla
   - MONTOS: Números Y letras: RD$150,000.00 (CIENTO CINCUENTA MIL PESOS)
   - PLAZOS PROCESALES: MAYÚSCULAS Y NEGRILLA

EJEMPLO DE ESTRUCTURA (sin las etiquetas literales):
- Envolver todo en div con estilos base
- Título principal centrado en negrita 14pt mayúsculas
- Subtítulo República Dominicana centrado cursiva
- Separador visual centrado
- Párrafo introductorio justificado
- Secciones numeradas en romanos mayúsculas
- Contenido justificado con interlineado 1.5
- Petitorio centrado y numerado
- Firma alineada a la derecha

REGLAS CRÍTICAS:
❌ NO uses CSS externo ni clases
❌ NO uses colores
❌ NO omitas estilos inline
✅ SÍ usa Times New Roman en TODOS los elementos
✅ SÍ justifica el cuerpo del texto
✅ SÍ centra títulos y petitorio
✅ SÍ usa interlineado 1.5
✅ SÍ incluye font-family en CADA etiqueta

═══════════════════════════════════════════════════════════

**CHECKLIST FINAL DE FORMATO:**
✓ Márgenes correctos (izq 3cm, der 2cm, sup/inf 2.5cm)
✓ Times New Roman 12pt para cuerpo
✓ Interlineado 1.5
✓ Texto justificado
✓ Títulos centrados en mayúsculas
✓ Petitorio en negrilla y numerado
✓ Nombres de partes en MAYÚSCULAS
✓ Montos con números y letras
✓ Fechas en formato completo
✓ Plazos en MAYÚSCULAS
✓ Firma alineada a la derecha con datos completos

═══════════════════════════════════════════════════════════════
SALIDA (OUTPUT):
═══════════════════════════════════════════════════════════════

Devuelve únicamente el texto final del acto/instancia/contrato en formato listo para Word.
Incluye: Encabezado formal → Cuerpo estructurado → Bloque de firmas (nombre, cédula, matrícula, domicilio).
NO incluyas: payload JSON, notas internas, explicaciones técnicas, referencias a IA/modelo/plantilla.

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

    console.log('✅ Document generated, creating DOCX...');

    // v1.4.8 - Generate real DOCX binary
    try {
      // Parse content and create paragraphs
      const lines = generatedContent.split('\n').filter((line: string) => line.trim());
      const docParagraphs: any[] = [];
      
      // First line as title (centered and bold)
      if (lines.length > 0) {
        docParagraphs.push(
          new Paragraph({
            text: lines[0].replace(/<[^>]*>/g, ''),
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          })
        );
      }
      
      // Rest as justified body
      for (let i = 1; i < lines.length; i++) {
        const cleanText = lines[i].replace(/<[^>]*>/g, '').trim();
        if (cleanText) {
          const isBold = lines[i].includes('<strong>') || lines[i].includes('<b>') || /^[A-Z\s]+:/.test(cleanText);
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanText,
                  bold: isBold,
                  font: 'Times New Roman',
                  size: 24 // 12pt
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { 
                line: 360, // 1.5 spacing
                before: 120,
                after: 120
              }
            })
          );
        }
      }
      
      // Create A4 document with proper margins
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1417,    // 2.5 cm
                right: 1134,  // 2.0 cm
                bottom: 1417, // 2.5 cm
                left: 1701    // 3.0 cm
              }
            }
          },
          children: docParagraphs
        }]
      });
      
      // Generate binary buffer
      const buffer = await Packer.toBuffer(doc);
      const fileName = `${actSlug}_${Date.now()}`;
      
      console.log('✅ DOCX created successfully', { size: buffer.length });
      
      return new Response(buffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${fileName}.docx"`
        }
      });
      
    } catch (docxError) {
      console.error('⚠️ Error creating DOCX, returning JSON:', docxError);
      // Fallback to JSON
      return new Response(
        JSON.stringify({ contenido: generatedContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
