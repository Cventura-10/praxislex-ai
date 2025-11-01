# 🎯 Checklist de Pruebas - Sistema DOCX

## ✅ Pre-requisitos

- [ ] Bucket `templates` creado en Storage
- [ ] Archivo `contrato_alquiler.docx` subido con placeholders correctos
- [ ] Edge function `generate-legal-doc` desplegada
- [ ] Al menos 2 clientes de prueba en la BD
- [ ] Al menos 1 notario en la BD

## 📋 Prueba 1: Formulario Universal

### Navegación
- [ ] Ir a `/generador-actos`
- [ ] Buscar "Contrato de Alquiler"
- [ ] Click en el acto → Modal aparece
- [ ] Seleccionar "Redacción Asistida"
- [ ] Redirige a `/redaccion-ia-new?acto=...&mode=intake`

### Validación de Roles Dinámicos
- [ ] Se muestran exactamente 2 secciones de partes:
  - "VENDEDOR(ES)" o "ARRENDADOR(ES)"
  - "COMPRADOR(ES)" o "ARRENDATARIO(S)"
- [ ] Botón "+ Agregar" funciona
- [ ] Se muestra sección "Notario Público*"
- [ ] NO se muestra "Abogados Contrarios"

## 📋 Prueba 2: Hidratación de Datos

### Primera Parte
- [ ] Click "+ Agregar" en primera sección
- [ ] Card se expande
- [ ] Seleccionar cliente del dropdown
- [ ] Campos se llenan automáticamente:
  - nombre_completo ✓
  - cedula_rnc ✓
  - nacionalidad ✓
  - estado_civil ✓
  - profesion ✓
  - direccion ✓

### Cascada Geográfica
- [ ] Seleccionar provincia → Municipio se resetea
- [ ] Seleccionar municipio → Sector se habilita
- [ ] Cambiar provincia → Municipio y sector se limpian

### Notario
- [ ] Seleccionar notario del dropdown
- [ ] Campos readonly se llenan:
  - nombre_completo ✓
  - exequatur ✓
  - oficina ✓
  - jurisdiccion ✓

## 📋 Prueba 3: Datos del Contrato

- [ ] Campo "Descripción del Inmueble" visible
- [ ] Campo "Uso del Inmueble" con placeholder "Residencial"
- [ ] Campo "Canon Mensual (RD$)" acepta números
- [ ] Campo "Plazo (meses)" acepta números

### Valores de Prueba
```
Descripción: Casa de dos niveles ubicada en Calle Principal #123, Los Jardines
Uso: Residencial
Canon: 15000.00
Plazo: 12
```

## 📋 Prueba 4: Guardar y Numerar

- [ ] Click "Guardar y Asignar Número"
- [ ] Toast de éxito aparece
- [ ] Campo "Número del Acto" se llena: `ACT-2025-001`
- [ ] Botón "Descargar DOCX" se habilita

## 📋 Prueba 5: Generación DOCX

- [ ] Click "Descargar DOCX"
- [ ] Descarga inicia automáticamente
- [ ] Archivo: `contrato_alquiler_ACT-2025-001.docx`
- [ ] Tamaño razonable (> 5KB)

### Abrir el DOCX
- [ ] Documento se abre sin errores
- [ ] NO hay texto `[POR COMPLETAR]`
- [ ] NO hay corchetes `{{VARIABLE}}`

### Verificar Contenido
- [ ] Número de acto: ACT-2025-001 ✓
- [ ] Ciudad y fecha en español: "Santo Domingo, 15 de enero de 2025" ✓
- [ ] Primera parte:
  - Nombre completo ✓
  - Cédula ✓
  - Nacionalidad ✓
  - Estado civil ✓
  - Profesión ✓
  - Domicilio completo con niveles geográficos ✓
  - Etiqueta correcta: "EL PROPIETARIO" o "LA PROPIETARIA" ✓
- [ ] Segunda parte (mismos campos) ✓
- [ ] Notario:
  - Nombre completo ✓
  - Exequátur ✓
  - Oficina ✓
  - Jurisdicción ✓
- [ ] Contrato:
  - Descripción del inmueble ✓
  - Uso en mayúsculas: "RESIDENCIAL" ✓
  - Canon numérico: 15000.00 ✓
  - Canon en letras: "quince mil pesos" ✓
  - Plazo numérico: 12 ✓
  - Plazo en letras: "doce meses" ✓

## 📋 Prueba 6: Casos Edge

### Sin Notario
- [ ] Vaciar campo de notario
- [ ] Click "Guardar"
- [ ] Toast de error: "Debe seleccionar un notario"

### Sin Partes
- [ ] No agregar ninguna parte
- [ ] Click "Guardar"
- [ ] Toast de error: "Faltan partes: ..."

### Monto con Decimales
```
Canon: 15250.75
```
- [ ] Guardar y generar DOCX
- [ ] Verificar: "quince mil doscientos cincuenta pesos con 75 centavos"

### Persona Jurídica
- [ ] En segunda parte, crear cliente con:
  - tipo_persona: "juridica"
  - razon_social: "INMOBILIARIA XYZ, SRL"
- [ ] Generar DOCX
- [ ] Verificar etiqueta: "EL INQUILINO" (sin género)
- [ ] Nombre: "INMOBILIARIA XYZ, SRL"

### Género Femenino
- [ ] Crear cliente con:
  - tipo_persona: "fisica"
  - genero: "f"
  - nombre: "María López"
- [ ] Usar como primera parte
- [ ] Generar DOCX
- [ ] Verificar etiqueta: "LA PROPIETARIA"

## 📋 Prueba 7: Edge Function Logs

- [ ] Ir a Supabase → Edge Functions → `generate-legal-doc` → Logs
- [ ] Verificar logs recientes:
  - "🚀 Iniciando generación de documento DOCX"
  - "📦 Payload recibido"
  - "📥 Descargando plantilla"
  - "✅ Plantilla descargada: XXXX bytes"
  - "🔄 Datos normalizados"
  - "⚙️ Procesando plantilla"
  - "✅ Documento generado: XXXX bytes"
  - "📄 Enviando archivo"

### Si hay errores
- [ ] Revisar stack trace
- [ ] Verificar qué campo falta
- [ ] Corregir formulario o plantilla

## 📋 Prueba 8: Múltiples Documentos

- [ ] Generar 3 documentos consecutivos
- [ ] Verificar numeración secuencial:
  - ACT-2025-001
  - ACT-2025-002
  - ACT-2025-003

## ✅ Criterios de Éxito

- [ ] **100%** de placeholders sustituidos
- [ ] **0** errores de TypeScript
- [ ] **0** corchetes en documento final
- [ ] Numeración automática funciona
- [ ] Descarga instantánea (< 3 segundos)
- [ ] Montos en letras correctos
- [ ] Etiquetas de género apropiadas
- [ ] Domicilios con todos los niveles geográficos

## 🐛 Problemas Comunes

### Descarga no inicia
**Causa:** Edge function no retorna blob correcto
**Solución:** Revisar logs, verificar que retorna arraybuffer

### Placeholders sin sustituir
**Causa:** Nombre de variable no coincide
**Solución:** Revisar plantilla DOCX, usar EXACTAMENTE `{{VARIABLE}}`

### "Falta dato requerido: contrato.canon_monto"
**Causa:** Campo vacío en formulario
**Solución:** Llenar todos los campos marcados con *

---

**Estado:** 🟢 LISTO PARA PRODUCCIÓN
**Fecha:** 2025-01-15
