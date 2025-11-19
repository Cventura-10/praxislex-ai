# 📊 FASE 7 - Analytics y Optimización del AI-OS

## 🎯 Objetivos

1. **Dashboard de métricas de uso**
   - Visualizar uso de agentes
   - Documentos generados por tipo
   - Búsquedas jurisprudenciales más frecuentes
   - Tasa de éxito de clasificación de intenciones

2. **Optimización de prompts**
   - Análisis de confidence scores
   - Identificar patrones de errores
   - Ajustar umbrales de clasificación

3. **Sugerencias proactivas**
   - Basadas en historial del usuario
   - Patrones de casos similares
   - Recordatorios inteligentes

4. **Reportes automáticos**
   - Resumen semanal de actividad
   - Alertas de plazos próximos
   - Tendencias de uso

---

## 📈 1. Dashboard de Analytics

### 1.1 Métricas Principales

**Vista General:**
```
┌─────────────────────────────────────────┐
│ AI-OS Analytics - Últimos 30 días      │
├─────────────────────────────────────────┤
│                                         │
│ 🤖 Agentes Más Usados                  │
│ ├─ Gestión de Casos: 45%               │
│ ├─ Documentos: 28%                     │
│ ├─ Clientes: 15%                       │
│ ├─ Jurisprudencia: 8%                  │
│ └─ Otros: 4%                           │
│                                         │
│ 📄 Documentos Generados: 127           │
│ ├─ Demandas: 42                        │
│ ├─ Contratos: 35                       │
│ ├─ Poderes: 28                         │
│ └─ Otros: 22                           │
│                                         │
│ 🔍 Búsquedas RAG: 89                   │
│ ├─ Civil: 52%                          │
│ ├─ Penal: 23%                          │
│ ├─ Laboral: 15%                        │
│ └─ Otros: 10%                          │
│                                         │
│ ✅ Tasa de Éxito: 94%                  │
│ ⚡ Tiempo Promedio: 2.3s               │
└─────────────────────────────────────────┘
```

### 1.2 Nuevas Tablas Analytics

```sql
-- Tabla para métricas agregadas
CREATE TABLE ai_os_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  agent_usage JSONB NOT NULL,
  -- Ejemplo: { "casos": 45, "documentos": 28, ... }
  intent_classification JSONB NOT NULL,
  -- { "success_rate": 0.94, "avg_confidence": 0.87 }
  top_queries JSONB,
  -- ["crear caso", "generar demanda", ...]
  avg_response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para tracking detallado
CREATE TABLE ai_os_session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id),
  user_id UUID NOT NULL,
  intent STRING NOT NULL,
  agent_name STRING,
  confidence FLOAT,
  response_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 Dashboard React Component

**Componente: `src/components/ai/AIDashboard.tsx`**

```tsx
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function AIDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['ai-metrics'],
    queryFn: async () => {
      const { data } = await supabase
        .rpc('get_ai_metrics', { days: 30 });
      return data;
    }
  });

  return (
    <div className="grid gap-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <h3 className="text-sm text-muted-foreground">Consultas AI</h3>
            <p className="text-3xl font-bold">{metrics?.total_queries}</p>
          </div>
        </Card>
        {/* Más KPIs... */}
      </div>

      {/* Gráfico de uso de agentes */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Uso por Agente</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics?.agent_usage}>
              <XAxis dataKey="agent" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
```

---

## 🎯 2. Optimización de Clasificación

### 2.1 Análisis de Confidence Scores

**Función RPC: `analyze_classification_performance`**

```sql
CREATE OR REPLACE FUNCTION analyze_classification_performance(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  intent STRING,
  avg_confidence FLOAT,
  success_rate FLOAT,
  total_attempts INTEGER,
  avg_response_time_ms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    intent_detected as intent,
    AVG(confidence) as avg_confidence,
    (COUNT(*) FILTER (WHERE success = true))::FLOAT / COUNT(*) as success_rate,
    COUNT(*)::INTEGER as total_attempts,
    AVG(response_time_ms)::INTEGER as avg_response_time_ms
  FROM ai_os_session_analytics
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 day' * p_days
  GROUP BY intent_detected
  ORDER BY total_attempts DESC;
END;
$$ LANGUAGE plpgsql;
```

### 2.2 Ajuste Dinámico de Umbrales

Si un intent tiene baja confidence pero alta success rate → bajar umbral
Si un intent tiene alta confidence pero baja success rate → revisar prompt

**Función: Ajustar clasificador basado en métricas**

```typescript
async function optimizeClassifier(supabase: any, userId: string) {
  const { data: performance } = await supabase.rpc('analyze_classification_performance', {
    p_user_id: userId,
    p_days: 30
  });

  const recommendations = [];

  performance.forEach(p => {
    if (p.avg_confidence < 0.7 && p.success_rate > 0.85) {
      recommendations.push({
        intent: p.intent,
        action: 'lower_threshold',
        reason: 'Alta tasa de éxito con baja confidence',
        suggested_threshold: 0.6
      });
    }

    if (p.avg_confidence > 0.9 && p.success_rate < 0.7) {
      recommendations.push({
        intent: p.intent,
        action: 'improve_prompt',
        reason: 'Alta confidence pero baja tasa de éxito'
      });
    }
  });

  return recommendations;
}
```

---

## 💡 3. Sugerencias Proactivas

### 3.1 Sistema de Patrones

**Detectar patrones de uso:**

```typescript
// Detectar que el usuario siempre crea caso → genera demanda
const pattern = {
  sequence: ['crear_caso', 'generar_documento'],
  frequency: 0.85, // 85% de las veces
  suggestion: "¿Quieres que genere la demanda automáticamente al crear el caso?"
};
```

**Almacenar en tabla:**

```sql
CREATE TABLE ai_user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pattern_type STRING NOT NULL,
  -- 'sequence', 'preference', 'schedule'
  pattern_data JSONB NOT NULL,
  frequency FLOAT NOT NULL,
  last_suggested_at TIMESTAMPTZ,
  accepted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Sugerencias en Chat

```typescript
// En el orquestador, al final de cada respuesta
async function getProactiveSuggestions(supabase: any, userId: string) {
  const { data: patterns } = await supabase
    .from('ai_user_patterns')
    .select('*')
    .eq('user_id', userId)
    .eq('accepted', null) // No han respondido aún
    .gte('frequency', 0.7)
    .is('last_suggested_at', null);

  if (patterns && patterns.length > 0) {
    const suggestion = patterns[0];
    return {
      text: `💡 **Sugerencia**: ${suggestion.pattern_data.message}`,
      pattern_id: suggestion.id
    };
  }

  return null;
}
```

### 3.3 Ejemplo de Flujo

```
Usuario: "Crea un caso de cobro de pesos para Juan Pérez"

Agente: ✅ Caso creado exitosamente
📋 Cobro de pesos
• Cliente: Juan Pérez
• Expediente: 001-2025-CIVI-00156

💡 **Sugerencia basada en tu historial**:
Normalmente generas una demanda después de crear un caso de cobro.
¿Quieres que genere la demanda ahora?

[Botón: ✓ Sí, generar demanda]
```

---

## 📊 4. Reportes Automáticos

### 4.1 Resumen Semanal

**Edge Function: `generate-weekly-summary`**

```typescript
// Ejecutar cada lunes a las 8 AM
async function generateWeeklySummary(userId: string) {
  const { data: metrics } = await supabase.rpc('get_ai_metrics', {
    p_user_id: userId,
    days: 7
  });

  const summary = `
📊 **Resumen Semanal AI-OS**

🤖 **Interacciones**: ${metrics.total_queries}
📄 **Documentos generados**: ${metrics.documents_generated}
📋 **Casos creados**: ${metrics.cases_created}
🔍 **Búsquedas jurisprudenciales**: ${metrics.searches}

⭐ **Agente más usado**: ${metrics.top_agent}
⚡ **Tiempo promedio de respuesta**: ${metrics.avg_response_time}s

💡 **Recomendación de la semana**:
${getWeeklyRecommendation(metrics)}
  `;

  // Guardar en chat_messages como mensaje del sistema
  await supabase.from('chat_messages').insert({
    conversation_id: await getOrCreateSystemConversation(userId),
    role: 'assistant',
    content: summary,
    metadata: { type: 'weekly_summary' }
  });
}
```

### 4.2 Alertas Inteligentes

```typescript
// Verificar plazos próximos y generar alerta
async function checkUpcomingDeadlines(userId: string) {
  const { data: plazos } = await supabase
    .from('plazos_procesales')
    .select('*, cases(titulo)')
    .eq('user_id', userId)
    .gte('fecha_vencimiento', new Date())
    .lte('fecha_vencimiento', addDays(new Date(), 3));

  if (plazos && plazos.length > 0) {
    const alert = `
⚠️ **Alerta de Plazos Próximos**

Tienes ${plazos.length} plazo(s) que vencen en los próximos 3 días:

${plazos.map(p => `• ${p.tipo_plazo} - ${p.cases.titulo}`).join('\n')}

¿Necesitas ayuda con alguno?
    `;

    // Enviar notificación
    await sendProactiveAlert(userId, alert);
  }
}
```

---

## 🚀 5. Implementación Prioritaria

### Fase 7.1: Tracking Básico (1-2 días)
- ✅ Crear tablas de analytics
- ✅ Instrumentar orquestador con tracking
- ✅ RPC functions para métricas

### Fase 7.2: Dashboard (2-3 días)
- ✅ Componente de dashboard
- ✅ Gráficos de uso
- ✅ KPIs principales

### Fase 7.3: Optimización (2-3 días)
- ✅ Análisis de performance
- ✅ Ajuste de umbrales
- ✅ Mejora de prompts

### Fase 7.4: Sugerencias Proactivas (2-3 días)
- ✅ Detección de patrones
- ✅ Sistema de sugerencias
- ✅ Reportes automáticos

---

## 📐 Métricas de Éxito

**KPIs a medir:**
- Tasa de éxito de clasificación > 95%
- Tiempo promedio de respuesta < 2s
- Satisfacción del usuario (thumbs up/down)
- Tasa de adopción de sugerencias > 60%

**Optimizaciones esperadas:**
- -30% en tiempo de respuesta
- +15% en tasa de éxito
- +40% en productividad del usuario

---

## ✅ Entregables

1. **Dashboard de Analytics** - Visualización completa de métricas
2. **Sistema de Optimización** - Ajuste automático de clasificador
3. **Sugerencias Proactivas** - Basadas en patrones de uso
4. **Reportes Automáticos** - Resúmenes semanales y alertas

---

**El AI-OS evolucionará de asistente reactivo a proactivo** 🚀🎯
