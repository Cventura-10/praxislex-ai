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

  const startTime = Date.now();

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

    // ============================================================
    // PASO 6: Registrar métricas de la sesión
    // ============================================================
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const success = !agentResponse.content.toLowerCase().includes('error') && 
                    !agentResponse.content.toLowerCase().includes('no pudo');

    const tenantId = user.user_metadata?.tenant_id;
    if (tenantId) {
      await supabaseClient.from('ai_os_session_analytics').insert({
        conversation_id: activeConversationId,
        user_id: user.id,
        tenant_id: tenantId,
        intent: classification.intent,
        agent_name: classification.agent,
        confidence: classification.confidence,
        response_time_ms: responseTime,
        success: success,
        metadata: {
          context_type: context_type,
          context_id: context_id,
          message_length: message.length,
        }
      });
    }

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
// CLASIFICADOR DE INTENCIONES CON EXTRACCIÓN DE PARÁMETROS
// ============================================================
async function classifyIntent(
  message: string, 
  context_type: string
): Promise<IntentClassification> {
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY no configurada');
  }

  // Definir herramientas para extracción de parámetros
  const tools = [
    {
      type: "function",
      function: {
        name: "clasificar_con_parametros",
        description: "Clasifica la intención del usuario y extrae parámetros estructurados",
        parameters: {
          type: "object",
          properties: {
            intent: {
              type: "string",
              enum: [
                "consultar_casos", "crear_caso", "actualizar_caso",
                "consultar_clientes", "crear_cliente", "actualizar_cliente",
                "generar_documento", "buscar_jurisprudencia",
                "agendar_audiencia", "consultar_plazos",
                "generar_factura", "ayuda_general"
              ],
              description: "La intención principal detectada"
            },
            confidence: {
              type: "number",
              description: "Nivel de confianza entre 0 y 1"
            },
            agent: {
              type: "string",
              enum: [
                "AgenteGestiónCasos", "AgenteGestiónClientes",
                "AgenteDocumentosRedacción", "AgenteJurisprudencia",
                "AgenteAudienciasCalendario", "AgenteFacturación",
                "AgenteAyudaGeneral"
              ],
              description: "Agente especializado que debe manejar la solicitud"
            },
            parameters: {
              type: "object",
              description: "Parámetros extraídos del mensaje",
              properties: {
                // Parámetros para casos
                titulo_caso: { type: "string", description: "Título descriptivo del caso" },
                materia: { 
                  type: "string",
                  enum: ["Civil y Comercial", "Penal", "Laboral", "Familia", "Administrativo", "Comercial"],
                  description: "Materia jurídica"
                },
                numero_expediente: { type: "string", description: "Número de expediente si se menciona" },
                tipo_caso: { type: "string", description: "Tipo específico del caso" },
                
                // Parámetros para clientes
                cliente_nombre: { type: "string", description: "Nombre del cliente mencionado" },
                tipo_persona: { 
                  type: "string",
                  enum: ["fisica", "juridica"],
                  description: "Tipo de persona"
                },
                email: { type: "string", description: "Email del cliente" },
                telefono: { type: "string", description: "Teléfono del cliente" },
                
                // Parámetros para audiencias
                fecha_audiencia: { type: "string", description: "Fecha de la audiencia en formato ISO" },
                hora_audiencia: { type: "string", description: "Hora de la audiencia" },
                juzgado: { type: "string", description: "Juzgado o ubicación" },
                
                // Parámetros para documentos
                template_slug: { type: "string", description: "Slug de la plantilla de documento" },
                tipo_documento: { type: "string", description: "Tipo de documento a generar" },
                
                // Parámetros generales
                descripcion: { type: "string", description: "Descripción adicional" },
                busqueda_texto: { type: "string", description: "Texto de búsqueda" }
              }
            }
          },
          required: ["intent", "confidence", "agent"]
        }
      }
    }
  ];

  const systemPrompt = `Eres un clasificador de intenciones para un sistema jurídico dominicano.
Analiza el mensaje del usuario y:
1. Clasifica su intención principal
2. Extrae TODOS los parámetros relevantes mencionados
3. Asigna el agente especializado correcto

Ejemplos:
- "Crea un caso de cobro de pesos contra Juan Pérez" → intent: crear_caso, parameters: {titulo_caso: "Cobro de pesos", cliente_nombre: "Juan Pérez", materia: "Civil y Comercial"}
- "Registra a María López, jurídica, email maria@empresa.com" → intent: crear_cliente, parameters: {cliente_nombre: "María López", tipo_persona: "juridica", email: "maria@empresa.com"}
- "Tengo audiencia el 15 de enero a las 9am en el Juzgado de Paz" → intent: agendar_audiencia, parameters: {fecha_audiencia: "2025-01-15", hora_audiencia: "09:00", juzgado: "Juzgado de Paz"}

Usa la función clasificar_con_parametros para responder.`;

  const userPrompt = `Contexto: ${context_type}
Mensaje: "${message}"`;

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
        tools: tools,
        tool_choice: { type: "function", function: { name: "clasificar_con_parametros" } }
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
    const message = data.choices[0].message;
    
    // Extraer de tool_calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);
      
      console.log('[Clasificador] Parámetros extraídos:', args.parameters);
      
      return {
        intent: args.intent,
        confidence: args.confidence,
        agent: args.agent,
        parameters: args.parameters || {}
      };
    }

    // Fallback si no hay tool_calls
    return fallbackClassification(message, context_type);

  } catch (error) {
    console.error('[Clasificador] Error:', error);
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
  context_id?: string,
  previousMessage?: any
): Promise<{ content: string; tool_calls?: any[]; tool_results?: any[]; metadata?: any }> {
  
  console.log(`[Router] Delegando a ${classification.agent}`, classification.parameters);

  // === MANEJO DE CONFIRMACIONES ===
  if (previousMessage?.metadata?.requires_confirmation) {
    const confirmWords = ['sí', 'si', 'confirmar', 'confirmo', 'adelante', 'ok'];
    const cancelWords = ['no', 'cancelar', 'cancela', 'mejor no'];
    
    const messageLower = message.toLowerCase();
    const isConfirm = confirmWords.some(word => messageLower.includes(word));
    const isCancel = cancelWords.some(word => messageLower.includes(word));
    
    if (isConfirm && previousMessage.metadata.pending_action) {
      const action = previousMessage.metadata.pending_action;
      console.log('[Router] Ejecutando acción confirmada:', action.intent);
      classification.intent = action.intent;
      classification.parameters = { ...action.params, confirmed: true };
    } else if (isCancel) {
      return {
        content: '✅ Acción cancelada. ¿En qué más puedo ayudarte?',
        metadata: { cancelled: true }
      };
    }
  }

  // === MANEJO DE ESTADO MULTI-TURN ===
  const conversationState = previousMessage?.metadata?.state;

  switch (classification.intent) {
    // === GESTIÓN DE CASOS ===
    case 'consultar_casos':
      return await handleConsultarCasos(supabase, userId);
    
    case 'crear_caso':
      return await handleCrearCaso(supabase, userId, message, classification.parameters, conversationState);
    
    case 'actualizar_caso':
      return await handleActualizarCaso(supabase, userId, message, classification.parameters);
    
    // === GESTIÓN DE CLIENTES ===
    case 'consultar_clientes':
      return await handleConsultarClientes(supabase, userId);
    
    case 'crear_cliente':
      return await handleCrearCliente(supabase, userId, message, classification.parameters);
    
    case 'actualizar_cliente':
      return await handleActualizarCliente(supabase, userId, message, classification.parameters);
    
    // === DOCUMENTOS ===
    case 'generar_documento':
      return await handleGenerarDocumento(supabase, userId, message, classification.parameters);
    
    // === CALENDARIO Y PLAZOS ===
    case 'agendar_audiencia':
      return await handleAgendarAudiencia(supabase, userId, message, classification.parameters);
    
    case 'consultar_plazos':
      return await handleConsultarPlazos(supabase, userId);
    
    // === FACTURACIÓN ===
    case 'generar_factura':
      return await handleGenerarFactura(supabase, userId, message, classification.parameters);
    
    // === JURISPRUDENCIA ===
    case 'buscar_jurisprudencia':
      return await handleBuscarJurisprudencia(supabase, userId, message);
    
    default:
      return {
        content: `He detectado que quieres: **${classification.intent}**.\n\nEsta funcionalidad está siendo implementada por el agente **${classification.agent}**.\n\n¿Qué más puedo ayudarte?`,
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

async function handleCrearCaso(supabase: any, userId: string, message: string, params?: any, conversationState?: any) {
  // === FLUJO MULTI-TURN ===
  if (conversationState?.intent === 'crear_caso') {
    const collected = conversationState.collected_params || {};
    
    // Paso 1: Recolectar título
    if (!collected.titulo && conversationState.step === 1) {
      collected.titulo = params?.titulo_caso || extractTituloFromMessage(message);
      
      if (collected.titulo) {
        return {
          content: `Perfecto, título: "${collected.titulo}". ¿De qué materia es? (Civil, Penal, Laboral, Familia, Administrativo)`,
          metadata: {
            state: {
              intent: 'crear_caso',
              collected_params: collected,
              step: 2
            }
          }
        };
      }
    }
    
    // Paso 2: Recolectar materia
    if (collected.titulo && !collected.materia && conversationState.step === 2) {
      collected.materia = params?.materia || extractMateriaFromMessage(message);
      
      if (collected.materia) {
        // Buscar cliente si se mencionó
        const clienteNombre = params?.cliente_nombre || conversationState.collected_params?.cliente_nombre;
        
        if (clienteNombre) {
          const cliente = await buscarClientePorNombre(supabase, userId, clienteNombre);
          if (cliente) {
            collected.client_id = cliente.id;
          }
        }
        
        // Ya tenemos suficiente información, crear caso
        return await crearCasoFinal(supabase, userId, collected);
      }
    }
  }

  // === CREACIÓN DIRECTA CON PARÁMETROS COMPLETOS ===
  if (params?.titulo_caso && params?.materia) {
    const collected: any = {
      titulo: params.titulo_caso,
      materia: params.materia,
      tipo_caso: params.tipo_caso || 'demanda',
      numero_expediente: params.numero_expediente || '',
      descripcion: params.descripcion || ''
    };

    // Buscar cliente si se mencionó
    if (params.cliente_nombre) {
      const cliente = await buscarClientePorNombre(supabase, userId, params.cliente_nombre);
      
      if (cliente === null) {
        return {
          content: `No encontré un cliente llamado "${params.cliente_nombre}".\n\n¿Quieres que lo registre primero?`,
          metadata: {
            suggest_create_client: { nombre: params.cliente_nombre },
            pending_case_params: collected
          }
        };
      } else if (cliente.ambiguous) {
        return {
          content: `Encontré varios clientes con ese nombre:\n\n` +
                   cliente.candidates.map((c: any, i: number) => 
                     `${i + 1}. ${c.nombre_completo}${c.email ? ` (${c.email})` : ''}`
                   ).join('\n') +
                   `\n\n¿A cuál te refieres? (número)`,
          metadata: {
            pending_selection: {
              type: 'cliente',
              candidates: cliente.candidates,
              next_action: 'crear_caso',
              case_params: collected
            }
          }
        };
      } else {
        collected.client_id = cliente.id;
      }
    }

    return await crearCasoFinal(supabase, userId, collected);
  }

  // === INICIAR FLUJO MULTI-TURN ===
  return {
    content: `Perfecto, vamos a crear un caso. ¿Cuál es el título del caso?`,
    metadata: {
      state: {
        intent: 'crear_caso',
        collected_params: params || {},
        step: 1
      }
    }
  };
}

// === FUNCIÓN AUXILIAR: Crear caso final ===
async function crearCasoFinal(supabase: any, userId: string, params: any) {
  const { data: tenantData } = await supabase.rpc('get_user_tenant_id', { p_user_id: userId });
  
  const newCase = {
    user_id: userId,
    tenant_id: tenantData,
    titulo: params.titulo,
    materia: params.materia,
    tipo_caso: params.tipo_caso || 'demanda',
    numero_expediente: params.numero_expediente || '',
    estado: 'activo',
    descripcion: params.descripcion || '',
    client_id: params.client_id || null,
  };

  const { data: caso, error } = await supabase
    .from('cases')
    .insert(newCase)
    .select()
    .single();

  if (error) {
    console.error('[CrearCaso] Error:', error);
    return {
      content: `❌ Error al crear el caso: ${error.message}`,
      metadata: { error: true }
    };
  }

  return {
    content: `✅ **Caso creado exitosamente**\n\n` +
             `📋 **${caso.titulo}**\n` +
             `• Expediente: ${caso.numero_expediente}\n` +
             `• Materia: ${caso.materia}\n` +
             `• Estado: ${caso.estado}\n` +
             (caso.client_id ? `• Cliente: Asignado\n` : '') +
             `\n¿Quieres programar una audiencia o agregar plazos procesales?`,
    tool_calls: [{ tool: 'crear_caso', case_id: caso.id }],
    tool_results: caso,
  };
}

// === FUNCIÓN AUXILIAR: Buscar cliente por nombre ===
async function buscarClientePorNombre(supabase: any, userId: string, nombre: string) {
  // Búsqueda exacta primero
  const { data: cliente } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .ilike('nombre_completo', `%${nombre}%`)
    .limit(1)
    .maybeSingle();

  if (cliente) return cliente;

  // Búsqueda fuzzy
  const { data: clientes } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .limit(20);

  if (!clientes || clientes.length === 0) return null;

  const candidatos = clientes
    .map((c: any) => ({
      ...c,
      similitud: calcularSimilitud(nombre.toLowerCase(), c.nombre_completo.toLowerCase())
    }))
    .filter((c: any) => c.similitud > 0.5)
    .sort((a: any, b: any) => b.similitud - a.similitud);

  if (candidatos.length === 1) return candidatos[0];
  if (candidatos.length > 1) {
    return { ambiguous: true, candidates: candidatos.slice(0, 5) };
  }

  return null;
}

// === FUNCIÓN AUXILIAR: Calcular similitud (Levenshtein simplificado) ===
function calcularSimilitud(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  if (longer.includes(shorter)) return 0.9;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// === FUNCIONES AUXILIARES: Extracción de texto ===
function extractTituloFromMessage(message: string): string {
  // Patrones comunes: "caso de X", "demanda de X", "X contra Y"
  const patterns = [
    /caso de (.+)/i,
    /demanda de (.+)/i,
    /(.+) contra (.+)/i,
    /"(.+)"/,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  
  return message.trim();
}

function extractMateriaFromMessage(message: string): string | null {
  const materias: Record<string, string[]> = {
    'Civil y Comercial': ['civil', 'comercial', 'contrato', 'cobro', 'pesos'],
    'Penal': ['penal', 'criminal', 'delito'],
    'Laboral': ['laboral', 'trabajo', 'despido', 'empleado'],
    'Familia': ['familia', 'divorcio', 'custodia', 'pension'],
    'Administrativo': ['administrativo', 'estado', 'gobierno']
  };
  
  const messageLower = message.toLowerCase();
  
  for (const [materia, keywords] of Object.entries(materias)) {
    if (keywords.some(kw => messageLower.includes(kw))) {
      return materia;
    }
  }
  
  return null;
}

async function handleActualizarCaso(supabase: any, userId: string, message: string, params?: any) {
  if (!params?.caso_id) {
    return {
      content: `Para actualizar un caso necesito que especifiques:\n\n` +
               `1. **Qué caso** quieres actualizar (nombre o expediente)\n` +
               `2. **Qué campo** quieres modificar\n` +
               `3. **Nuevo valor**\n\n` +
               `Ejemplo: "Actualiza el caso 001-2025 a estado cerrado"`,
      metadata: { requires_more_info: true }
    };
  }

  const updates: any = {};
  if (params.titulo) updates.titulo = params.titulo;
  if (params.estado) updates.estado = params.estado;
  if (params.descripcion) updates.descripcion = params.descripcion;
  if (params.etapa_procesal) updates.etapa_procesal = params.etapa_procesal;

  const { data: caso, error } = await supabase
    .from('cases')
    .update(updates)
    .eq('id', params.caso_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return {
      content: `❌ Error al actualizar el caso: ${error.message}`,
      metadata: { error: true }
    };
  }

  return {
    content: `✅ **Caso actualizado**\n\n` +
             `📋 ${caso.titulo}\n` +
             `• Estado: ${caso.estado}\n` +
             `• Etapa: ${caso.etapa_procesal || 'N/A'}\n\n` +
             `Cambios guardados correctamente.`,
    tool_calls: [{ tool: 'actualizar_caso', case_id: caso.id }],
  };
}

async function handleCrearCliente(supabase: any, userId: string, message: string, params?: any) {
  if (!params?.nombre_completo) {
    return {
      content: `Para registrar un cliente necesito:\n\n` +
               `1. **Nombre completo**\n` +
               `2. **Tipo de persona** (física/jurídica)\n` +
               `3. **Email** (opcional)\n` +
               `4. **Teléfono** (opcional)\n\n` +
               `Ejemplo: "Registra a Juan Pérez, física, email juan@example.com"`,
      metadata: { requires_more_info: true }
    };
  }

  const { data: tenantData } = await supabase.rpc('get_user_tenant_id', { p_user_id: userId });
  
  const newClient = {
    user_id: userId,
    tenant_id: tenantData,
    nombre_completo: params.nombre_completo,
    tipo_persona: params.tipo_persona || 'fisica',
    email: params.email || null,
    telefono: params.telefono || null,
    direccion: params.direccion || null,
  };

  const { data: cliente, error } = await supabase
    .from('clients')
    .insert(newClient)
    .select()
    .single();

  if (error) {
    return {
      content: `❌ Error al crear cliente: ${error.message}`,
      metadata: { error: true }
    };
  }

  return {
    content: `✅ **Cliente registrado exitosamente**\n\n` +
             `👤 **${cliente.nombre_completo}**\n` +
             `• Tipo: ${cliente.tipo_persona}\n` +
             (cliente.email ? `• Email: ${cliente.email}\n` : '') +
             (cliente.telefono ? `• Teléfono: ${cliente.telefono}\n` : '') +
             `\n¿Quieres crear un caso para este cliente?`,
    tool_calls: [{ tool: 'crear_cliente', client_id: cliente.id }],
    tool_results: cliente,
  };
}

async function handleActualizarCliente(supabase: any, userId: string, message: string, params?: any) {
  if (!params?.cliente_id) {
    return {
      content: `Para actualizar un cliente necesito:\n\n` +
               `1. **Qué cliente** actualizar (nombre)\n` +
               `2. **Qué campo** modificar\n` +
               `3. **Nuevo valor**\n\n` +
               `Ejemplo: "Actualiza el email de Juan Pérez a nuevo@email.com"`,
      metadata: { requires_more_info: true }
    };
  }

  const updates: any = {};
  if (params.email) updates.email = params.email;
  if (params.telefono) updates.telefono = params.telefono;
  if (params.direccion) updates.direccion = params.direccion;

  const { data: cliente, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', params.cliente_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return {
      content: `❌ Error al actualizar cliente: ${error.message}`,
      metadata: { error: true }
    };
  }

  return {
    content: `✅ **Cliente actualizado**\n\n` +
             `👤 ${cliente.nombre_completo}\n` +
             (cliente.email ? `• Email: ${cliente.email}\n` : '') +
             (cliente.telefono ? `• Teléfono: ${cliente.telefono}\n` : '') +
             `\nCambios guardados.`,
    tool_calls: [{ tool: 'actualizar_cliente', client_id: cliente.id }],
  };
}

async function handleGenerarDocumento(supabase: any, userId: string, message: string, params?: any) {
  console.log('[Herramienta] Generar documento DOCX:', params);
  
  try {
    // Extraer parámetros necesarios
    const { 
      tipo_acto, 
      cliente_id, 
      titulo,
      primera_parte,
      segunda_parte,
      notario,
      contrato,
      ciudad = 'Santo Domingo'
    } = params || {};

    if (!tipo_acto && !params?.template_slug) {
      // Listar plantillas disponibles
      const { data: templates } = await supabase
        .from('document_templates')
        .select('slug, nombre, descripcion, categoria')
        .eq('activo', true)
        .limit(10);

      let response = `📄 **Plantillas disponibles:**\n\n`;
      
      if (templates && templates.length > 0) {
        templates.forEach((t: any, i: number) => {
          response += `${i + 1}. **${t.nombre}** (${t.categoria})\n`;
          if (t.descripcion) response += `   ${t.descripcion}\n`;
          response += '\n';
        });
        response += `Dime cuál plantilla quieres usar o describe qué documento necesitas.`;
      } else {
        response = `No hay plantillas configuradas. ¿Qué tipo de documento necesitas redactar?`;
      }

      return {
        content: response,
        tool_calls: [{ tool: 'listar_plantillas', count: templates?.length || 0 }],
        tool_results: templates,
      };
    }

    const templateSlug = tipo_acto || params?.template_slug;

    // Preparar payload para generate-legal-doc
    const payload: any = {
      template_slug: templateSlug,
      ciudad,
      fecha: new Date().toISOString(),
    };

    // Agregar partes si están disponibles
    if (primera_parte) payload.primera_parte = primera_parte;
    if (segunda_parte) payload.segunda_parte = segunda_parte;
    if (notario) payload.notario = notario;
    if (contrato) payload.contrato = contrato;

    // Llamar al edge function generate-legal-doc
    const { data: docData, error: docError } = await supabase.functions.invoke('generate-legal-doc', {
      body: payload
    });

    if (docError) {
      console.error('[Error] generate-legal-doc:', docError);
      return {
        content: `❌ Error al generar documento: ${docError.message}`,
        metadata: { error: true },
      };
    }

    // Guardar en generated_acts
    const { data: tenantData } = await supabase.rpc('get_user_tenant_id', { p_user_id: userId });
    
    const { data: actData, error: actError } = await supabase.from('generated_acts').insert({
      user_id: userId,
      tenant_id: tenantData,
      tipo_acto: templateSlug,
      titulo: titulo || `Documento ${templateSlug}`,
      contenido: 'Generado vía AI',
      materia: 'Civil y Comercial',
      ciudad,
      fecha_actuacion: new Date().toISOString(),
      client_id: cliente_id || null,
      documento_url: docData.file_url || null,
    }).select().single();

    if (actError) {
      console.error('[Error] Guardar acto:', actError);
    }

    return {
      content: `✅ **Documento generado exitosamente**\n\n` +
               `📄 **${titulo || 'Documento'}**\n` +
               `• Tipo: ${templateSlug}\n` +
               `• Ciudad: ${ciudad}\n\n` +
               `El documento DOCX está listo para descarga.`,
      tool_calls: [{ tool: 'generar_documento', file_url: docData.file_url }],
      tool_results: [{
        file_url: docData.file_url,
        acto_id: actData?.id,
        template_slug: templateSlug,
      }],
    };
  } catch (error: any) {
    console.error('[Error] handleGenerarDocumento:', error);
    return {
      content: `❌ Error al generar documento: ${error.message}`,
      metadata: { error: true },
    };
  }
}

async function handleAgendarAudiencia(supabase: any, userId: string, message: string, params?: any) {
  if (!params?.fecha || !params?.titulo) {
    return {
      content: `Para agendar una audiencia necesito:\n\n` +
               `1. **Fecha y hora** (ej: 15 de enero 2025 a las 9:00 AM)\n` +
               `2. **Título/Descripción**\n` +
               `3. **Caso relacionado** (opcional)\n` +
               `4. **Juzgado/Ubicación** (opcional)\n\n` +
               `Ejemplo: "Agenda audiencia el 15/01/2025 a las 9am en Juzgado de Paz"`,
      metadata: { requires_more_info: true }
    };
  }

  const { data: tenantData } = await supabase.rpc('get_user_tenant_id', { p_user_id: userId });
  
  const evento = {
    user_id: userId,
    tenant_id: tenantData,
    titulo: params.titulo,
    tipo_evento: 'audiencia',
    inicio: params.fecha,
    fin: params.fecha, // Mismo día por defecto
    ubicacion: params.juzgado || null,
    descripcion: params.descripcion || null,
    expediente_id: params.caso_id || null,
    prioridad: 'alta',
  };

  const { data: audiencia, error } = await supabase
    .from('calendar_events')
    .insert(evento)
    .select()
    .single();

  if (error) {
    return {
      content: `❌ Error al agendar audiencia: ${error.message}`,
      metadata: { error: true }
    };
  }

  return {
    content: `✅ **Audiencia agendada**\n\n` +
             `📅 **${audiencia.titulo}**\n` +
             `• Fecha: ${new Date(audiencia.inicio).toLocaleDateString('es-DO')}\n` +
             (audiencia.ubicacion ? `• Lugar: ${audiencia.ubicacion}\n` : '') +
             `\nTe enviaré un recordatorio 24 horas antes.`,
    tool_calls: [{ tool: 'programar_audiencia', event_id: audiencia.id }],
    tool_results: audiencia,
  };
}

async function handleConsultarPlazos(supabase: any, userId: string) {
  const { data: plazos } = await supabase
    .from('plazos_procesales')
    .select('*, cases(titulo)')
    .eq('user_id', userId)
    .eq('estado', 'pendiente')
    .order('fecha_vencimiento', { ascending: true })
    .limit(5);

  if (!plazos || plazos.length === 0) {
    return {
      content: `📅 No tienes plazos procesales pendientes.\n\n¿Quieres que calcule un plazo para algún caso?`,
      tool_calls: [{ tool: 'consultar_plazos', result: 'empty' }],
    };
  }

  let response = `📅 **Plazos procesales pendientes:**\n\n`;
  plazos.forEach((p: any, i: number) => {
    const dias = Math.ceil((new Date(p.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    response += `${i + 1}. **${p.tipo_plazo}**\n`;
    response += `   • Caso: ${p.cases?.titulo || 'N/A'}\n`;
    response += `   • Vence: ${new Date(p.fecha_vencimiento).toLocaleDateString('es-DO')}\n`;
    response += `   • Faltan: ${dias} días\n`;
    response += `   • Prioridad: ${p.prioridad}\n\n`;
  });

  return {
    content: response,
    tool_calls: [{ tool: 'consultar_plazos', count: plazos.length }],
    tool_results: plazos,
  };
}

async function handleGenerarFactura(supabase: any, userId: string, message: string, params?: any) {
  if (!params?.cliente_id || !params?.conceptos) {
    return {
      content: `Para generar una factura necesito:\n\n` +
               `1. **Cliente** (nombre)\n` +
               `2. **Conceptos** (servicios facturados)\n` +
               `3. **Montos** para cada concepto\n` +
               `4. **Caso relacionado** (opcional)\n\n` +
               `Ejemplo: "Factura a Juan Pérez por honorarios $50,000"`,
      metadata: { requires_more_info: true }
    };
  }

  return {
    content: `🔄 **Generación de factura**\n\n` +
             `Esta funcionalidad se conectará con el módulo de contabilidad existente.\n\n` +
             `Cliente: ${params.cliente_nombre || 'N/A'}\n` +
             `Conceptos: ${params.conceptos?.length || 0}\n\n` +
             `¿Confirmas los datos para generar la factura?`,
    metadata: { pending: true, cliente_id: params.cliente_id }
  };
}

async function handleBuscarJurisprudencia(supabase: any, userId: string, message: string, params?: any) {
  console.log('[Herramienta] Buscar jurisprudencia RAG:', params);
  
  try {
    const { 
      query, 
      materia = null, 
      limit = 5, 
      threshold = 0.7 
    } = params || {};

    const searchQuery = query || message;

    if (!searchQuery || searchQuery.trim() === '') {
      return {
        content: '❌ Debes proporcionar un texto de búsqueda (ej: "prescripción acción civil", "nulidad matrimonio")',
        metadata: { error: true },
      };
    }

    // Llamar al edge function search-jurisprudence-rag
    const { data: searchData, error: searchError } = await supabase.functions.invoke('search-jurisprudence-rag', {
      body: {
        query: searchQuery,
        materia,
        limit,
        threshold,
      }
    });

    if (searchError) {
      console.error('[Error] search-jurisprudence-rag:', searchError);
      return {
        content: `❌ Error al buscar jurisprudencia: ${searchError.message}`,
        metadata: { error: true },
      };
    }

    const results = searchData?.results || [];

    if (results.length === 0) {
      return {
        content: `🔍 No encontré jurisprudencia relevante para: "${searchQuery}"\n\nIntenta con términos más generales o diferentes palabras clave.`,
        tool_calls: [{ tool: 'buscar_jurisprudencia', query: searchQuery, results: 0 }],
        tool_results: [],
      };
    }

    // Formatear resultados
    let content = `🔍 **Jurisprudencia encontrada** (${results.length} resultados)\n\n`;
    content += `📝 Búsqueda: "${searchQuery}"\n`;
    if (materia) content += `📂 Materia: ${materia}\n`;
    content += `\n`;

    results.forEach((r: any, idx: number) => {
      content += `**${idx + 1}. ${r.titulo || 'Sin título'}**\n`;
      if (r.sentencia_numero) content += `• Sentencia: ${r.sentencia_numero}\n`;
      if (r.fecha_sentencia) content += `• Fecha: ${r.fecha_sentencia}\n`;
      if (r.materia) content += `• Materia: ${r.materia}\n`;
      if (r.similarity) content += `• Relevancia: ${(r.similarity * 100).toFixed(0)}%\n`;
      if (r.contenido) {
        const preview = r.contenido.substring(0, 200);
        content += `• Extracto: ${preview}...\n`;
      }
      content += `\n`;
    });

    return {
      content,
      tool_calls: [{ tool: 'buscar_jurisprudencia', query: searchQuery, results: results.length }],
      tool_results: results,
    };
  } catch (error: any) {
    console.error('[Error] handleBuscarJurisprudencia:', error);
    return {
      content: `❌ Error al buscar jurisprudencia: ${error.message}`,
      metadata: { error: true },
    };
  }
}