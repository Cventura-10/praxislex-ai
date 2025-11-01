# 📋 Sistema de Generación de Documentos DOCX - Guía Completa

## ✅ Implementación Completada

### 🎯 Características Principales

1. **Edge Function `generate-legal-doc`**
   - Genera documentos DOCX reales (NO HTML)
   - Usa plantillas .docx con placeholders de docxtemplater
   - Conversión automática de números a letras en español
   - Validación fail-fast de campos requeridos

2. **Formulario Universal Dinámico**
   - Se adapta según el tipo de acto (judicial/extrajudicial)
   - Roles de partes dinámicos (vendedor/comprador, demandante/demandado)
   - Integración con abogados contrarios y notarios
   - Hidratación automática de datos de clientes

3. **Storage Bucket `templates`**
   - Almacenamiento seguro de plantillas DOCX
   - RLS configurado (lectura: todos autenticados, escritura: solo admin)
   - Límite de 10MB por archivo

## 📝 Plantilla DOCX Requerida

### Ubicación
```
Storage Bucket: templates
Archivo: contrato_alquiler.docx
```

### Placeholders Exactos (sensibles a mayúsculas)

#### 🔢 Identificación del Acto
```
{{NUMERO_ACTO}}          → ACT-2025-001
{{NUMERO_ACTA}}          → Número de acta (opcional)
{{NUMERO_FOLIOS}}        → 1, 2, 3...
{{CIUDAD}}               → Santo Domingo
{{MUNICIPIO_NOMBRE}}     → Santo Domingo Este
{{PROVINCIA_NOMBRE}}     → Distrito Nacional
{{FECHA_LARGA}}          → 15 de enero de 2025
```

#### 👤 Primera Parte (Propietario/Vendedor)
```
{{P1_NOMBRE}}            → Juan Pérez García
{{P1_CEDULA_RNC}}        → 001-1234567-8
{{P1_NACIONALIDAD}}      → dominicana
{{P1_ESTADO_CIVIL}}      → casado / soltero / divorciado
{{P1_PROFESION}}         → ingeniero / comerciante
{{P1_DOMICILIO}}         → Calle Principal #123, Los Jardines, Santo Domingo Este, Distrito Nacional, República Dominicana
{{P1_ETIQUETA}}          → EL PROPIETARIO / LA PROPIETARIA
```

#### 👥 Segunda Parte (Inquilino/Comprador)
```
{{P2_NOMBRE}}            → María López
{{P2_CEDULA_RNC}}        → 001-9876543-2
{{P2_NACIONALIDAD}}      → dominicana
{{P2_ESTADO_CIVIL}}      → soltera
{{P2_PROFESION}}         → contadora
{{P2_DOMICILIO}}         → Av. Principal #456, El Vergel, Santo Domingo, Distrito Nacional, República Dominicana
{{P2_ETIQUETA}}          → EL INQUILINO / LA INQUILINA
```

#### ⚖️ Notario Público
```
{{NOTARIO_NOMBRE}}       → Dr. Carlos Ventura
{{NOTARIO_EXEQUATUR}}    → 2024-001
{{NOTARIO_CEDULA_MASK}}  → ***-****67-8
{{NOTARIO_OFICINA}}      → Calle El Conde #45, Zona Colonial
{{NOTARIO_JURISDICCION}} → Santo Domingo / Distrito Nacional
```

#### 🏠 Datos del Contrato
```
{{INMUEBLE_DESCRIPCION}} → Casa de dos niveles ubicada en Calle Principal #123...
{{USO_INMUEBLE}}         → RESIDENCIAL / COMERCIAL
{{CANON_NUM}}            → 15000.00
{{CANON_LETRAS}}         → quince mil pesos
{{PLAZO_MESES}}          → 12
{{PLAZO_LETRAS}}         → doce meses
```

### 📄 Ejemplo de Texto en la Plantilla

```
REPÚBLICA DOMINICANA
CONTRATO DE ALQUILER

{{CIUDAD}}, {{FECHA_LARGA}}

ENTRE:

De una parte, {{P1_NOMBRE}}, de nacionalidad {{P1_NACIONALIDAD}}, mayor de edad, 
{{P1_ESTADO_CIVIL}}, {{P1_PROFESION}}, titular de la cédula No. {{P1_CEDULA_RNC}}, 
domiciliado(a) en {{P1_DOMICILIO}}, quien en lo adelante se denominará {{P1_ETIQUETA}}.

Y de la otra parte, {{P2_NOMBRE}}, de nacionalidad {{P2_NACIONALIDAD}}, mayor de edad,
{{P2_ESTADO_CIVIL}}, {{P2_PROFESION}}, titular de la cédula No. {{P2_CEDULA_RNC}},
domiciliado(a) en {{P2_DOMICILIO}}, quien en lo adelante se denominará {{P2_ETIQUETA}}.

Han convenido el siguiente contrato de alquiler:

PRIMERO: OBJETO DEL CONTRATO
{{P1_ETIQUETA}} da en alquiler a {{P2_ETIQUETA}} el siguiente inmueble:
{{INMUEBLE_DESCRIPCION}}, destinado a uso {{USO_INMUEBLE}}.

SEGUNDO: PRECIO
El canon mensual de alquiler se establece en la suma de RD$ {{CANON_NUM}} 
({{CANON_LETRAS}}), pagaderos por anticipado...

TERCERO: PLAZO
El presente contrato se celebra por un período de {{PLAZO_MESES}} meses 
({{PLAZO_LETRAS}})...

FE DE NOTARIO
Yo, {{NOTARIO_NOMBRE}}, Notario Público de los del número para el Distrito Nacional,
con Exequátur No. {{NOTARIO_EXEQUATUR}}, con oficina en {{NOTARIO_OFICINA}},
jurisdicción de {{NOTARIO_JURISDICCION}}, CERTIFICO Y DOY FE...
```

## 🚀 Cómo Usar el Sistema

### 1. Subir la Plantilla (Solo Admins)

```javascript
// Desde el backend de Lovable o consola de Supabase
1. Ir a Storage → templates
2. Upload File → Seleccionar contrato_alquiler.docx
3. Verificar que se subió correctamente
```

### 2. Generar un Documento

**Paso a Paso:**

1. **Navegar** → `/generador-actos` o `/redaccion-ia-new`

2. **Seleccionar Acto** → Ejemplo: "Contrato de Alquiler" (Extrajudicial)

3. **Completar Formulario:**
   - ✅ Primera Parte (Vendedor/Propietario)
     - Seleccionar cliente o crear nuevo
     - Hidratación automática de datos
     - Completar ubicación geográfica
   
   - ✅ Segunda Parte (Comprador/Inquilino)
     - Seleccionar cliente
     - Datos se llenan automáticamente
   
   - ✅ Notario Público
     - Seleccionar de la lista
     - Exequátur y jurisdicción se autocompletam
   
   - ✅ Datos del Contrato
     - Descripción del inmueble
     - Uso (residencial/comercial)
     - Canon mensual: 15000
     - Plazo en meses: 12

4. **Guardar** → Click en "Guardar y Asignar Número"
   - Se genera número automático: ACT-2025-001
   - Se guarda en base de datos

5. **Descargar DOCX** → Click en "Descargar DOCX"
   - Edge function procesa la plantilla
   - Sustituye todos los placeholders
   - Descarga archivo: `contrato_alquiler_ACT-2025-001.docx`

### 3. Verificar el Documento

Abrir el DOCX descargado y verificar:
- ✅ NO hay corchetes `[TEXTO]`
- ✅ Todas las variables están sustituidas
- ✅ Montos en letras correctos
- ✅ Fechas en formato largo español
- ✅ Etiquetas correctas (EL PROPIETARIO, LA INQUILINA)
- ✅ Domicilios completos con todos los niveles geográficos

## 🔍 Troubleshooting

### ❌ Error: "Falta dato requerido"
**Solución:** Verificar que todos los campos obligatorios estén llenos:
- primera_parte.cliente_id
- segunda_parte.cliente_id
- notario.nombre_completo
- notario.exequatur
- contrato.canon_monto
- contrato.plazo_meses

### ❌ Aparecen corchetes `[NOMBRE DEL NOTARIO]`
**Solución:** 
1. Verificar que la plantilla usa `{{NOTARIO_NOMBRE}}` (con doble llave)
2. Revisar que el campo está lleno en el formulario
3. Ver logs de la edge function para debug

### ❌ Error descargando plantilla
**Solución:**
1. Verificar que `contrato_alquiler.docx` existe en bucket `templates`
2. Verificar permisos RLS del bucket
3. Revisar logs de Supabase Storage

### ❌ Montos en letras incorrectos
**Solución:** La función `numeroALetras()` está optimizada para:
- Números hasta 999,999
- Formato: "quince mil pesos con 50 centavos"
- Para cantidades mayores, extender la función

## 📊 Mapeo de Datos del Formulario

```typescript
{
  // Automático (DB trigger)
  numero_acto: "ACT-2025-001",
  
  // Del formulario
  numero_acta: "123-A",
  numero_folios: 2,
  ciudad: "Santo Domingo",
  fecha: "2025-01-15",
  
  // Primera parte (hidratado desde cliente)
  primera_parte: {
    cliente_id: "uuid...",
    nombre_completo: "Juan Pérez García",
    cedula_rnc: "001-1234567-8",
    nacionalidad: "dominicana",
    estado_civil: "casado",
    profesion: "ingeniero",
    direccion: "Calle Principal #123",
    provincia_nombre: "Distrito Nacional",
    municipio_nombre: "Santo Domingo Este",
    sector_nombre: "Los Jardines",
    tipo_persona: "fisica",
    genero: "m"  // opcional, para etiquetas
  },
  
  // Segunda parte
  segunda_parte: { /* igual estructura */ },
  
  // Notario (hidratado desde selección)
  notario: {
    id: "uuid...",
    nombre_completo: "Dr. Carlos Ventura",
    exequatur: "2024-001",
    cedula_mask: "***-****67-8",
    oficina: "Calle El Conde #45",
    jurisdiccion: "Santo Domingo / Distrito Nacional"
  },
  
  // Contrato
  contrato: {
    inmueble_descripcion: "Casa de dos niveles...",
    uso: "residencial",
    canon_monto: 15000.00,
    plazo_meses: 12
  }
}
```

## 🎯 Próximas Mejoras

1. **Múltiples Plantillas**
   - Crear plantillas para cada tipo de acto
   - Selector dinámico según `acto.slug`

2. **Preview Antes de Descargar**
   - Renderizar vista previa en HTML
   - Permitir edición antes de generar DOCX

3. **Historial de Documentos**
   - Guardar DOCX generados en Storage
   - Lista de documentos por expediente

4. **Firma Digital**
   - Integración con servicios de firma electrónica
   - Certificación notarial digital

## 📚 Referencias

- **docxtemplater:** https://docxtemplater.com/
- **PizZip:** https://github.com/Stuk/jszip
- **Supabase Storage:** https://supabase.com/docs/guides/storage

---

**Estado:** ✅ SISTEMA COMPLETADO Y FUNCIONAL
**Versión:** 1.0
**Última actualización:** 2025-01-15
