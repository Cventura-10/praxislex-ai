# Guía de Implementación - Fase 1: Correcciones Críticas

**Objetivo:** Resolver los errores de lógica procesal identificados (Emplazamiento y Querella Penal)  
**Tiempo Estimado:** 1-2 días  
**Prioridad:** MÁXIMA

---

## Resumen de la Fase 1

Esta fase se enfoca en corregir los dos errores más críticos del sistema:
1. **Emplazamientos generados con estructura de demanda** (relato fáctico, fundamentos de derecho)
2. **Querellas penales generadas como actos de alguacil** (con traslado, proceso verbal)

---

## Paso 1: Población de la Base de Datos

### 1.1 Ejecutar el Script SQL

**Archivo:** `migracion_act_types.sql`

**Instrucciones:**
1. Conectarse a la base de datos de Lovable (Supabase)
2. Abrir el SQL Editor
3. Copiar y pegar el contenido de `migracion_act_types.sql`
4. Ejecutar el script

**Resultado Esperado:**
- 3 nuevos registros en `act_types` (emplazamiento, querella_penal_actor_civil, inventario_documentos)
- 52 nuevos registros en `act_fields` (21 + 26 + 5)

**Verificación:**
```sql
-- Verificar que los actos se insertaron correctamente
SELECT slug, title, num_fields FROM act_types 
WHERE slug IN ('emplazamiento', 'querella_penal_actor_civil', 'inventario_documentos');

-- Debe retornar:
-- emplazamiento | Emplazamiento | 21
-- querella_penal_actor_civil | Querella Penal con Constitución en Actor Civil | 26
-- inventario_documentos | Inventario de Documentos | 5
```

---

## Paso 2: Integración de Plantillas en el Código

### 2.1 Actualizar `legalActsTemplates.ts`

**Ubicación:** `src/lib/legalActsTemplates.ts`

**Acción:** Agregar las nuevas plantillas al archivo.

**Código a Agregar:**

```typescript
// ========== IMPORTAR LAS NUEVAS PLANTILLAS ==========
import { EMPLAZAMIENTO_TEMPLATE } from './templates/emplazamiento';
import { QUERELLA_PENAL_TEMPLATE } from './templates/querellaPenal';

// ========== AGREGAR AL REGISTRY ==========
export const TEMPLATES_REGISTRY: Record<string, LegalActTemplate> = {
  // ... plantillas existentes ...
  
  // NUEVAS PLANTILLAS CRÍTICAS
  'emplazamiento': EMPLAZAMIENTO_TEMPLATE,
  'querella_penal_actor_civil': QUERELLA_PENAL_TEMPLATE,
  
  // ... resto de plantillas ...
};
```

**Nota:** Los archivos `EMPLAZAMIENTO_TEMPLATE.ts` y `QUERELLA_PENAL_TEMPLATE.ts` deben copiarse a la carpeta `src/lib/templates/`.

### 2.2 Crear Carpeta de Templates

**Comando:**
```bash
mkdir -p src/lib/templates
```

**Copiar Archivos:**
```bash
cp EMPLAZAMIENTO_TEMPLATE.ts src/lib/templates/emplazamiento.ts
cp QUERELLA_PENAL_TEMPLATE.ts src/lib/templates/querellaPenal.ts
```

---

## Paso 3: Actualizar `IntakeFormFlow.tsx`

### 3.1 Agregar Validación de Campos Prohibidos

**Ubicación:** `src/components/IntakeFormFlow.tsx`

**Buscar la sección de validación de seguridad** (línea ~81-86 según auditoría)

**Código Actual:**
```typescript
// ⚠️ SEGURIDAD CRÍTICA: NO permitir campos judiciales en actos extrajudiciales
if (isExtrajudicial) {
  const forbiddenFields = judicialFieldKeys.filter(key => formData[key]);
  if (forbiddenFields.length > 0) {
    throw new Error(`❌ Los campos judiciales no pueden usarse en extrajudiciales`);
  }
}
```

**Código Mejorado (Agregar DESPUÉS del bloque anterior):**
```typescript
// ⚠️ VALIDACIÓN CRÍTICA: Emplazamientos NO deben tener campos de fondo
if (actInfo.act.id === 'emplazamiento') {
  const forbiddenForEmplazamiento = [
    'hechos', 'relato_factico', 'fundamentos_derecho',
    'tesis_derecho', 'petitorio_detallado', 'dispositivos'
  ];
  
  const foundForbidden = forbiddenForEmplazamiento.filter(key => formData[key]);
  if (foundForbidden.length > 0) {
    throw new Error(
      `❌ ERROR CRÍTICO: Un emplazamiento NO debe contener: ${foundForbidden.join(', ')}. ` +
      `Es un acto de notificación pura, no una demanda.`
    );
  }
}

// ⚠️ VALIDACIÓN CRÍTICA: Querellas NO deben tener campos de alguacil
if (actInfo.act.id === 'querella_penal_actor_civil') {
  const forbiddenForQuerella = [
    'alguacil_nombre', 'alguacil_cedula', 'traslado',
    'proceso_verbal', 'persona_contactada', 'costo_acto'
  ];
  
  const foundForbidden = forbiddenForQuerella.filter(key => formData[key]);
  if (foundForbidden.length > 0) {
    throw new Error(
      `❌ ERROR CRÍTICO: Una querella NO es un acto de alguacil. ` +
      `Campos prohibidos: ${foundForbidden.join(', ')}`
    );
  }
}
```

### 3.2 Actualizar la Lógica de Campos Activos

**Buscar la sección donde se definen los campos activos** (línea ~62-63 según auditoría)

**Código Actual:**
```typescript
const isJudicial = isJudicialActType(actInfo.act.id);
const activeFields = isJudicial ? JUDICIAL_FIELDS : EXTRAJUDICIAL_FIELDS;
```

**Código Mejorado:**
```typescript
const isJudicial = isJudicialActType(actInfo.act.id);

// Cargar campos específicos de la plantilla si existe
const template = TEMPLATES_REGISTRY[actInfo.act.id];
const activeFields = template?.fields || (isJudicial ? JUDICIAL_FIELDS : EXTRAJUDICIAL_FIELDS);
```

**Explicación:** Esto hace que el formulario use los campos definidos en la plantilla específica del acto, en lugar de los campos genéricos.

---

## Paso 4: Actualizar la Edge Function `generate-legal-doc`

### 4.1 Integrar Mandatos como Prompts

**Ubicación:** `supabase/functions/generate-legal-doc/index.ts`

**Buscar la sección donde se construye el prompt para la IA**

**Código a Agregar:**

```typescript
// ========== MANDATOS COMO PROMPTS ==========
const MANDATOS: Record<string, string> = {
  'emplazamiento': `
MANDATO CRÍTICO: Este es un acto de notificación pura.
- NO incluir relato fáctico
- NO incluir fundamentos de derecho
- NO incluir tesis de derecho
- SOLO incluir: Traslado → Citación → Advertencia de Defecto → Cierre
Estructura: Encabezado Alguacil → Traslado → Citación (Avenir) → Advertencia → Cierre
El documento debe tener MÁXIMO 2 páginas.
  `,
  
  'querella_penal_actor_civil': `
MANDATO CRÍTICO: Este es un escrito de depósito, NO un acto de alguacil.
- NO incluir designación de alguacil
- NO incluir proceso verbal de traslado
- Estructura: Relato Hechos → Calificación Jurídica → Pruebas → Constitución Actor Civil → Petitorio
Terminología: Querellante, Imputado, Infracción (NO Demandante, Demandado)
  `
};

// ========== CONSTRUCCIÓN DEL PROMPT ==========
const mandato = MANDATOS[actType] || '';

const prompt = `
${mandato}

Genera un ${actName} con los siguientes datos:
${JSON.stringify(formData, null, 2)}

Asegúrate de seguir la estructura correcta y cumplir con todas las reglas del mandato.
`;
```

### 4.2 Verificar la Llamada a la IA

**Código Existente (según auditoría):**
```typescript
const { data } = await supabase.functions.invoke("generate-legal-doc", {
  body: {
    actType: actInfo.act.id,
    actName: actInfo.act.name,
    materia: actInfo.matter.name.toLowerCase(),
    formData: formData
  }
});
```

**Verificación:** Este código ya está correcto. Solo asegurarse de que la Edge function reciba el `actType` correctamente.

---

## Paso 5: Actualizar `legalActsData.ts`

### 5.1 Verificar que los Actos Estén Definidos

**Ubicación:** `src/lib/legalActsData.ts`

**Buscar en la materia "Civil y Comercial":**

```typescript
{
  id: 'emplazamiento',
  name: 'Emplazamiento',
  type: 'judicial',
  hasIntake: true,  // ✅ Asegurarse de que esté en true
  hasManual: true
}
```

**Buscar en la materia "Penal":**

```typescript
{
  id: 'querella_penal_actor_civil',
  name: 'Querella Penal con Constitución en Actor Civil',
  type: 'judicial',
  hasIntake: true,  // ✅ Asegurarse de que esté en true
  hasManual: true
}
```

**Nota:** Si estos actos no existen en `legalActsData.ts`, agregarlos en las materias correspondientes.

---

## Paso 6: Pruebas de Verificación

### 6.1 Prueba de Emplazamiento

**Objetivo:** Verificar que el emplazamiento generado NO contenga relato fáctico ni fundamentos de derecho.

**Procedimiento:**
1. Navegar a "Actos Judiciales" → "Civil y Comercial" → "Emplazamiento"
2. Seleccionar "Modo Intake (Asistido)"
3. Completar SOLO los campos permitidos:
   - Número de acto
   - Fecha de actuación
   - Datos del alguacil
   - Datos del requeriente y emplazado
   - Tribunal y objeto de la demanda (breve)
4. **NO completar:** Hechos, Fundamentos de Derecho, Tesis
5. Generar el acto
6. **Verificar:**
   - El documento tiene máximo 2 páginas
   - NO contiene secciones de "Relato Fáctico" ni "Fundamentos de Derecho"
   - Contiene solo: Encabezado → Traslado → Citación → Advertencia → Cierre

**Resultado Esperado:** ✅ Emplazamiento correcto (notificación pura)

### 6.2 Prueba de Querella Penal

**Objetivo:** Verificar que la querella generada sea un escrito de depósito, no un acto de alguacil.

**Procedimiento:**
1. Navegar a "Actos Judiciales" → "Penal" → "Querella Penal con Constitución en Actor Civil"
2. Seleccionar "Modo Intake (Asistido)"
3. Completar los campos:
   - Jurisdicción (Fiscalía o Juzgado)
   - Datos del querellante e imputado
   - Infracción penal
   - Relato de hechos, calificación jurídica, pruebas
   - Daños materiales y morales
   - Petitorio penal y civil
4. **NO completar:** Alguacil, Traslado, Proceso Verbal
5. Generar el acto
6. **Verificar:**
   - El documento NO contiene referencias a alguacil
   - Usa terminología penal (Querellante, Imputado, Infracción)
   - Contiene: Relato → Calificación → Pruebas → Constitución Actor Civil → Petitorio
   - Incluye montos de indemnización

**Resultado Esperado:** ✅ Querella correcta (escrito de depósito)

### 6.3 Prueba de Validación de Seguridad

**Objetivo:** Verificar que el sistema rechace campos prohibidos.

**Procedimiento:**
1. Intentar generar un emplazamiento incluyendo el campo "Hechos" (si el formulario lo permite)
2. **Resultado Esperado:** El sistema debe mostrar un error:
   ```
   ❌ ERROR CRÍTICO: Un emplazamiento NO debe contener: hechos. 
   Es un acto de notificación pura, no una demanda.
   ```

---

## Paso 7: Documentación de Cambios

### 7.1 Actualizar el README del Proyecto

**Agregar sección:**

```markdown
## Correcciones Implementadas (Fase 1)

### Emplazamiento
- ✅ Ahora se genera como acto de notificación pura
- ✅ NO incluye relato fáctico ni fundamentos de derecho
- ✅ Validación automática de campos prohibidos

### Querella Penal
- ✅ Ahora se genera como escrito de depósito
- ✅ NO incluye designación de alguacil ni proceso verbal
- ✅ Usa terminología penal correcta (Querellante, Imputado)
```

### 7.2 Crear Changelog

**Archivo:** `CHANGELOG.md`

```markdown
# Changelog

## [Versión 2.0] - 2025-10-15

### Correcciones Críticas
- Corregida la lógica procesal del Emplazamiento (ahora es notificación pura)
- Corregida la naturaleza de la Querella Penal (ahora es escrito de depósito)
- Agregadas validaciones de seguridad para campos prohibidos

### Nuevas Plantillas
- EMPLAZAMIENTO_TEMPLATE (21 campos)
- QUERELLA_PENAL_TEMPLATE (26 campos)
- INVENTARIO_TEMPLATE (5 campos)

### Base de Datos
- Pobladas tablas act_types y act_fields con 3 actos críticos
- Total de campos insertados: 52
```

---

## Checklist de Implementación

- [ ] Ejecutar script SQL `migracion_act_types.sql`
- [ ] Verificar que los 3 actos se insertaron en la base de datos
- [ ] Copiar archivos de plantillas a `src/lib/templates/`
- [ ] Actualizar `legalActsTemplates.ts` con las nuevas plantillas
- [ ] Actualizar `IntakeFormFlow.tsx` con validaciones de seguridad
- [ ] Actualizar Edge function `generate-legal-doc` con mandatos
- [ ] Verificar que los actos estén en `legalActsData.ts`
- [ ] Ejecutar prueba de Emplazamiento
- [ ] Ejecutar prueba de Querella Penal
- [ ] Ejecutar prueba de validación de seguridad
- [ ] Actualizar README y crear CHANGELOG
- [ ] Commit y push de cambios

---

## Próximos Pasos (Fase 2)

Una vez completada la Fase 1, proceder con la **Fase 2: Población de Base de Datos** para migrar los 100 actos restantes del catálogo hardcodeado a la base de datos.

---

**Fin de la Guía de Implementación - Fase 1**
