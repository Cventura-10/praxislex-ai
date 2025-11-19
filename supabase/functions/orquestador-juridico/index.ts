import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// ORQUESTADOR JURÍDICO - Cerebro del AI-OS
// ============================================================

interface OrquestadorRequest {
  message: string;
  context_type?: string;
  context_id?: string;
  conversation_id?: string;
}

interface IntentClassification {
  intent: string;
  confidence: number;
  agent: string;
  parameters?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Rate limit: 30 mensajes por minuto
    const { data: rateLimitOk } = await supabaseClient.rpc('check_edge_function_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'orquestador-juridico',
      p_max_per_minute: 30,
      p_max_per_hour: 500,
    });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Límite de mensajes excedido. Intenta en unos segundos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: OrquestadorRequest = await req.json();
    const { message, context_type = 'general', context_id, conversation_id } = body;

    if (!message || message.trim() === '') {
      throw new Error('El mensaje no puede estar vacío');
    }

    console.log('[Orquestador] Mensaje recibido:', message.substring(0, 100));

    // ============================================================
    // PASO 1: Obtener o crear conversación
    // ============================================================
    let activeConversationId = conversation_id;
    
    if (!activeConversationId) {
      const { data: convId } = await supabaseClient.rpc('get_or_create_active_conversation', {
        p_user_id: user.id,
        p_context_type: context_type,
        p_context_id: context_id || null,
      });
      activeConversationId = convId;
    }

    console.log('[Orquestador] Conversación:', activeConversationId);

    // ============================================================
    // PASO 2: Guardar mensaje del usuario
    // ============================================================
    await supabaseClient.from('chat_messages').insert({
      conversation_id: activeConversationId,
      role: 'user',
      content: message,
    });

    // ============================================================
    // PASO 3: Clasificar intención usando Lovable AI
    // ============================================================
    const classification = await classifyIntent(message, context_type);
    
    console.log('[Orquestador] Intención detectada:', classification.intent, 
                'Confianza:', classification.confidence);

    // ============================================================
    // PASO 4: Delegar al agente especializado
    // ============================================================
    const agentResponse = await routeToAgent(
      supabaseClient,
      user.id,
      classification,
      message,
      context_type,
      context_id
    );

    // ============================================================
    // PASO 5: Guardar respuesta del asistente
    // ============================================================
    await supabaseClient.from('chat_messages').insert({
      conversation_id: activeConversationId,
      role: 'assistant',
      content: agentResponse.content,
      agent_name: classification.agent,
      intent_detected: classification.intent,
      confidence: classification.confidence,
      tool_calls: agentResponse.tool_calls || [],
      tool_results: agentResponse.tool_results || [],
      metadata: agentResponse.metadata || {},
    });

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: activeConversationId,
        intent: classification.intent,
        agent: classification.agent,
        response: agentResponse.content,
        confidence: classification.confidence,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Orquestador] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error al procesar el mensaje' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================
// CLASIFICADOR DE INTENCIONES (usando Lovable AI)
// ============================================================
async function classifyIntent(
  message: string, 
  context_type: string
): Promise<IntentClassification> {
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY no configurada');
  }

  // Prompt de clasificación
  const systemPrompt = `Eres un clasificador de intenciones para un sistema jurídico.
Analiza el mensaje del usuario y clasifica su intención en UNA de estas categorías:

INTENCIONES DISPONIBLES:
- consultar_casos: Ver, buscar o listar casos/expedientes
- crear_caso: Crear un nuevo caso o expediente
- actualizar_caso: Modificar datos de un caso existente
- consultar_clientes: Ver o buscar clientes
- crear_cliente: Registrar un nuevo cliente
- generar_documento: Redactar un documento jurídico
- buscar_jurisprudencia: Buscar precedentes, sentencias, doctrina
- agendar_audiencia: Crear o consultar audiencias/citas
- consultar_plazos: Ver plazos procesales pendientes
- generar_factura: Crear una factura o consultar facturación
- ayuda_general: Preguntas generales sobre el sistema

Responde SOLO con un JSON en este formato (sin markdown):
{
  "intent": "nombre_de_la_intencion",
  "confidence": 0.95,
  "agent": "nombre_del_agente",
  "parameters": {}
}

Agentes disponibles:
- AgenteGestiónCasos
- AgenteGestiónClientes
- AgenteDocumentosRedacción
- AgenteJurisprudencia
- AgenteAudienciasCalendario
- AgenteFacturación
- AgenteAyudaGeneral`;

  const userPrompt = `Contexto actual: ${context_type}
Mensaje del usuario: "${message}"

Clasifica la intención:`;

  try {
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
        temperature: 0.3, // Baja temperatura para clasificación consistente
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit de IA excedido');
      }
      if (response.status === 402) {
        throw new Error('Créditos de IA agotados');
      }
      throw new Error(`Error en clasificación: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extraer JSON del contenido (por si viene con markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const classification = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return classification;

  } catch (error) {
    console.error('[Clasificador] Error:', error);
    // Fallback: clasificación por palabras clave
    return fallbackClassification(message, context_type);
  }
}

// ============================================================
// CLASIFICACIÓN FALLBACK (sin IA)
// ============================================================
function fallbackClassification(message: string, context_type: string): IntentClassification {
  const lower = message.toLowerCase();
  
  // Keywords para cada intención
  if (lower.match(/crear|nuevo|registrar/i) && lower.match(/caso|expediente/i)) {
    return { intent: 'crear_caso', confidence: 0.7, agent: 'AgenteGestiónCasos' };
  }
  if (lower.match(/crear|nuevo|agregar/i) && lower.match(/cliente/i)) {
    return { intent: 'crear_cliente', confidence: 0.7, agent: 'AgenteGestiónClientes' };
  }
  if (lower.match(/demanda|escrito|documento|redact/i)) {
    return { intent: 'generar_documento', confidence: 0.7, agent: 'AgenteDocumentosRedacción' };
  }
  if (lower.match(/jurisprudencia|sentencia|precedente|fallo/i)) {
    return { intent: 'buscar_jurisprudencia', confidence: 0.7, agent: 'AgenteJurisprudencia' };
  }
  if (lower.match(/audiencia|cita|agendar|calendario/i)) {
    return { intent: 'agendar_audiencia', confidence: 0.7, agent: 'AgenteAudienciasCalendario' };
  }
  if (lower.match(/factura|cobrar|pago/i)) {
    return { intent: 'generar_factura', confidence: 0.7, agent: 'AgenteFacturación' };
  }
  if (lower.match(/casos|expedientes|listar|mostrar/i)) {
    return { intent: 'consultar_casos', confidence: 0.6, agent: 'AgenteGestiónCasos' };
  }
  
  // Default: ayuda general
  return { intent: 'ayuda_general', confidence: 0.5, agent: 'AgenteAyudaGeneral' };
}

// ============================================================
// ROUTER A AGENTES ESPECIALIZADOS
// ============================================================
async function routeToAgent(
  supabase: any,
  userId: string,
  classification: IntentClassification,
  message: string,
  context_type: string,
  context_id?: string
): Promise<{ content: string; tool_calls?: any[]; tool_results?: any[]; metadata?: any }> {
  
  console.log(`[Router] Delegando a ${classification.agent}`);

  // Por ahora, respuestas mock hasta implementar cada agente
  switch (classification.intent) {
    case 'consultar_casos':
      return await handleConsultarCasos(supabase, userId);
    
    case 'crear_caso':
      return await handleCrearCaso(supabase, userId, message);
    
    case 'consultar_clientes':
      return await handleConsultarClientes(supabase, userId);
    
    default:
      return {
        content: `He detectado que quieres: **${classification.intent}**.\n\nEsta funcionalidad está siendo implementada por el agente **${classification.agent}**.\n\nPor ahora, puedo ayudarte con:\n- Consultar casos\n- Consultar clientes\n- Crear casos básicos\n\n¿Qué te gustaría hacer?`,
        metadata: { status: 'pending_implementation' }
      };
  }
}

// ============================================================
// HANDLERS MVP (FASE 1)
// ============================================================

async function handleConsultarCasos(supabase: any, userId: string) {
  const { data: cases, error } = await supabase
    .from('cases')
    .select('id, titulo, numero_expediente, materia, estado, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;

  if (!cases || cases.length === 0) {
    return {
      content: 'No tienes casos registrados aún. ¿Quieres que te ayude a crear uno?',
      tool_calls: [{ tool: 'list_cases', result: 'empty' }],
    };
  }

  let response = `Tienes **${cases.length}** casos recientes:\n\n`;
  cases.forEach((c: any, i: number) => {
    response += `**${i + 1}. ${c.titulo}**\n`;
    response += `   • Expediente: ${c.numero_expediente}\n`;
    response += `   • Materia: ${c.materia}\n`;
    response += `   • Estado: ${c.estado}\n\n`;
  });

  response += '\n¿Sobre cuál quieres más información?';

  return {
    content: response,
    tool_calls: [{ tool: 'list_cases', count: cases.length }],
    tool_results: cases,
  };
}

async function handleConsultarClientes(supabase: any, userId: string) {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, nombre_completo, email, telefono, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;

  if (!clients || clients.length === 0) {
    return {
      content: 'No tienes clientes registrados. ¿Quieres agregar uno nuevo?',
      tool_calls: [{ tool: 'list_clients', result: 'empty' }],
    };
  }

  let response = `Tienes **${clients.length}** clientes recientes:\n\n`;
  clients.forEach((c: any, i: number) => {
    response += `**${i + 1}. ${c.nombre_completo}**\n`;
    if (c.email) response += `   • Email: ${c.email}\n`;
    if (c.telefono) response += `   • Tel: ${c.telefono}\n`;
    response += '\n';
  });

  return {
    content: response,
    tool_calls: [{ tool: 'list_clients', count: clients.length }],
    tool_results: clients,
  };
}

async function handleCrearCaso(supabase: any, userId: string, message: string) {
  // Por ahora solo informar que falta información
  return {
    content: `Para crear un caso necesito que me proporciones:\n\n` +
             `1. **Título del caso**\n` +
             `2. **Materia** (Civil, Penal, Laboral, etc.)\n` +
             `3. **Tipo de caso**\n` +
             `4. **Cliente** (opcional)\n\n` +
             `Puedes decirme algo como: "Crea un caso de Cobro de Pesos contra Juan Pérez"`,
    metadata: { requires_more_info: true }
  };
}