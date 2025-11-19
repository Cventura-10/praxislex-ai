# FASE 5 - Integraciones Avanzadas y Mejoras Conversacionales

## 🎯 Objetivos

1. **Extracción inteligente de parámetros** usando Lovable AI
2. **Conversaciones multi-turn** para completar datos faltantes
3. **Confirmaciones interactivas** para acciones críticas
4. **Búsqueda inteligente** de entidades (clientes, casos) por nombre/texto
5. **Integración real** con sistemas existentes

---

## 🧠 1. Extracción Inteligente de Parámetros

### Problema Actual
Cuando el usuario dice: "Crea un caso de Cobro de Pesos contra Juan Pérez", el sistema no extrae automáticamente:
- Título: "Cobro de Pesos"
- Materia: "Civil y Comercial"
- Cliente: buscar "Juan Pérez"

### Solución: Tool Calling con Lovable AI

```typescript
// En clasificarIntencion, agregar herramienta de extracción
const tools = [
  {
    type: "function",
    function: {
      name: "extraer_parametros_caso",
      description: "Extrae información estructurada para crear un caso",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string", description: "Título descriptivo del caso" },
          materia: { 
            type: "string", 
            enum: ["Civil y Comercial", "Penal", "Laboral", "Familia", "Administrativo"],
            description: "Materia jurídica del caso"
          },
          tipo_caso: { type: "string", description: "Tipo específico (demanda, recurso, etc.)" },
          cliente_nombre: { type: "string", description: "Nombre del cliente mencionado" },
          numero_expediente: { type: "string", description: "Número de expediente si se menciona" },
          descripcion: { type: "string", description: "Descripción adicional del caso" }
        },
        required: ["titulo", "materia"]
      }
    }
  }
];

// Lovable AI responderá con tool_calls estructurados
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [...],
    tools: tools,
    tool_choice: { type: "function", function: { name: "extraer_parametros_caso" } }
  })
});

// El resultado incluirá:
// tool_calls[0].function.arguments = { titulo: "Cobro de Pesos", materia: "Civil y Comercial", ... }
```

---

## 🔄 2. Conversaciones Multi-Turn

### Flujo Mejorado
```typescript
// Estado de la conversación se guarda en metadata
interface ConversationState {
  intent: string;
  collected_params: Record<string, any>;
  missing_fields: string[];
  step: number;
}

// Ejemplo: Crear caso en 3 pasos
Step 1:
Usuario: "Crea un caso"
Agente: "¿Cuál es el título del caso?"

Step 2:
Usuario: "Cobro de pesos"
Agente: [guarda titulo] "¿De qué materia es? (Civil, Penal, Laboral...)"

Step 3:
Usuario: "Civil"
Agente: [ejecuta crear_caso con params completos]
```

### Implementación
```typescript
// En handleCrearCaso
async function handleCrearCaso(supabase, userId, message, params, conversationState) {
  // Si no hay state, iniciar recolección
  if (!conversationState) {
    return {
      content: "Perfecto, vamos a crear un caso. ¿Cuál es el título?",
      metadata: {
        state: {
          intent: 'crear_caso',
          collected_params: {},
          missing_fields: ['titulo', 'materia'],
          step: 1
        }
      }
    };
  }

  // Actualizar params recolectados
  const updated = { ...conversationState.collected_params };
  
  if (conversationState.step === 1) {
    updated.titulo = extractTituloFromMessage(message);
    return {
      content: `Título: "${updated.titulo}". ¿De qué materia es?`,
      metadata: {
        state: {
          ...conversationState,
          collected_params: updated,
          missing_fields: ['materia'],
          step: 2
        }
      }
    };
  }

  if (conversationState.step === 2) {
    updated.materia = extractMateriaFromMessage(message);
    // Ya tenemos todo, crear caso
    return await crearCasoFinal(supabase, userId, updated);
  }
}
```

---

## ⚠️ 3. Confirmaciones Interactivas

### Para Acciones Críticas

```typescript
// Detectar acciones que requieren confirmación
const ACCIONES_CRITICAS = [
  'eliminar_caso',
  'cerrar_caso',
  'actualizar_factura',
  'eliminar_cliente'
];

// Agregar paso de confirmación
if (esAccionCritica(intent) && !params.confirmed) {
  return {
    content: `⚠️ **Confirmación requerida**\n\n` +
             `Estás a punto de: **${describir_accion(intent)}**\n\n` +
             `Datos:\n${formatear_datos(params)}\n\n` +
             `¿Confirmas esta acción? Responde "Sí, confirmar" para continuar.`,
    metadata: {
      requires_confirmation: true,
      pending_action: { intent, params }
    }
  };
}

// Procesar confirmación
if (previousMessage?.metadata?.requires_confirmation) {
  if (message.toLowerCase().includes('sí') || message.toLowerCase().includes('confirmar')) {
    const action = previousMessage.metadata.pending_action;
    return await ejecutarAccion(action.intent, action.params);
  } else {
    return { content: "Acción cancelada. ¿En qué más puedo ayudarte?" };
  }
}
```

---

## 🔍 4. Búsqueda Inteligente de Entidades

### Problema
Usuario: "Crea un caso para Juan Pérez"
→ Sistema no encuentra automáticamente el cliente "Juan Pérez"

### Solución: Búsqueda Fuzzy

```typescript
// Función de búsqueda inteligente
async function buscarCliente(supabase, userId, nombreBuscado) {
  // Búsqueda exacta primero
  let { data: cliente } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .ilike('nombre_completo', `%${nombreBuscado}%`)
    .limit(1)
    .single();

  if (cliente) return cliente;

  // Si no encuentra, buscar similar (fuzzy)
  const { data: clientes } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .limit(10);

  // Calcular similitud con algoritmo (ej: Levenshtein)
  const candidatos = clientes
    .map(c => ({
      ...c,
      similitud: calcularSimilitud(nombreBuscado, c.nombre_completo)
    }))
    .filter(c => c.similitud > 0.6)
    .sort((a, b) => b.similitud - a.similitud);

  if (candidatos.length === 1) {
    return candidatos[0];
  } else if (candidatos.length > 1) {
    // Preguntar al usuario
    return {
      ambiguous: true,
      candidates: candidatos.slice(0, 5)
    };
  }

  return null;
}

// Uso en handleCrearCaso
if (params.cliente_nombre) {
  const busqueda = await buscarCliente(supabase, userId, params.cliente_nombre);
  
  if (busqueda?.ambiguous) {
    let opciones = "Encontré varios clientes:\n\n";
    busqueda.candidates.forEach((c, i) => {
      opciones += `${i+1}. ${c.nombre_completo}\n`;
    });
    opciones += "\n¿A cuál te refieres? (número)";
    
    return {
      content: opciones,
      metadata: {
        pending_selection: {
          type: 'cliente',
          candidates: busqueda.candidates
        }
      }
    };
  } else if (busqueda) {
    params.client_id = busqueda.id;
  } else {
    // Cliente no existe
    return {
      content: `No encontré un cliente llamado "${params.cliente_nombre}".\n\n` +
               `¿Quieres que lo registre primero?`,
      metadata: {
        suggest_create_client: { nombre: params.cliente_nombre }
      }
    };
  }
}
```

---

## 🔗 5. Integraciones Reales

### A. Sistema de Generación DOCX

```typescript
async function handleGenerarDocumento(supabase, userId, message, params) {
  if (!params?.template_slug || !params?.datos_completos) {
    // Mostrar plantillas y requerir datos
    return await listarPlantillasYRequerirDatos(supabase, params);
  }

  // Llamar al edge function existente: generate-legal-doc
  const { data, error } = await supabase.functions.invoke('generate-legal-doc', {
    body: {
      template_slug: params.template_slug,
      form_data: params.datos_formulario,
      case_id: params.caso_id
    }
  });

  if (error) {
    return {
      content: `❌ Error generando documento: ${error.message}`,
      metadata: { error: true }
    };
  }

  return {
    content: `✅ **Documento generado exitosamente**\n\n` +
             `📄 ${data.titulo}\n` +
             `• Tipo: ${data.tipo_acto}\n` +
             `• Formato: DOCX\n\n` +
             `[Descargar](${data.documento_url})`,
    tool_calls: [{ tool: 'generar_documento', doc_id: data.id }],
    tool_results: data
  };
}
```

### B. Sistema RAG Jurisprudencia

```typescript
async function handleBuscarJurisprudencia(supabase, userId, message) {
  // Llamar al edge function existente: search-jurisprudence-rag
  const { data, error } = await supabase.functions.invoke('search-jurisprudence-rag', {
    body: {
      query: message,
      limit: 5
    }
  });

  if (error || !data?.results?.length) {
    return {
      content: `No encontré jurisprudencia relevante para: "${message}".\n\n` +
               `¿Quieres que busque con otros términos?`,
      tool_calls: [{ tool: 'buscar_jurisprudencia', results: 0 }]
    };
  }

  let response = `🔍 **Jurisprudencia encontrada:**\n\n`;
  data.results.forEach((r: any, i: number) => {
    response += `**${i+1}. ${r.titulo || r.sentencia}**\n`;
    response += `   • Tribunal: ${r.tribunal}\n`;
    response += `   • Fecha: ${r.fecha}\n`;
    response += `   • Similitud: ${(r.similarity * 100).toFixed(0)}%\n`;
    response += `   ${r.resumen?.substring(0, 150)}...\n\n`;
  });

  response += `\n¿Quieres más detalles de alguna?`;

  return {
    content: response,
    tool_calls: [{ tool: 'buscar_jurisprudencia', count: data.results.length }],
    tool_results: data.results
  };
}
```

### C. Módulo de Facturación

```typescript
async function handleGenerarFactura(supabase, userId, message, params) {
  if (!params?.cliente_id || !params?.conceptos) {
    return await solicitarDatosFactura(params);
  }

  // Llamar al sistema de facturación existente
  const { data: tenantData } = await supabase.rpc('get_user_tenant_id', { p_user_id: userId });

  const factura = {
    user_id: userId,
    tenant_id: tenantData,
    client_id: params.cliente_id,
    // ... conceptos, subtotal, itbis, total
  };

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert(factura)
    .select()
    .single();

  if (error) {
    return {
      content: `❌ Error generando factura: ${error.message}`,
      metadata: { error: true }
    };
  }

  return {
    content: `✅ **Factura generada**\n\n` +
             `🧾 Factura #${invoice.numero_factura}\n` +
             `• Cliente: ${params.cliente_nombre}\n` +
             `• Subtotal: RD$${formatMoney(invoice.subtotal)}\n` +
             `• ITBIS: RD$${formatMoney(invoice.itbis)}\n` +
             `• **Total: RD$${formatMoney(invoice.total)}**\n\n` +
             `[Ver factura](/facturacion)`,
    tool_calls: [{ tool: 'generar_factura', invoice_id: invoice.id }],
    tool_results: invoice
  };
}
```

---

## 📊 6. Métricas y Analytics

Registrar en `agent_events`:
- Herramienta más usada por agente
- Tasa de confirmación vs cancelación
- Tiempo promedio de conversación multi-turn
- Tasa de éxito en búsqueda de entidades
- Errores más frecuentes

```typescript
// Ejemplo de logging detallado
await supabase.from('agent_events').insert({
  user_id: userId,
  event_type: 'tool_execution',
  summary: `${tool_name} ejecutado`,
  payload: {
    tool: tool_name,
    params: params,
    success: true,
    execution_time_ms: Date.now() - startTime,
    multi_turn_steps: conversationState?.step || 1
  }
});
```

---

## 🎨 7. UI Enhancements

### Botones de Confirmación
```tsx
// En ChatGlobalPraxisLex.tsx
{message.metadata?.requires_confirmation && (
  <div className="flex gap-2 mt-2">
    <Button 
      variant="destructive" 
      onClick={() => sendMessage("Sí, confirmar")}
    >
      ✓ Confirmar
    </Button>
    <Button 
      variant="outline" 
      onClick={() => sendMessage("No, cancelar")}
    >
      ✗ Cancelar
    </Button>
  </div>
)}
```

### Sugerencias de Acciones
```tsx
{message.metadata?.suggest_create_client && (
  <Button 
    variant="secondary" 
    onClick={() => sendMessage(`Sí, registra a ${message.metadata.suggest_create_client.nombre}`)}
  >
    ➕ Registrar cliente
  </Button>
)}
```

---

## ✅ Checklist de Implementación

- [ ] Tool calling para extracción de parámetros
- [ ] Estado de conversación multi-turn
- [ ] Sistema de confirmaciones
- [ ] Búsqueda fuzzy de clientes y casos
- [ ] Integración con generate-legal-doc
- [ ] Integración con search-jurisprudence-rag
- [ ] Integración con módulo de facturación
- [ ] Botones interactivos en UI
- [ ] Logging detallado de métricas
- [ ] Manejo de errores mejorado

---

**Con FASE 5, el AI-OS será un asistente conversacional completo y productivo** 🚀
