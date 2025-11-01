# 🧪 SMOKE TEST V2 - "A Prueba de Terquedad"

## 🚀 Acceso Rápido

### URL de la Nueva Página:
```
https://tu-dominio.lovableproject.com/test-hydration-v2
```

O en desarrollo local:
```
http://localhost:8080/test-hydration-v2
```

---

## ✅ Qué Hace Esta Versión

Esta es una versión **"a prueba de terquedad"** que GARANTIZA:

1. **Contrapartes y Abogados SIEMPRE visibles** - No importa la materia o tipo de acto
2. **useFieldArray de react-hook-form** - Control total del estado
3. **Hidratación unificada** - Una sola "source of truth" para todos los datos
4. **Cascadas geográficas robustas** - Reseteo duro que funciona SIEMPRE
5. **Visor Debug integrado** - Ve el estado completo del formulario en tiempo real
6. **Numeración automática** - ACT-YYYY-### al guardar

---

## 📋 Características Principales

### ✨ Siempre Montados
- ✅ **Contraparte** - Array vacío por defecto, botón "Agregar" siempre visible
- ✅ **Abogados Contrarios** - Array vacío por defecto, botón "Agregar" siempre visible
- ✅ No depende de condiciones de materia/naturaleza/tipo de acto

### 🔄 Hidratación Automática
- ✅ `hydrateClient()` - Para Primera Parte, Segunda Parte, Contrapartes
- ✅ `hydrateNotario()` - Para Notario Público
- ✅ `hydrateLawyer()` - Para Abogados Contrarios (futuro)
- ✅ Source of truth único en `src/lib/formHydrate.ts`

### 🌍 Cascadas Geográficas
- ✅ Reseteo duro con `resetGeoCascade()`
- ✅ Funciona en Primera Parte, Segunda Parte, Contrapartes, Abogados
- ✅ Toasts informativos al activarse
- ✅ Independientes entre sí

### 🐛 Debug Viewer
- ✅ Botón toggle en el header
- ✅ Muestra JSON completo del formState
- ✅ Scroll vertical para datos largos
- ✅ Fondo oscuro para mejor lectura

---

## 🎯 Instrucciones de Prueba (Mini-Checklist)

### 1️⃣ Accede a la Página
```
/test-hydration-v2
```

Si no se carga, haz un **hard reload**:
- **Windows/Linux**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R
- **O agrega query param**: `/test-hydration-v2?v=2`

---

### 2️⃣ Agrega Contrapartes

**Acción:**
1. Scroll hasta la sección "Contrapartes / Demandados"
2. Haz clic en el botón **"+ Agregar"**
3. Selecciona un cliente en el ComboBox que aparece
4. Observa el autocompletado

**Validación:**
- ✅ Card con borde punteado aparece
- ✅ ClientSelector funciona
- ✅ Al seleccionar cliente, se llenan todos los campos
- ✅ LocationSelect aparece con cascadas funcionales

**Prueba Cascada:**
- Cambia la Provincia → Municipio y Sector se resetean
- Toast "Cascada activada - Contraparte #1" aparece

**Agrega Múltiples:**
- Haz clic en "+ Agregar" de nuevo
- Agrega 2-3 contrapartes para probar
- Cada una debe tener su propia cascada independiente

---

### 3️⃣ Agrega Abogados Contrarios

**Acción:**
1. Scroll hasta "Abogados de la Contraparte"
2. Haz clic en **"+ Agregar"**
3. Completa manualmente:
   - Nombre completo (requerido)
   - Cédula, Matrícula CARD, Teléfono, Email
4. Selecciona ubicación del bufete

**Validación:**
- ✅ Card con borde punteado aparece
- ✅ Formulario manual con campos de texto
- ✅ LocationSelect funciona
- ✅ Cascada geográfica independiente

---

### 4️⃣ Completa Primera y Segunda Parte

**Primera Parte (Arrendador):**
- Selecciona un cliente
- Badge "Completo" aparece
- LocationSelect funcional
- Cambia provincia → Cascada se activa

**Segunda Parte (Arrendatario):**
- Selecciona **otro** cliente diferente
- Badge "Completo" aparece
- Datos independientes de Primera Parte

---

### 5️⃣ Selecciona Notario

**Acción:**
- Usa el NotarioSelector
- Selecciona un notario de la lista
- Observa autocompletado

**Validación:**
- ✅ Badge "Completo" aparece
- ✅ Campos de notario se llenan automáticamente
- ✅ Jurisdicción en formato "Municipio / Provincia"

---

### 6️⃣ Completa Datos del Contrato

**Campos Requeridos:**
- **Folios**: ≥ 1 (ej: 1)
- **Canon Mensual (RD$)**: > 0 (ej: 15000.00)
- **Plazo (meses)**: ≥ 1 (ej: 12)

---

### 7️⃣ Activa el Debug Viewer

**Acción:**
- Haz clic en el botón **"Ver Debug"** en el header
- Observa el JSON completo

**Validación:**
- ✅ Panel negro con JSON aparece
- ✅ Estructura completa visible:
  ```json
  {
    "numero_acto": null,
    "numero_folios": 1,
    "ciudad": "Santo Domingo",
    "primera_parte": { ... },
    "segunda_parte": { ... },
    "contraparte": [
      { "cliente_id": "...", "nombre_completo": "...", ... },
      { "cliente_id": "...", ... }
    ],
    "abogados_contrarios": [
      { "nombre_completo": "...", "cedula_rnc": "...", ... }
    ],
    "notario": { ... },
    "contrato": {
      "canon_monto": 15000,
      "plazo_meses": 12
    }
  }
  ```

**Verifica:**
- ✅ Arrays `contraparte` y `abogados_contrarios` tienen elementos
- ✅ Cada elemento tiene todos los campos esperados
- ✅ Campos geográficos (`provincia_id`, `municipio_id`, `sector_id`) tienen valores

---

### 8️⃣ Guarda el Acto (Numeración Automática)

**Acción:**
- Scroll al final de la página
- Haz clic en **"Guardar (asigna ACT-YYYY-###)"**

**Validación:**
- ✅ Toast de éxito aparece
- ✅ Mensaje muestra: "Número asignado: ACT-2025-001" (o siguiente secuencial)
- ✅ Campo "Número del Acto (Auto)" se llena con el número generado

**En la consola del navegador (F12):**
```javascript
📄 Guardando acto con: {
  contrapartes_count: 2,
  abogados_count: 1
}
```

---

### 9️⃣ Verifica en Base de Datos (Opcional)

Si tienes acceso a Supabase:

```sql
-- Ver actos generados recientemente
SELECT 
  numero_acto, 
  titulo, 
  tipo_acto,
  LENGTH(contenido) as contenido_size,
  created_at
FROM generated_acts
ORDER BY created_at DESC
LIMIT 5;

-- Ver el contenido completo del último acto
SELECT contenido::json
FROM generated_acts
ORDER BY created_at DESC
LIMIT 1;
```

**Validación:**
- ✅ Registro existe en `generated_acts`
- ✅ Campo `numero_acto` tiene formato ACT-YYYY-###
- ✅ Campo `contenido` es un JSON con:
  - `contrapartes`: array con 2 elementos
  - `abogados_contrarios`: array con 1 elemento
  - `primera_parte`, `segunda_parte`, `notario`, `contrato`: objetos completos

---

## 🐛 Solución de Problemas

### Problema: No veo la página
**Solución:**
1. Hard reload: Ctrl/Cmd + Shift + R
2. O agrega query param: `?v=2`
3. Verifica que estés en `/test-hydration-v2` (con **-v2**)

### Problema: Botón "Agregar" no hace nada
**Solución:**
- Abre consola (F12) y busca errores
- Verifica que `useFieldArray` esté funcionando
- Intenta recargar la página

### Problema: Cascada no resetea
**Solución:**
- Verifica que el toast "Cascada activada" aparezca
- Si no aparece, hay un error en el `useEffect`
- Revisa consola para errores

### Problema: Al guardar, error "Falta..."
**Solución:**
- Verifica que TODOS los campos requeridos estén completos:
  - Primera Parte (cliente seleccionado)
  - Segunda Parte (cliente seleccionado)
  - Notario (seleccionado)
  - Folios ≥ 1
  - Canon > 0
  - Plazo ≥ 1

### Problema: numero_acto es null después de guardar
**Solución:**
- Verifica que el trigger `trg_assign_numero_acto` existe en la tabla `generated_acts`
- Si no existe, necesitas crear la migración para el trigger

---

## 📊 Checklist de Validación Final

```
Pre-requisitos:
□ Sesión iniciada
□ Navegado a /test-hydration-v2
□ Hard reload realizado (Ctrl+Shift+R)

Contrapartes:
□ Sección "Contrapartes / Demandados" visible SIEMPRE
□ Botón "+ Agregar" funciona
□ Al agregar, card con ClientSelector aparece
□ Al seleccionar cliente, autocompletado funciona
□ LocationSelect aparece y funciona
□ Cascada geográfica funciona (provincia → resetea municipio/sector)
□ Puedo agregar múltiples contrapartes (2+)
□ Botón "Quitar" elimina la contraparte

Abogados Contrarios:
□ Sección "Abogados de la Contraparte" visible SIEMPRE
□ Botón "+ Agregar" funciona
□ Formulario manual aparece
□ Puedo escribir nombre, cédula, matrícula, etc.
□ LocationSelect funciona
□ Cascada geográfica funciona
□ Puedo agregar múltiples abogados
□ Botón "Quitar" elimina el abogado

Primera y Segunda Parte:
□ ClientSelector funciona
□ Autocompletado funciona
□ Badge "Completo" aparece al seleccionar
□ LocationSelect funciona
□ Cascadas independientes

Notario:
□ NotarioSelector funciona
□ Autocompletado funciona
□ Badge "Completo" aparece

Contrato:
□ Puedo ingresar Canon, Plazo, Folios
□ Validaciones funcionan (no permite ≤ 0)

Debug Viewer:
□ Botón "Ver Debug" funciona
□ Panel JSON aparece al hacer clic
□ JSON muestra estructura completa:
  - Arrays contraparte y abogados_contrarios con elementos
  - Todos los campos esperados presentes

Guardar:
□ Botón "Guardar" funciona
□ Toast de éxito aparece
□ Número ACT-YYYY-### se asigna
□ Campo "Número del Acto" se llena
□ Console log muestra counts correctos
□ En DB: registro existe con contenido JSON completo

Descarga DOCX:
□ Botón visible (simulado por ahora)
```

---

## 🎉 Si TODO Pasa

**¡FELICIDADES!** 🚀

El sistema está **100% funcional** con:
- ✅ Contrapartes SIEMPRE montadas
- ✅ Abogados Contrarios SIEMPRE montados
- ✅ Hidratación automática completa
- ✅ Cascadas geográficas robustas
- ✅ Numeración automática confiable
- ✅ Debug viewer para troubleshooting
- ✅ Estado persistido correctamente en DB

---

## 📝 Diferencias con test-hydration (v1)

| Característica | v1 (/test-hydration) | v2 (/test-hydration-v2) |
|----------------|---------------------|-------------------------|
| Contrapartes | `useState` manual | `useFieldArray` |
| Abogados | `useState` manual | `useFieldArray` |
| Montaje | Condicional | **SIEMPRE** |
| Hidratación | Callbacks `onFieldUpdate` | **Funciones directas** |
| Cascadas | Mixto | **resetGeoCascade()** unificado |
| Debug | No tiene | **Visor integrado** |
| Estado Form | Mixto (form + state) | **100% react-hook-form** |

---

## 🚀 Próximos Pasos

1. **Validar en producción** con datos reales
2. **Implementar edge function DOCX** real (no simulada)
3. **Migrar otros formularios** al mismo patrón
4. **Testing automatizado** de flujos completos
5. **Optimizaciones**: cache, prefetch, autoguardado

---

## 💡 Notas Técnicas

### Hidratación Unificada
- **Source of truth**: `src/lib/formHydrate.ts`
- **Funciones**: `hydrateClient()`, `hydrateNotario()`, `hydrateLawyer()`
- **Ventaja**: Un solo lugar para actualizar lógica de hidratación

### useFieldArray vs useState
- **Antes (v1)**: `useState<ContraparteData[]>`
- **Ahora (v2)**: `useFieldArray({ name: 'contraparte' })`
- **Ventaja**: Integración nativa con react-hook-form, mejor control

### Cascadas Robustas
- **Implementación**: `resetField()` en lugar de `setValue(null)`
- **Ventaja**: Limpia estado de validación también
- **Activación**: `watch()` con listener en `useEffect`

---

## 📚 Archivos Importantes

- ✅ `src/pages/TestHydrationV2.tsx` - Página de prueba v2
- ✅ `src/lib/formHydrate.ts` - Helpers de hidratación actualizados
- ✅ `src/App.tsx` - Ruta agregada: `/test-hydration-v2`
- ✅ `SMOKE_TEST_V2_INSTRUCCIONES.md` - Este archivo

---

¡Sistema listo para smoke test completo! 🎊
