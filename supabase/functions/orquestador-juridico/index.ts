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

  switch (classification.intent) {
    // === GESTIÓN DE CASOS ===
    case 'consultar_casos':
      return await handleConsultarCasos(supabase, userId);
    
    case 'crear_caso':
      return await handleCrearCaso(supabase, userId, message, classification.parameters);
    
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

async function handleCrearCaso(supabase: any, userId: string, message: string, params?: any) {
  // Extraer información del mensaje o parámetros
  if (!params?.titulo) {
    return {
      content: `Para crear un caso necesito que me proporciones:\n\n` +
               `1. **Título del caso**\n` +
               `2. **Materia** (Civil, Penal, Laboral, etc.)\n` +
               `3. **Número de expediente** (opcional)\n` +
               `4. **Cliente** (opcional)\n\n` +
               `Ejemplo: "Crea un caso de Cobro de Pesos, expediente 001-2025-CIVI-00123"`,
      metadata: { requires_more_info: true }
    };
  }

  // Obtener tenant_id del usuario
  const { data: tenantData } = await supabase.rpc('get_user_tenant_id', { p_user_id: userId });
  
  const newCase = {
    user_id: userId,
    tenant_id: tenantData,
    titulo: params.titulo,
    materia: params.materia || 'Civil y Comercial',
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
      content: `❌ Hubo un error al crear el caso: ${error.message}`,
      metadata: { error: true }
    };
  }

  return {
    content: `✅ **Caso creado exitosamente**\n\n` +
             `📋 **${caso.titulo}**\n` +
             `• Expediente: ${caso.numero_expediente}\n` +
             `• Materia: ${caso.materia}\n` +
             `• Estado: ${caso.estado}\n\n` +
             `¿Quieres programar una audiencia o agregar plazos procesales?`,
    tool_calls: [{ tool: 'crear_caso', case_id: caso.id }],
    tool_results: caso,
  };
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
  // Listar plantillas disponibles
  const { data: templates } = await supabase
    .from('document_templates')
    .select('slug, nombre, descripcion, categoria')
    .eq('activo', true)
    .limit(10);

  if (!params?.template_slug) {
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

  // Aquí iría la lógica de generación con la plantilla
  return {
    content: `🔄 Generando documento con plantilla **${params.template_slug}**...\n\n` +
             `Esta funcionalidad conectará con el sistema de generación de actos legales existente.\n\n` +
             `¿Tienes los datos del caso y las partes listos?`,
    metadata: { template_slug: params.template_slug, pending: true }
  };
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

async function handleBuscarJurisprudencia(supabase: any, userId: string, message: string) {
  return {
    content: `🔍 **Búsqueda de jurisprudencia**\n\n` +
             `Esta funcionalidad se conectará con el sistema RAG jurídico existente.\n\n` +
             `Tu consulta: "${message}"\n\n` +
             `Buscando en la base de datos de sentencias y precedentes...`,
    metadata: { query: message, pending: true }
  };
}