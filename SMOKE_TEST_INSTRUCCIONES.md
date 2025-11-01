# 🧪 SMOKE TEST COMPLETADO - Instrucciones Finales

## ✅ Sistema Listo para Probar

He creado una **página de prueba dedicada** para que puedas hacer el smoke test de 6 pasos de forma visual e interactiva.

---

## 🚀 Cómo Acceder

### Opción 1: URL Directa
```
https://tu-dominio.lovableproject.com/test-hydration
```

### Opción 2: Desde el navegador
1. Iniciar sesión en PraxisLex
2. En la barra de direcciones, agregar `/test-hydration` después del dominio
3. Presionar Enter

---

## 📋 Qué Hace la Página de Prueba

La página `/test-hydration` es un **formulario de ejemplo completo** que implementa:

✅ **ClientSelector** con hidratación automática (primera y segunda parte)  
✅ **NotarioSelector** con hidratación automática  
✅ **ContraparteManager** para gestionar demandados/contrapartes con autocompletado  
✅ **AbogadoContrarioManager** para datos de abogados de la contraparte  
✅ **LocationSelect** con cascadas geográficas  
✅ **Validaciones** fail-fast  
✅ **Numeración automática** ACT-YYYY-###  
✅ **Badges visuales** que confirman cada paso completado

---

## 🎯 Los 6 Pasos del Smoke Test

### ✅ PASO 1: Primera Parte (Arrendador)
**Acción:**
1. En la sección "Primera Parte", haz clic en el selector de clientes
2. Busca un cliente por cédula O selecciona de la lista
3. Observa el autocompletado

**Validación Visual:**
- Badge verde "Paso 1 Completo" aparece
- Badge "Autocompletado" en el selector
- Toast de confirmación
- Todos los campos se llenan:
  - Nombre completo
  - Cédula/RNC
  - Nacionalidad
  - Estado civil
  - Profesión
  - Dirección

---

### ✅ PASO 2: Segunda Parte (Arrendatario)
**Acción:**
1. En la sección "Segunda Parte", selecciona **otro** cliente diferente
2. Observa que se autocompleta independientemente

**Validación Visual:**
- Badge verde "Paso 2 Completo"
- Datos del segundo cliente (no mezclados con el primero)

---

### ✅ NUEVO: Contrapartes / Demandados
**Acción:**
1. Haz clic en "Agregar contraparte"
2. Selecciona un cliente en el selector
3. Observa el autocompletado de todos los campos
4. Cambia la provincia y verifica la cascada geográfica

**Validación Visual:**
- Card expandible para cada contraparte
- Badge "Autocompletado" al seleccionar cliente
- Campos de nombre, cédula, dirección, etc. completados
- Cascada geográfica independiente funcionando

---

### ✅ NUEVO: Abogados de la Contraparte
**Acción:**
1. Haz clic en "Agregar abogado" (opcional)
2. Completa manualmente: nombre, cédula, matrícula CARD
3. Agrega email, teléfono, dirección
4. Selecciona ubicación del bufete

**Validación Visual:**
- Card expandible para cada abogado
- Validaciones en tiempo real (email válido, campos max length)
- LocationSelect integrado para ubicación del bufete

---

### ✅ PASO 3: Notario Público
**Acción:**
1. En la sección "Notario", busca por nombre/exequátur O selecciona de lista
2. Observa el autocompletado

**Validación Visual:**
- Badge verde "Paso 3 Completo"
- Campos autocompletados:
  - Nombre completo
  - Exequátur
  - Cédula (formato máscara: ***-####)
  - Jurisdicción (formato: "Municipio / Provincia")
  - Oficina
  - Teléfono
  - Email

---

### ✅ PASO 4: Cascadas Geográficas
**Acción:**
1. Ve a cualquier sección (Primera o Segunda Parte)
2. **Cambia manualmente la Provincia** en el selector
3. Observa lo que pasa con Municipio y Sector

**Validación Visual:**
- Toast info: "Cascada activada - Municipio y sector reseteados"
- Campos de Municipio y Sector se limpian
- Selector de Municipio se habilita con opciones filtradas
- Selector de Sector se deshabilita hasta seleccionar municipio

**Prueba adicional:**
- Selecciona provincia
- Selecciona municipio → Sector se habilita
- Cambia provincia de nuevo → Todo se resetea

---

### ✅ PASO 5: Guardar y Ver Numeración
**Acción:**
1. Completa los campos requeridos:
   - Número de folios: **1** o más
   - Monto del canon: **> 0** (ej: 15000.00)
   - Plazo en meses: **1** o más
2. Haz clic en **"PASO 5: Guardar Acto (Auto-numerar)"**
3. Observa el resultado

**Validación Visual:**
- Card verde de éxito aparece: "✅ PASO 5 COMPLETO"
- Mensaje muestra el número generado: "Acto guardado con número ACT-2025-XXX"
- Campo "Número de Acto" se llena automáticamente
- Toast de éxito con duración de 5 segundos

**Verificación en DB (opcional):**
Si tienes acceso a Supabase:
```sql
SELECT numero_acto, titulo, created_at 
FROM generated_acts 
WHERE tipo_acto = 'contrato'
ORDER BY created_at DESC 
LIMIT 5;
```

Deberías ver números secuenciales:
- ACT-2025-001
- ACT-2025-002
- ACT-2025-003
- ...

---

### ✅ PASO 6: Descargar DOCX
**Estado Actual:**
- El botón "PASO 6: Descargar DOCX" está visible pero **simulado**
- La implementación real requiere la edge function `generate-legal-doc`

**Para implementar (próximo paso):**
1. La edge function debe recibir los datos del formulario
2. Generar DOCX usando biblioteca `docx`
3. Devolver binario con headers correctos:
   ```typescript
   return new Response(docxBuffer, {
     headers: {
       'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'Content-Disposition': `attachment; filename="contrato_${numero_acto}.docx"`
     }
   });
   ```

**Validación (cuando esté implementado):**
- Archivo descargado con extensión .docx
- Se abre en Microsoft Word sin errores
- Formato A4 con márgenes correctos
- Fuente Times New Roman 12pt
- Todos los placeholders reemplazados con datos reales

---

## 🎨 Características Visuales de la Página

### Badges de Progreso
- **Verde con ✓**: Paso completado correctamente
- **Outline**: Paso pendiente

### Cards con Colores
- **Azul (primario)**: Secciones activas
- **Verde**: Éxito confirmado
- **Gris (muted)**: Campos readonly autocompletados

### Toasts de Confirmación
- **Éxito**: Cliente/Notario cargado
- **Info**: Cascada activada
- **Error**: Validación fallida

---

## 🔍 Debugging en la Página

### Console Logs
La página imprime información útil en la consola:
```javascript
// Al guardar acto
console.log("📄 Datos para generación:", {
  numero_acto: "ACT-2025-XXX",
  primera_parte: { ... },
  segunda_parte: { ... },
  notario: { ... },
  contrato: { ... }
});
```

### Ver Estado del Formulario
Abre DevTools Console y ejecuta:
```javascript
// Ver todos los valores del formulario
console.log(form.watch());
```

---

## ⚠️ Solución de Problemas

### Problema: "Falta Primera Parte"
**Causa:** No se seleccionó cliente  
**Solución:** Hacer clic en ClientSelector y seleccionar un cliente

### Problema: "Número de folios debe ser ≥ 1"
**Causa:** Campo vacío o valor 0  
**Solución:** Ingresar número mayor o igual a 1

### Problema: "Monto del canon debe ser > 0"
**Causa:** Campo vacío o valor 0  
**Solución:** Ingresar monto positivo (ej: 15000.00)

### Problema: No aparece badge "Autocompletado"
**Causa:** El cliente no tiene datos completos en DB  
**Solución:** Editar cliente y completar todos los campos (nacionalidad, estado civil, etc.)

### Problema: Cascada no resetea
**Causa:** JavaScript deshabilitado o error en consola  
**Solución:** Revisar console para errores y recargar página

---

## 📊 Checklist de Validación

Marca ✅ cuando completes cada validación:

```
Pre-requisitos:
□ Sesión iniciada en PraxisLex
□ Al menos 2 clientes con datos completos
□ Al menos 1 notario registrado
□ Navegado a /test-hydration

Validaciones Visuales:
□ PASO 1: Badge "Paso 1 Completo" verde ✅
□ PASO 1: Badge "Autocompletado" en selector ✅
□ PASO 1: Todos los campos llenos (nombre, cédula, etc.) ✅

□ PASO 2: Badge "Paso 2 Completo" verde ✅
□ PASO 2: Datos independientes de primera parte ✅

□ NUEVO: Contraparte agregada y autocompletada ✅
□ NUEVO: Cascada geográfica en contraparte funciona ✅
□ NUEVO: Abogado contrario agregado (opcional) ✅

□ PASO 3: Badge "Paso 3 Completo" verde ✅
□ PASO 3: Jurisdicción en formato "Municipio / Provincia" ✅
□ PASO 3: Cédula enmascarada ***-#### ✅

□ PASO 4: Toast "Cascada activada" al cambiar provincia ✅
□ PASO 4: Municipio y sector reseteados ✅
□ PASO 4: Selector de municipio filtrado por provincia ✅

□ PASO 5: Card verde de éxito visible ✅
□ PASO 5: Número generado formato ACT-2025-### ✅
□ PASO 5: Campo "Número de Acto" autocompletado ✅

□ PASO 6: Botón "Descargar DOCX" visible ✅
□ PASO 6: (Implementación pendiente en edge function)

Validaciones Técnicas:
□ No hay errores en consola (F12)
□ Network requests exitosas (status 200)
□ Datos persistieron en generated_acts
□ Secuencia numérica correcta (001, 002, 003...)
```

---

## 🎉 Si TODOS los Pasos Pasan

**¡FELICIDADES!** 🎊

El sistema de hidratación automática está **100% funcional**:
- ✅ Autollenado completo de clientes (Primera y Segunda Parte)
- ✅ Autollenado de contrapartes/demandados con ClientSelector
- ✅ Gestión de abogados contrarios con validaciones
- ✅ Autollenado de notarios con jurisdicción
- ✅ Cascadas geográficas robustas (Primera, Segunda Parte, Contrapartes, Abogados)
- ✅ Numeración automática confiable
- ✅ Validaciones fail-fast efectivas
- ✅ (Pendiente) Generación DOCX real

---

## 📚 Documentación Adicional

- `EJEMPLO_USO_HIDRATACION.md` - Guía de uso del sistema
- `INTEGRACION_COMPLETA.md` - Documentación técnica completa
- `SMOKE_TEST_CHECKLIST.md` - Checklist detallado de pruebas
- `src/pages/TestHydration.tsx` - Código fuente de la página de prueba
- `src/lib/formHydrate.ts` - Helper centralizado de hidratación

---

## 🚀 Próximos Pasos

1. **Completar PASO 6**: Implementar edge function para generación DOCX
2. **Migrar formularios legacy**: Actualizar BundleIntakeForm e IntakeFormFlow
3. **Testing en producción**: Probar con datos reales de clientes
4. **Optimizaciones**: Cache, prefetch, autoguardado

---

## 💡 Nota Final

Esta página de prueba (`/test-hydration`) es un **ejemplo funcional completo** del sistema de hidratación. Puedes usarla como **referencia** para implementar el mismo patrón en otros formularios del sistema.

**El código es reutilizable** - solo necesitas:
1. Importar los componentes (ClientSelector, NotarioSelector, LocationSelect)
2. Pasar prop `form` de react-hook-form
3. Configurar cascadas con `resetGeoCascade`
4. Validar antes de generar

¡Todo lo demás es automático! 🚀
