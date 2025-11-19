# FASE 4 - Herramientas Avanzadas (CRUD Completo)

## Objetivo

Permitir al usuario **crear, actualizar y eliminar** datos directamente desde el chat IA, transformando el asistente de solo-lectura a uno completamente funcional.

---

## 🛠️ Nuevas Herramientas a Implementar

### 1. **Gestión de Casos**

```typescript
{
  name: "crear_caso",
  description: "Crea un nuevo caso/expediente legal",
  parameters: {
    titulo: string,
    materia: enum,
    numero_expediente: string,
    cliente_id: uuid,
    descripcion?: string,
    juzgado?: string
  }
}

{
  name: "actualizar_caso",
  description: "Actualiza información de un caso existente",
  parameters: {
    caso_id: uuid,
    updates: {
      titulo?: string,
      estado?: string,
      descripcion?: string,
      etapa_procesal?: string
    }
  }
}
```

### 2. **Gestión de Clientes**

```typescript
{
  name: "crear_cliente",
  description: "Registra un nuevo cliente (persona física o jurídica)",
  parameters: {
    nombre_completo: string,
    tipo_persona: "fisica" | "juridica",
    cedula?: string,
    email?: string,
    telefono?: string,
    direccion?: string
  }
}

{
  name: "actualizar_cliente",
  description: "Actualiza datos de un cliente",
  parameters: {
    cliente_id: uuid,
    updates: {
      email?: string,
      telefono?: string,
      direccion?: string
    }
  }
}
```

### 3. **Gestión de Calendario**

```typescript
{
  name: "programar_audiencia",
  description: "Programa una audiencia o evento judicial",
  parameters: {
    caso_id: uuid,
    fecha: date,
    hora: time,
    juzgado: string,
    tipo_audiencia?: string,
    descripcion?: string
  }
}

{
  name: "crear_plazo",
  description: "Registra un plazo procesal manualmente",
  parameters: {
    caso_id: uuid,
    tipo_plazo: string,
    fecha_vencimiento: date,
    descripcion: string,
    prioridad?: "baja" | "media" | "alta" | "critica"
  }
}
```

### 4. **Generación de Documentos**

```typescript
{
  name: "generar_acto_legal",
  description: "Genera un acto legal usando una plantilla",
  parameters: {
    template_slug: string,
    titulo: string,
    datos_formulario: object,
    caso_id?: uuid,
    guardar?: boolean
  }
}

{
  name: "obtener_url_documento",
  description: "Obtiene la URL de descarga de un documento generado",
  parameters: {
    acto_id: uuid
  }
}
```

### 5. **Gestión de Facturación**

```typescript
{
  name: "crear_factura",
  description: "Genera una factura para un cliente",
  parameters: {
    cliente_id: uuid,
    caso_id?: uuid,
    conceptos: Array<{concepto: string, monto: number}>,
    descuento?: number,
    notas?: string
  }
}

{
  name: "registrar_gasto",
  description: "Registra un gasto del despacho",
  parameters: {
    caso_id?: uuid,
    concepto: string,
    monto: number,
    categoria: string,
    fecha?: date
  }
}
```

---

## 🎯 Flujos de Conversación Mejorados

### Ejemplo 1: Crear Caso desde Chat

```
Usuario: "Necesito crear un caso para Juan Pérez, es civil"

Agente: [Clasifica: crear_caso]
AgenteCasos: "Claro, voy a crear un caso civil. 
¿Cuál es el título o asunto del caso?"

Usuario: "Demanda de desalojo"

AgenteCasos: "Perfecto. ¿Tienes el número de expediente?"

Usuario: "Sí, es 001-2025-CIVI-12345"

AgenteCasos: [Ejecuta: buscar_cliente("Juan Pérez")]
[Encuentra cliente_id: uuid-123]
[Ejecuta: crear_caso({
  titulo: "Demanda de desalojo",
  materia: "Civil y Comercial",
  numero_expediente: "001-2025-CIVI-12345",
  cliente_id: "uuid-123"
})]

AgenteCasos: "✅ Caso creado exitosamente:
• Título: Demanda de desalojo
• Expediente: 001-2025-CIVI-12345
• Cliente: Juan Pérez
• Materia: Civil y Comercial

¿Necesitas programar una audiencia o registrar plazos?"
```

### Ejemplo 2: Programar Audiencia

```
Usuario: "Tengo audiencia el 15 de enero a las 9am en el Juzgado de Paz"

Agente: [Clasifica: programar_audiencia]
AgenteCalendario: "Entendido. ¿Para qué caso es esta audiencia?"

Usuario: "Para el caso de desalojo de Juan Pérez"

AgenteCalendario: [Ejecuta: buscar_casos("desalojo Juan Pérez")]
[Encuentra caso_id: uuid-abc]
[Ejecuta: programar_audiencia({
  caso_id: "uuid-abc",
  fecha: "2025-01-15",
  hora: "09:00",
  juzgado: "Juzgado de Paz"
})]

AgenteCalendario: "✅ Audiencia programada:
• Caso: Demanda de desalojo
• Fecha: 15 de enero de 2025
• Hora: 9:00 AM
• Lugar: Juzgado de Paz

Te enviaré un recordatorio 24 horas antes."
```

### Ejemplo 3: Generar Documento

```
Usuario: "Genera un poder especial para Juan Pérez"

Agente: [Clasifica: generar_documento]
AgenteDocumentos: [Ejecuta: listar_plantillas("poder")]
[Encuentra: poder-especial-judicial]

AgenteDocumentos: "Encontré la plantilla 'Poder Especial Judicial'. 
¿Quién será el apoderado?"

Usuario: "Licenciada María López"

AgenteDocumentos: "¿Qué facultades le quieres otorgar?"

Usuario: "Representar en juicio civil, presentar demandas y recursos"

AgenteDocumentos: [Ejecuta: generar_acto_legal({
  template_slug: "poder-especial-judicial",
  titulo: "Poder Especial - Juan Pérez a María López",
  datos_formulario: {
    poderdante: "Juan Pérez",
    apoderado: "María López",
    facultades: "Representar en juicio civil..."
  }
})]

AgenteDocumentos: "✅ Documento generado:
• Tipo: Poder Especial Judicial
• Poderdante: Juan Pérez
• Apoderado: Licda. María López

[Descargar Documento] [Ver en Navegador]"
```

---

## 🔄 Flujo de Confirmación

Para acciones críticas (crear, actualizar, eliminar), implementar confirmación:

```typescript
// Patrón de confirmación
if (accion_critica) {
  return {
    tipo: "confirmacion_requerida",
    mensaje: "¿Estás seguro de [acción]?",
    datos_previos: {...},
    opciones: ["Sí, confirmar", "No, cancelar", "Modificar"]
  }
}
```

---

## 📊 Validaciones

Cada herramienta debe validar:
1. ✅ Permisos del usuario
2. ✅ Campos obligatorios completos
3. ✅ Formato de datos correcto
4. ✅ Referencias existen (cliente_id, caso_id)
5. ✅ No duplicados (ej: mismo expediente)

---

## 🎨 Respuestas Enriquecidas

Las respuestas deben incluir:
- ✅ Confirmación visual clara
- 📎 Links a recursos creados
- 📊 Resumen de datos
- 🔔 Próximas acciones sugeridas

Ejemplo:
```
✅ Cliente registrado exitosamente

📋 Datos del cliente:
• Nombre: Juan Pérez Rodríguez
• Cédula: 001-1234567-8
• Email: juan.perez@email.com
• Teléfono: 809-123-4567

🔗 [Ver perfil completo] [Crear caso] [Enviar invitación]

💡 ¿Quieres crear un caso para este cliente?
```

---

## 🔐 Seguridad

- RLS políticas verifican user_id automáticamente
- Validación de inputs en edge function
- Rate limiting por herramienta
- Logs en `agent_events` para auditoría
- No se exponen datos sensibles en logs

---

## 📈 Métricas

Trackear en `agent_events`:
- Herramientas más usadas
- Tiempo promedio de ejecución
- Tasa de éxito/error
- Campos faltantes frecuentes

---

## 🚀 Implementación

1. Actualizar `TOOLS_DEFINITION` en orquestador
2. Implementar funciones en `ejecutarHerramienta()`
3. Agregar validaciones
4. Testear cada flujo
5. Documentar en UI (tooltips, ejemplos)

---

**FASE 4 transformará el asistente en una herramienta de productividad completa** 🎯
