# 🧪 SMOKE TEST - 6 PASOS (Checklist Manual)

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de:
- ✅ Estar autenticado en PraxisLex
- ✅ Tener al menos 2 clientes registrados con datos completos
- ✅ Tener al menos 1 notario registrado
- ✅ Navegar a un formulario que use los componentes actualizados

---

## ⚠️ IMPORTANTE: Componentes Actualizados vs Legacy

### ✅ Componentes que YA tienen hidratación automática:
- `IntakeFormWithHydration.tsx` (ejemplo completo)
- Cualquier formulario que use `ClientSelector` con prop `form`
- Cualquier formulario que use `NotarioSelector` con prop `form`

### ⏳ Componentes que AÚN NO tienen hidratación (legacy):
- `AILegalDrafting.tsx` (usa schemas custom, no ClientSelector)
- `IntakeFormFlow.tsx` (usa campos manuales)
- `BundleIntakeForm.tsx` (necesita migración a react-hook-form)

**Para probar el sistema de hidratación, necesitas:**
1. Crear un nuevo formulario basado en `IntakeFormWithHydration.tsx`, O
2. Navegar a `/test-hydration` (si creamos una ruta de prueba)

---

## 🎯 OPCIÓN 1: Crear Ruta de Prueba

Voy a crear una página de prueba accesible en `/test-hydration` para que puedas hacer el smoke test completo.

---

## 📝 PASO A PASO DEL SMOKE TEST

### PASO 1: Seleccionar Primera Parte (Cliente)
**Qué hacer:**
1. Ir a la sección "Primera Parte"
2. Hacer clic en el selector de clientes
3. Buscar un cliente por cédula O seleccionar de la lista
4. Observar que se autocompletan todos los campos

**Resultado esperado:**
- ✅ Badge "Autocompletado" aparece
- ✅ Toast de confirmación: "Cliente cargado - Datos autocompletados"
- ✅ Campos autocompletados (readonly):
  - Nombre completo
  - Cédula/RNC
  - Nacionalidad
  - Estado civil
  - Profesión
  - Provincia (ID)
  - Municipio (ID)
  - Sector (ID)
  - Dirección
  - Email
  - Teléfono

**Validación:**
```
✓ ¿Aparece el badge "Autocompletado"?
✓ ¿Se muestran todos los datos del cliente?
✓ ¿Los campos de domicilio (provincia/municipio/sector) tienen valores numéricos?
```

---

### PASO 2: Seleccionar Segunda Parte (Cliente)
**Qué hacer:**
1. Ir a la sección "Segunda Parte"
2. Repetir el proceso de selección de cliente
3. Observar autocompletado

**Resultado esperado:**
- ✅ Mismo comportamiento que Paso 1
- ✅ Datos independientes de Primera Parte

**Validación:**
```
✓ ¿Se autocompletó correctamente?
✓ ¿Los datos son del cliente seleccionado (no mezclados con primera parte)?
```

---

### PASO 3: Seleccionar Notario
**Qué hacer:**
1. Ir a la sección "Notario Público"
2. Buscar notario por nombre/exequátur O seleccionar de lista
3. Observar autocompletado

**Resultado esperado:**
- ✅ Badge "Autocompletado"
- ✅ Toast: "Notario cargado - Datos autocompletados"
- ✅ Campos autocompletados:
  - Nombre completo
  - Exequátur
  - Cédula (máscara: ***-####)
  - Oficina
  - Jurisdicción (formato: "Municipio / Provincia")
  - Teléfono
  - Email

**Validación:**
```
✓ ¿Aparece el badge "Autocompletado"?
✓ ¿La jurisdicción está en formato "Municipio / Provincia"?
✓ ¿La cédula está enmascarada?
```

---

### PASO 4: Cascada Geográfica (Primera Parte)
**Qué hacer:**
1. Ir a la sección "Primera Parte"
2. Cambiar manualmente la **Provincia** en el selector
3. Observar que Municipio y Sector se resetean

**Resultado esperado:**
- ✅ Al cambiar provincia:
  - Municipio se limpia (vuelve a null)
  - Sector se limpia (vuelve a null)
  - Selector de municipio se habilita
  - Selector de sector se deshabilita

**Validación:**
```
✓ ¿Se resetearon municipio y sector?
✓ ¿El combo de municipio muestra solo los de la provincia seleccionada?
✓ ¿El combo de sector está deshabilitado hasta seleccionar municipio?
```

**Repetir para Segunda Parte:**
```
✓ ¿La cascada funciona independientemente en segunda_parte?
```

---

### PASO 5: Guardar Acto y Ver Numeración
**Qué hacer:**
1. Completar todos los campos requeridos:
   - Primera parte (cliente seleccionado)
   - Segunda parte (cliente seleccionado)
   - Notario (seleccionado)
   - Número de folios (≥ 1)
   - Monto del canon (> 0)
   - Plazo en meses (≥ 1)
2. Hacer clic en "Generar Documento"
3. Observar el número de acto generado

**Resultado esperado:**
- ✅ Inserción exitosa en DB
- ✅ Campo `numero_acto` generado automáticamente
- ✅ Formato: `ACT-2025-###` donde ### es secuencial

**Validación:**
```
✓ ¿El acto se guardó en la base de datos?
✓ ¿El numero_acto tiene formato ACT-YYYY-###?
✓ ¿El número es secuencial (si generas otro, debe ser +1)?
```

**Verificación en DB (opcional):**
```sql
SELECT numero_acto, titulo, created_at 
FROM generated_acts 
ORDER BY created_at DESC 
LIMIT 5;

-- Deberías ver:
-- ACT-2025-005
-- ACT-2025-004
-- ACT-2025-003
-- ...
```

---

### PASO 6: Generar y Descargar DOCX
**Qué hacer:**
1. Después de guardar, hacer clic en "Descargar DOCX"
2. Abrir el archivo descargado en Microsoft Word o LibreOffice

**Resultado esperado:**
- ✅ Descarga un archivo `.docx` (NO `.html` renombrado)
- ✅ Nombre del archivo: `contrato_alquiler_ACT-2025-XXX.docx`
- ✅ Al abrir en Word:
  - Formato A4 con márgenes correctos
  - Fuente Times New Roman 12pt
  - Texto justificado (excepto título centrado)
  - **TODOS** los placeholders reemplazados con datos reales

**Validación del contenido:**
```
✓ ¿El archivo se abre en Word sin errores?
✓ ¿El formato es DOCX nativo (no HTML)?
✓ ¿Los márgenes son: 2.5cm arriba/abajo, 2cm derecha, 3cm izquierda?
✓ ¿La fuente es Times New Roman?
✓ ¿NO quedan placeholders tipo {{nombre}} sin reemplazar?
✓ ¿Los datos del cliente/notario aparecen correctamente?
✓ ¿El número de acto está en el documento?
```

**Verificación de NO HTML:**
```
1. Renombrar archivo.docx a archivo.zip
2. Descomprimir
3. Abrir document.xml
4. NO debe contener tags HTML (<p>, <div>, <span>)
5. Debe contener XML de Word (<w:p>, <w:r>, <w:t>)
```

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: No aparece el badge "Autocompletado"
**Causa:** El formulario no está pasando prop `form` a ClientSelector
**Solución:** Verificar que el componente usa `<ClientSelector form={form} .../>`

### Problema 2: Cascada no funciona
**Causa:** No hay `useEffect` con `resetGeoCascade`
**Solución:** Agregar:
```typescript
useEffect(() => {
  const sub = watch((value, { name }) => {
    if (name === 'primera_parte.provincia_id') {
      resetGeoCascade(form, 'primera_parte');
    }
  });
  return () => sub.unsubscribe();
}, [watch, form]);
```

### Problema 3: numero_acto es null
**Causa:** Trigger no está activo o tabla incorrecta
**Solución:** Verificar que el trigger `trg_assign_numero_acto` existe en la tabla

### Problema 4: DOCX se descarga como HTML
**Causa:** Edge function devuelve HTML en lugar de DOCX
**Solución:** Revisar `generate-legal-doc` y asegurar que usa `Packer.toBlob(doc)`

### Problema 5: Placeholders sin reemplazar
**Causa:** Datos no se están pasando correctamente a la plantilla
**Solución:** Validar que el objeto de datos coincide con los placeholders de la plantilla

---

## 📊 Checklist Final

Marca ✅ cuando completes cada paso sin errores:

```
Preparación:
□ Sistema autenticado
□ Al menos 2 clientes registrados
□ Al menos 1 notario registrado
□ Formulario de prueba disponible

Pruebas:
□ PASO 1: Primera Parte autocompletada ✅
□ PASO 2: Segunda Parte autocompletada ✅
□ PASO 3: Notario autocompletado ✅
□ PASO 4: Cascadas geográficas funcionando ✅
□ PASO 5: Numeración automática ACT-2025-### ✅
□ PASO 6: DOCX real descargado y verificado ✅

Validaciones adicionales:
□ No hay errores en consola
□ Todos los toast se muestran correctamente
□ El formulario se limpia después de generar
□ Los datos persistieron en la base de datos
□ El DOCX tiene formato profesional
```

---

## 🎉 Resultado Esperado

Si **TODOS** los pasos pasan:
- ✅ Sistema de hidratación **100% funcional**
- ✅ Cascadas geográficas **robustas**
- ✅ Numeración automática **confiable**
- ✅ Generación DOCX **real y profesional**

Si algún paso falla:
- ⚠️ Documentar el error específico
- 🔍 Revisar logs de consola y network
- 🐛 Usar debugging tools para identificar el problema
- 🛠️ Aplicar fix y re-test

---

## 🔧 Herramientas de Debugging

### Ver logs en tiempo real:
```javascript
// En DevTools Console
localStorage.setItem('DEBUG', '*');
```

### Verificar datos del formulario:
```javascript
// En Console mientras usas el form
console.log(form.watch());
```

### Verificar queries de DB:
```sql
-- En Supabase SQL Editor
SELECT * FROM act_sequences ORDER BY year DESC;
SELECT numero_acto, titulo FROM generated_acts ORDER BY created_at DESC LIMIT 10;
```

---

## 📝 Notas para el Usuario

**IMPORTANTE:** Este smoke test está diseñado para formularios que **YA** usan los componentes actualizados (`ClientSelector` con prop `form`, `NotarioSelector` con prop `form`).

La página `/redaccion-ia?acto=contrato_alquiler&mode=intake` actualmente usa **AILegalDrafting.tsx** que es un componente legacy que **NO** tiene integrada la hidratación automática.

Para probar el sistema completo, necesitas:
1. Usar `IntakeFormWithHydration.tsx` como base, O
2. Esperar a que migremos los formularios legacy

¿Deseas que cree una página de prueba `/test-hydration` para que puedas hacer el smoke test ahora mismo?
