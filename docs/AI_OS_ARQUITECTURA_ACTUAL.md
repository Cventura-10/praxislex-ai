# PRAXISLEX AI-OS · ARQUITECTURA ACTUAL
**Diagnóstico completo del sistema existente**  
Fecha: 2025-01-19  
Fase: 0 - Mapeo Inicial

---

## 📊 RESUMEN EJECUTIVO

PraxisLex es un sistema legaltech funcional con:
- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Estado actual:** Sistema modular tradicional con IA básica
- **Objetivo:** Transformar en ecosistema conversacional de agentes (AI-OS)

---

## 🗂️ MÓDULOS FUNCIONALES EXISTENTES

### Módulos Core (implementados)
1. **Dashboard** - Vista general del despacho
2. **Casos** (`/casos`) - Gestión de expedientes
3. **Clientes** (`/clientes`) - Base de datos de clientes
4. **Audiencias** (`/audiencias`) - Calendario y plazos
5. **Documentos** (`/documentos`) - Gestión documental
6. **Redacción IA** (`/redaccion-ia`) - Generación de documentos
7. **Jurisprudencia** (`/jurisprudencia`) - Búsqueda jurídica
8. **Contabilidad** (`/contabilidad`, `/firm-accounting`) - Finanzas
9. **Facturación** (`/facturacion`) - Emisión de facturas
10. **Portal Cliente** (`/portal-cliente`) - Acceso clientes
11. **Configuración** (`/settings`, `/law-firm-settings`) - Ajustes

### Módulos Adicionales
- **Actos Procesales** (`/actos-procesales`)
- **Actos Notariales** (`/actos-notariales`)
- **Actos Generados** (`/actos-generados`)
- **Analytics** (`/analytics`)
- **Security** (`/security`)
- **Mensajes Clientes** (`/client-messages`)
- **Sala Virtual** (`/virtual-room`)
- **Administración Abogados** (`/lawyers-admin`)

---

## 🤖 IA EXISTENTE (Estado Actual)

### Componentes IA Actuales

#### 1. **FloatingAIWidget** 
- Ubicación: Global en toda la app
- Tipo: Widget flotante de chat
- Limitado: Sin especialización por módulo

#### 2. **ChatIA Component**
- Path: `src/components/ai/ChatIA.tsx`
- Funcionalidad básica de chat
- Sin agentes especializados

#### 3. **AssistantIA Page**
- Path: `src/pages/AssistantIA.tsx`
- Intenciones básicas de navegación
- No está en el flujo principal

### Edge Functions IA

| Función | Propósito | Estado |
|---------|-----------|--------|
| `agent-memory` | Almacenar patrones de uso | ✅ Activo |
| `assistant-help` | Asistente general | ✅ Activo |
| `generate-legal-doc` | Generar documentos jurídicos | ✅ Activo |
| `generate-document` | Generación genérica docs | ✅ Activo |
| `documents-generate` | Variante generación | ✅ Activo |
| `jurisprudence-search` | Búsqueda jurisprudencia | ✅ Activo |
| `search-jurisprudence-rag` | Búsqueda RAG semántica | ✅ Activo |
| `generate-embedding` | Generar embeddings | ✅ Activo |
| `transcribe-audio` | Transcripción voz | ✅ Activo |
| `doc-learning-*` | Aprendizaje de plantillas | ✅ Activo (3 funciones) |

---

## 🗄️ BASE DE DATOS SUPABASE

### Tablas Core (76 total)

#### Gestión Jurídica
- `cases` - Casos/expedientes
- `clients` - Clientes
- `hearings` - Audiencias (legacy)
- `calendar_events` - Eventos de calendario
- `deadlines` - Plazos procesales
- `plazos_procesales` - Plazos detallados

#### Documentos
- `documents` - Documentos generales
- `generated_acts` - Actos generados
- `notarial_acts` - Actos notariales
- `document_versions` - Versionado
- `document_templates` - Plantillas
- `document_citations` - Citas jurídicas

#### Finanzas
- `invoices` - Facturas
- `payments` - Pagos
- `expenses` - Gastos
- `client_credits` - Créditos de clientes

#### Profesionales
- `lawyers` - Abogados
- `notarios` - Notarios
- `alguaciles` - Alguaciles
- `peritos` - Peritos
- `tasadores` - Tasadores

#### IA & RAG
- `agent_patterns` - Patrones aprendidos
- `agent_events` - Eventos del agente
- `ai_usage` - Uso de IA
- `jurisprudence_embeddings` - Vectores jurisprudencia

#### Sistema
- `tenants` - Multi-tenancy
- `tenant_users` - Usuarios por tenant
- `user_roles` - Roles de usuario
- `notifications` - Notificaciones
- `reminders` - Recordatorios

#### Seguridad & Auditoría
- `events_audit` - Auditoría inmutable
- `data_access_audit` - Acceso a datos
- `pii_access_violations` - Violaciones PII
- `edge_function_rate_limits` - Rate limiting

#### Doc Learning
- `doc_learning_runs` - Ejecuciones de análisis
- `doc_learning_uploads` - Documentos cargados
- `doc_learning_clauses` - Cláusulas aprendidas
- `doc_learning_variables` - Variables identificadas
- `style_profiles` - Perfiles de estilo

---

## 🔧 FUNCIONES DE BASE DE DATOS

### Funciones Clave para IA
```sql
-- Memoria del Agente
upsert_agent_pattern(user_id, act_slug, pattern_key, pattern_value)
get_agent_suggestions(user_id, act_slug, limit)

-- Gestión de Casos
auto_generar_plazos_caso() -- Trigger automático
calcular_plazo_procesal(tipo_plazo, fecha_inicio, materia)

-- Permisos
has_role(user_id, role)
user_has_permission(user_id, permission)
get_user_role(user_id)

-- Búsqueda Jurisprudencia
search_jurisprudence(query_embedding, threshold, count, materia, user_id)

-- Notificaciones
create_notification(user_id, title, message, type, priority, ...)

-- Auditoría
log_audit_event(entity_type, entity_id, action, changes)
verify_audit_integrity(event_id)
```

---

## 🛣️ RUTAS DE LA APLICACIÓN

### Rutas Protegidas (requieren auth)
```typescript
/ → Dashboard
/casos → Cases
/clientes → Clients
/audiencias → Hearings
/documentos → Documents
/jurisprudencia → Jurisprudence
/redaccion-ia → AILegalDrafting
/contabilidad → Accounting
/facturacion → Billing
/portal-cliente → ClientPortal
/settings → Settings
/security → Security
/analytics → Analytics
/actos-procesales → LegalActsGenerator
/actos-notariales → NotarialActs
/actos-generados → ActosGenerados
/lawyers-admin → LawyersAdmin
/client-messages → ClientMessages
/virtual-room → VirtualRoom
```

### Rutas Públicas
```typescript
/auth → Auth (login/signup)
/invitation-accept → InvitationAccept
```

---

## 📦 ESTRUCTURA DE COMPONENTES

### Layout
- `Header.tsx` - Cabecera principal
- `Navigation.tsx` - Menú lateral
- `AuthGuard.tsx` - Protección de rutas

### IA Existente
- `ai/ChatIA.tsx` - Chat básico
- `ai/FloatingAIWidget.tsx` - Widget flotante
- `rag/JurisprudenceSearch.tsx` - Búsqueda RAG
- `rag/AIUsageMonitor.tsx` - Monitor uso IA
- `rag/DocumentCitations.tsx` - Citas

### Hooks IA
- `useAgentMemory.tsx` - Memoria de patrones
- Custom sin agentes especializados

---

## 🎯 GAP ANALYSIS: Actual vs AI-OS

### ❌ Lo que FALTA para ser AI-OS

#### 1. **Orquestador Central**
- No existe un "cerebro" que coordine todo
- Cada función IA opera independientemente
- Sin clasificación de intenciones del usuario

#### 2. **Agentes Especializados**
- No hay agentes por dominio (Casos, Clientes, etc.)
- La IA actual es genérica, no especializada
- Sin memoria contextual por módulo

#### 3. **Memoria Jerárquica**
- `agent_patterns` solo guarda patrones simples
- No hay memoria de sesión/conversación estructurada
- Sin memoria de caso/cliente integrada

#### 4. **Chat como Interfaz Principal**
- El chat es secundario (FloatingAIWidget)
- Las pantallas tradicionales son la interfaz principal
- No hay flujo conversacional para tareas complejas

#### 5. **Herramientas (Tools) Estructuradas**
- Edge functions existen pero no están expuestas como "tools"
- Sin formato estandarizado de tool calling
- No hay catálogo de acciones disponibles

#### 6. **RAG Jurídico Completo**
- `jurisprudence_embeddings` existe pero limitado
- Sin doctrina ni normativa indexada
- Sin pipeline completo de recuperación + generación

#### 7. **Coordinación entre Agentes**
- No existe comunicación inter-agente
- Sin delegación de tareas
- Sin combinación de respuestas

---

## ✅ Lo que SÍ funciona (Ventajas)

### Fortalezas Actuales
1. **Base de datos robusta** - 76 tablas bien diseñadas
2. **Edge functions maduras** - 21 funciones operativas
3. **Seguridad enterprise** - RLS, auditoría, cifrado
4. **Multi-tenancy** - Aislamiento por despacho
5. **RAG básico** - Embeddings y búsqueda vectorial
6. **Memoria de patrones** - `agent_patterns` funcional
7. **UI completa** - Componentes shadcn/ui listos

---

## 🔄 ARQUITECTURA PROPUESTA: AI-OS

### Capa 1: Agentes Inteligentes (nuevo)
```
OrquestadorJurídico (CORE)
  ├── AgenteGestiónCasos
  ├── AgenteGestiónClientes
  ├── AgenteAudienciasCalendario
  ├── AgenteDocumentosRedacción
  ├── AgenteJurisprudencia
  ├── AgenteFacturación
  └── AgentePortalCliente
```

### Capa 2: Herramientas (Tools) - reutilizar edge functions
```typescript
// Catálogo de Tools disponibles
tools = {
  // Casos
  crear_caso: async (data) => supabase.from('cases').insert(data),
  actualizar_caso: async (id, data) => supabase.from('cases').update(data).eq('id', id),
  listar_casos: async (filters) => supabase.from('cases').select('*').match(filters),
  
  // Documentos
  generar_documento: async (tipo, datos) => supabase.functions.invoke('generate-legal-doc', { body: { tipo, datos } }),
  buscar_jurisprudencia: async (query) => supabase.functions.invoke('search-jurisprudence-rag', { body: { query } }),
  
  // Clientes
  crear_cliente: async (data) => supabase.from('clients').insert(data),
  revelar_pii: async (client_id) => supabase.rpc('reveal_client_pii', { p_client_id: client_id }),
  
  // ... más tools
}
```

### Capa 3: Memoria Estructurada (expandir tablas existentes)
```sql
-- Nueva tabla: chat_conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  context_type TEXT, -- 'general', 'case', 'client', etc.
  context_id UUID, -- ID del caso/cliente si aplica
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nueva tabla: chat_messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id),
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  agent_name TEXT, -- Qué agente respondió
  tool_calls JSONB, -- Qué tools se usaron
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expandir: agent_patterns (ya existe, mejorar)
-- Expandir: agent_events (ya existe, mejorar)
```

### Capa 4: Interfaz Conversacional (nuevo componente)
```
ChatGlobalPraxisLex (componente principal)
  ├── MessageList
  ├── InputArea (voz + texto)
  ├── ContextIndicator (muestra caso/cliente actual)
  ├── QuickActions (botones contextuales)
  └── AgentStatusIndicator
```

---

## 📋 PRÓXIMOS PASOS (ROADMAP)

### FASE 1 - Chat Unificado + Orquestador
- [ ] Crear `ChatGlobalPraxisLex` component
- [ ] Implementar `OrquestadorJurídico` edge function
- [ ] Clasificador de intenciones
- [ ] Integrar en Dashboard como interfaz principal
- [ ] Crear tablas `chat_conversations` y `chat_messages`

### FASE 2 - Agentes de Casos y Clientes
- [ ] `AgenteGestiónCasos` edge function
- [ ] `AgenteGestiónClientes` edge function
- [ ] Tools: CRUD casos y clientes
- [ ] Memoria contextual por caso/cliente

### FASE 3 - Documentos y Redacción IA
- [ ] `AgenteDocumentosRedacción` edge function
- [ ] Integrar `generate-legal-doc` como tool
- [ ] Flujo conversacional de redacción

### FASE 4 - Jurisprudencia
- [ ] `AgenteJurisprudencia` edge function
- [ ] Expandir RAG con doctrina y normativa
- [ ] Formato de respuestas con citas estructuradas

### FASE 5 - Audiencias y Calendario
- [ ] `AgenteAudienciasCalendario` edge function
- [ ] Cálculo inteligente de plazos
- [ ] Recordatorios automáticos

### FASE 6 - Facturación
- [ ] `AgenteFacturación` edge function
- [ ] Generación conversacional de facturas
- [ ] Reportes financieros en lenguaje natural

### FASE 7 - Portal Cliente
- [ ] `AgentePortalCliente` edge function
- [ ] Modo cliente con restricciones
- [ ] Explicaciones simplificadas

### FASE 8 - Métricas
- [ ] Dashboard de uso por agente
- [ ] Logging estructurado
- [ ] Observabilidad

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

### Mantenidas del Sistema Actual
- ✅ RLS en todas las tablas
- ✅ Cifrado de PII (cédulas)
- ✅ Auditoría inmutable (`events_audit`)
- ✅ Rate limiting en edge functions
- ✅ Multi-tenancy estricto

### Nuevas para AI-OS
- Validar que agentes respeten RLS
- Logging de todas las acciones del orquestador
- Anonimización automática antes de enviar a LLM
- Rate limiting específico por agente
- Verificación de permisos antes de tool calls

---

## 📊 MÉTRICAS DE COMPLEJIDAD

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| Tablas DB | 76 | ✅ Maduras |
| Edge Functions | 21 | ✅ Operativas |
| Páginas React | 30+ | ✅ Funcionales |
| Componentes | 150+ | ✅ Modulares |
| Agentes IA | 0 | ❌ Por crear |
| Tools definidos | 0 | ❌ Por definir |
| Chat principal | 0 | ❌ Por crear |

---

## 🎓 LECCIONES CLAVE

### ¿Qué reutilizar?
- ✅ Toda la base de datos
- ✅ Todas las edge functions (convertir en tools)
- ✅ Componentes UI (shadcn)
- ✅ Sistema de auth y seguridad
- ✅ RAG básico existente

### ¿Qué crear nuevo?
- 🆕 Orquestador central
- 🆕 7-8 agentes especializados
- 🆕 Sistema de tools estandarizado
- 🆕 Chat principal en Dashboard
- 🆕 Memoria conversacional estructurada
- 🆕 Clasificador de intenciones

### ¿Qué modificar?
- 🔄 `agent_patterns` → más rico
- 🔄 `agent_events` → más estructurado
- 🔄 FloatingAIWidget → integrar al chat principal
- 🔄 Rutas → chat como punto de entrada

---

**FIN DEL DIAGNÓSTICO - FASE 0 COMPLETADA** ✅
