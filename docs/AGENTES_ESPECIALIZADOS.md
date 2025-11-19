# Sistema de Agentes Especializados AI-OS

## Arquitectura de Agentes

Cada agente es un módulo especializado con:
- **Identidad**: Nombre, descripción, expertise
- **Herramientas**: Conjunto de tools que puede invocar
- **Contexto**: Acceso a datos específicos del dominio
- **Prompt**: System prompt especializado

---

## 🤖 AGENTE 1: AgenteCasos

**Rol**: Gestión integral de expedientes y casos legales

**Intenciones que maneja**:
- `crear_caso`, `buscar_caso`, `actualizar_caso`, `listar_casos`
- `agregar_nota_caso`, `cambiar_estado_caso`

**Herramientas disponibles**:
```typescript
[
  {
    name: "crear_caso",
    description: "Crea un nuevo caso/expediente legal",
    parameters: {
      titulo: "string",
      materia: "enum[civil,penal,laboral,etc]",
      cliente_id: "uuid",
      descripcion: "string",
      numero_expediente: "string"
    }
  },
  {
    name: "buscar_casos",
    description: "Busca casos por filtros",
    parameters: {
      query: "string",
      materia: "string?",
      estado: "string?",
      cliente_id: "uuid?"
    }
  },
  {
    name: "obtener_detalles_caso",
    description: "Obtiene información completa de un caso",
    parameters: {
      caso_id: "uuid"
    }
  }
]
```

**System Prompt**:
```
Eres un asistente especializado en gestión de casos legales. 
Ayudas a abogados a crear, organizar y dar seguimiento a expedientes.
Siempre confirmas datos críticos antes de crear o modificar casos.
Usas terminología jurídica dominicana apropiada.
```

---

## 📄 AGENTE 2: AgenteDocumentos

**Rol**: Generación y gestión de documentos legales

**Intenciones que maneja**:
- `generar_documento`, `listar_plantillas`, `buscar_acto`
- `ver_historial_documentos`, `revisar_documento`

**Herramientas disponibles**:
```typescript
[
  {
    name: "listar_plantillas_disponibles",
    description: "Lista plantillas de actos/documentos disponibles",
    parameters: {
      materia: "string?",
      tipo_documento: "string?"
    }
  },
  {
    name: "generar_acto_legal",
    description: "Genera un acto legal usando una plantilla",
    parameters: {
      template_slug: "string",
      datos_formulario: "object",
      caso_id: "uuid?"
    }
  },
  {
    name: "obtener_actos_generados",
    description: "Lista actos generados por el usuario",
    parameters: {
      limit: "number?",
      tipo_acto: "string?"
    }
  }
]
```

**System Prompt**:
```
Eres un especialista en redacción de documentos legales dominicanos.
Conoces todas las plantillas disponibles y guías al usuario paso a paso.
Siempre validas que los datos requeridos estén completos antes de generar.
Explicas qué campos son obligatorios y por qué.
```

---

## 👤 AGENTE 3: AgenteClientes

**Rol**: Gestión de clientes y personas relacionadas

**Intenciones que maneja**:
- `crear_cliente`, `buscar_cliente`, `actualizar_cliente`
- `ver_casos_cliente`, `ver_facturacion_cliente`

**Herramientas disponibles**:
```typescript
[
  {
    name: "crear_cliente",
    description: "Registra un nuevo cliente",
    parameters: {
      nombre_completo: "string",
      cedula: "string?",
      email: "string?",
      telefono: "string?",
      tipo_persona: "enum[fisica,juridica]"
    }
  },
  {
    name: "buscar_clientes",
    description: "Busca clientes por nombre o cédula",
    parameters: {
      query: "string"
    }
  },
  {
    name: "obtener_perfil_cliente",
    description: "Obtiene perfil completo del cliente",
    parameters: {
      cliente_id: "uuid"
    }
  }
]
```

**System Prompt**:
```
Eres un asistente especializado en gestión de clientes.
Manejas datos sensibles con cuidado y confirmas antes de actualizar información personal.
Respetas las leyes de protección de datos de República Dominicana.
```

---

## 📅 AGENTE 4: AgenteCalendario

**Rol**: Gestión de plazos, audiencias y eventos judiciales

**Intenciones que maneja**:
- `programar_audiencia`, `crear_recordatorio`, `calcular_plazo`
- `ver_agenda`, `proximas_audiencias`, `plazos_vencimiento`

**Herramientas disponibles**:
```typescript
[
  {
    name: "calcular_plazo_procesal",
    description: "Calcula plazos según el Código Procesal",
    parameters: {
      tipo_plazo: "string",
      fecha_inicio: "date",
      materia: "string"
    }
  },
  {
    name: "crear_audiencia",
    description: "Programa una audiencia",
    parameters: {
      caso_id: "uuid",
      fecha: "date",
      hora: "time",
      juzgado: "string",
      tipo: "string"
    }
  },
  {
    name: "listar_proximos_eventos",
    description: "Lista eventos próximos",
    parameters: {
      dias: "number?",
      tipo: "string?"
    }
  }
]
```

**System Prompt**:
```
Eres un experto en gestión de agenda judicial dominicana.
Conoces los plazos procesales del CPC, CPP y normativas locales.
Siempre alertas sobre plazos críticos y vencimientos próximos.
Calculas plazos excluyendo días no laborables cuando corresponda.
```

---

## 💰 AGENTE 5: AgenteContabilidad

**Rol**: Facturación, gastos y finanzas del despacho

**Intenciones que maneja**:
- `crear_factura`, `registrar_gasto`, `ver_balance_cliente`
- `generar_reporte_ingresos`, `consultar_pendientes`

**Herramientas disponibles**:
```typescript
[
  {
    name: "crear_factura",
    description: "Genera una factura para un cliente",
    parameters: {
      cliente_id: "uuid",
      caso_id: "uuid?",
      conceptos: "array",
      monto_total: "number",
      descuento: "number?"
    }
  },
  {
    name: "registrar_gasto",
    description: "Registra un gasto del despacho",
    parameters: {
      concepto: "string",
      monto: "number",
      categoria: "string",
      caso_id: "uuid?"
    }
  },
  {
    name: "obtener_balance_cliente",
    description: "Consulta el estado de cuenta de un cliente",
    parameters: {
      cliente_id: "uuid"
    }
  }
]
```

**System Prompt**:
```
Eres un asistente contable especializado en despachos legales.
Manejas facturación, ITBIS y normativa fiscal dominicana.
Siempre confirmas montos y conceptos antes de registrar transacciones.
Ayudas a mantener la contabilidad organizada y cumplir con obligaciones fiscales.
```

---

## ⚖️ AGENTE 6: AgenteJurisprudencia

**Rol**: Búsqueda y análisis de jurisprudencia y doctrina

**Intenciones que maneja**:
- `buscar_jurisprudencia`, `analizar_sentencia`, `citar_doctrina`
- `encontrar_precedentes`, `revisar_legislacion`

**Herramientas disponibles**:
```typescript
[
  {
    name: "buscar_jurisprudencia_rag",
    description: "Busca jurisprudencia usando embeddings semánticos",
    parameters: {
      query: "string",
      materia: "string?",
      limite: "number?"
    }
  },
  {
    name: "analizar_texto_legal",
    description: "Analiza un texto legal o sentencia",
    parameters: {
      texto: "string",
      tipo_analisis: "enum[resumen,argumentos,ratio_decidendi]"
    }
  }
]
```

**System Prompt**:
```
Eres un investigador jurídico especializado en derecho dominicano.
Ayudas a encontrar jurisprudencia relevante, precedentes y doctrina.
Siempre citas las fuentes correctamente.
Analizas sentencias identificando ratio decidendi y obiter dicta.
```

---

## 💬 AGENTE 7: AgenteGeneral

**Rol**: Asistente conversacional general y coordinador

**Intenciones que maneja**:
- `saludo`, `ayuda`, `explicar_funcionalidad`, `guiar_usuario`
- Cualquier intención no especializada

**Herramientas disponibles**:
```typescript
[
  {
    name: "obtener_estadisticas_dashboard",
    description: "Obtiene métricas del dashboard del usuario",
    parameters: {}
  },
  {
    name: "explicar_funcionalidad",
    description: "Explica cómo usar una funcionalidad del sistema",
    parameters: {
      funcionalidad: "string"
    }
  }
]
```

**System Prompt**:
```
Eres PraxisLex AI, asistente general del sistema de gestión legal.
Eres amable, profesional y eficiente.
Cuando no puedes responder algo específico, delegas al agente especializado.
Ayudas al usuario a navegar el sistema y entender sus capacidades.
Hablas en español dominicano profesional.
```

---

## 🔄 Sistema de Delegación

El **Orquestador** usa el modelo de IA para:

1. **Clasificar intención** del mensaje del usuario
2. **Seleccionar agente** más apropiado
3. **Invocar herramientas** del agente si es necesario
4. **Retornar respuesta** contextualizada

```typescript
// Ejemplo de flujo
Usuario: "Quiero programar una audiencia para el caso de Juan Pérez"

Orquestador:
  └─> Clasifica: INTENCION = "programar_audiencia"
  └─> Selecciona: AGENTE = "AgenteCalendario"
  └─> Extrae: caso_cliente = "Juan Pérez", tipo_evento = "audiencia"
  └─> Invoca herramientas:
      1. buscar_cliente("Juan Pérez") → cliente_id
      2. buscar_casos(cliente_id) → caso_id
      3. pedir_detalles_audiencia() → fecha, hora, juzgado
      4. crear_audiencia({...}) → audiencia_id
  └─> Responde: "✅ Audiencia programada para [fecha] en [juzgado]"
```

---

## 📊 Métricas de Agentes

Cada agente registra en `agent_events`:
- `event_type`: tipo de acción realizada
- `act_slug`: contexto (si aplica)
- `payload`: datos de la acción
- `summary`: resumen de la acción

Esto permite:
- **Analytics**: ver qué agentes se usan más
- **Mejora continua**: identificar patrones
- **Auditoría**: rastrear acciones del sistema
