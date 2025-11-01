# 📄 Plantillas DOCX - Guía de Creación

## 🎯 Objetivo

Crear plantillas .docx profesionales que el sistema pueda procesar automáticamente usando docxtemplater.

---

## 📝 Formato de Placeholders

### Sintaxis Base
```
{{NOMBRE_VARIABLE}}
```

**Reglas:**
- ✅ Doble llave `{{` y `}}`
- ✅ MAYÚSCULAS con guiones bajos
- ✅ Sin espacios dentro de las llaves
- ❌ NO usar `[VARIABLE]` ni `{VARIABLE}`
- ❌ NO usar minúsculas

---

## 🏗️ Estructura de Plantillas

### 1. Encabezado
```
REPÚBLICA DOMINICANA
{{TITULO_ACTO}}

Número de Acto: {{NUMERO_ACTO}}
{{CIUDAD}}, {{FECHA_LARGA}}
```

### 2. Partes (Comparecientes)
```
ENTRE:

De una parte, {{P1_NOMBRE}}, de nacionalidad {{P1_NACIONALIDAD}}, 
mayor de edad, {{P1_ESTADO_CIVIL}}, {{P1_PROFESION}}, 
titular de la cédula No. {{P1_CEDULA_RNC}}, 
domiciliado(a) en {{P1_DOMICILIO}}, 
quien en lo adelante se denominará {{P1_ETIQUETA}}.

Y de la otra parte, {{P2_NOMBRE}}, de nacionalidad {{P2_NACIONALIDAD}},
mayor de edad, {{P2_ESTADO_CIVIL}}, {{P2_PROFESION}},
titular de la cédula No. {{P2_CEDULA_RNC}},
domiciliado(a) en {{P2_DOMICILIO}},
quien en lo adelante se denominará {{P2_ETIQUETA}}.
```

### 3. Cuerpo del Documento
```
PRIMERO: OBJETO
{{P1_ETIQUETA}} [descripción del acto] a {{P2_ETIQUETA}}...

SEGUNDO: [CLÁUSULA]
...
```

### 4. Cierre Notarial
```
FE DE NOTARIO

Yo, {{NOTARIO_NOMBRE}}, Notario Público de los del número para {{NOTARIO_JURISDICCION}},
con Exequátur No. {{NOTARIO_EXEQUATUR}}, cédula {{NOTARIO_CEDULA_MASK}},
con oficina en {{NOTARIO_OFICINA}}, CERTIFICO Y DOY FE...
```

### 5. Firmas
```
_______________________          _______________________
{{P1_ETIQUETA}}                  {{P2_ETIQUETA}}
{{P1_NOMBRE}}                    {{P2_NOMBRE}}


_______________________
{{NOTARIO_NOMBRE}}
Notario Público
```

---

## 📋 Variables Disponibles

### Identificación del Acto
| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `{{NUMERO_ACTO}}` | ACT-2025-001 | Número automático |
| `{{NUMERO_ACTA}}` | 123-A | Número de acta |
| `{{NUMERO_FOLIOS}}` | 2 | Cantidad de folios |
| `{{CIUDAD}}` | Santo Domingo | Ciudad |
| `{{MUNICIPIO_NOMBRE}}` | Santo Domingo Este | Municipio |
| `{{PROVINCIA_NOMBRE}}` | Distrito Nacional | Provincia |
| `{{FECHA_LARGA}}` | 15 de enero de 2025 | Fecha en español |

### Primera Parte (P1)
| Variable | Ejemplo |
|----------|---------|
| `{{P1_NOMBRE}}` | Juan Pérez García |
| `{{P1_CEDULA_RNC}}` | 001-1234567-8 |
| `{{P1_NACIONALIDAD}}` | dominicana |
| `{{P1_ESTADO_CIVIL}}` | casado |
| `{{P1_PROFESION}}` | ingeniero |
| `{{P1_DOMICILIO}}` | Calle Principal #123, Los Jardines, Santo Domingo Este, DN, RD |
| `{{P1_ETIQUETA}}` | EL VENDEDOR / LA VENDEDORA |

### Segunda Parte (P2)
Mismas variables con prefijo `P2_`

### Notario
| Variable | Ejemplo |
|----------|---------|
| `{{NOTARIO_NOMBRE}}` | Dr. Carlos Ventura |
| `{{NOTARIO_EXEQUATUR}}` | 2024-001 |
| `{{NOTARIO_CEDULA_MASK}}` | ***-****67-8 |
| `{{NOTARIO_OFICINA}}` | Calle El Conde #45 |
| `{{NOTARIO_JURISDICCION}}` | Santo Domingo |

### Datos del Contrato (si aplica)
| Variable | Ejemplo |
|----------|---------|
| `{{INMUEBLE_DESCRIPCION}}` | Casa de dos niveles... |
| `{{USO_INMUEBLE}}` | RESIDENCIAL |
| `{{CANON_NUM}}` | 15000.00 |
| `{{CANON_LETRAS}}` | quince mil pesos |
| `{{PLAZO_MESES}}` | 12 |
| `{{PLAZO_LETRAS}}` | doce meses |

---

## 🎨 Formato Recomendado

### Fuentes
- **Título:** Times New Roman, 16pt, Negrita, Centrado
- **Subtítulos:** Times New Roman, 14pt, Negrita
- **Cuerpo:** Times New Roman, 12pt, Justificado
- **Variables:** NO aplicar negrita ni cursiva

### Espaciado
- **Interlineado:** 1.5
- **Antes de párrafo:** 6pt
- **Después de párrafo:** 6pt

### Márgenes
- **Superior:** 2.5 cm
- **Inferior:** 2.5 cm
- **Izquierdo:** 3 cm
- **Derecho:** 2 cm

---

## 📄 Plantillas de Ejemplo

### 1. Contrato de Alquiler ✅
```
Archivo: contrato_alquiler.docx
Categoría: Extrajudicial
Requiere: Notario + Contrato
Campos: inmueble_descripcion, uso, canon_monto, plazo_meses
```

### 2. Contrato de Compraventa
```
Archivo: contrato_compraventa.docx
Categoría: Extrajudicial
Requiere: Notario + Contrato
Variables adicionales:
- {{PRECIO_NUM}} - 500000.00
- {{PRECIO_LETRAS}} - quinientos mil pesos
- {{FORMA_PAGO}} - Efectivo / Transferencia / Cheque
- {{BIEN_DESCRIPCION}} - Descripción del bien
```

### 3. Poder General
```
Archivo: poder_general.docx
Categoría: Notarial
Requiere: Notario
Variables adicionales:
- {{PODERES_CONFERIDOS}} - Lista de poderes
- {{DURACION}} - Plazo del poder
- {{RESTRICCIONES}} - Limitaciones si aplica
```

### 4. Testamento
```
Archivo: testamento.docx
Categoría: Notarial
Requiere: Notario + Testigos
Variables adicionales:
- {{TESTIGO1_NOMBRE}}
- {{TESTIGO1_CEDULA}}
- {{TESTIGO2_NOMBRE}}
- {{TESTIGO2_CEDULA}}
- {{DISPOSICIONES}} - Cláusulas testamentarias
```

### 5. Demanda Civil
```
Archivo: demanda_civil.docx
Categoría: Judicial
Requiere: Abogados
Variables adicionales:
- {{DEMANDANTE_NOMBRE}}
- {{DEMANDADO_NOMBRE}}
- {{OBJETO_DEMANDA}}
- {{HECHOS}} - Narración
- {{DERECHO}} - Fundamentos legales
- {{PETITORIO}} - Solicitudes
```

---

## 🔧 Proceso de Creación

### Paso 1: Diseñar en Word
1. Crear documento nuevo
2. Aplicar formato profesional
3. Insertar placeholders `{{VARIABLE}}`
4. Revisar ortografía (sin revisar variables)

### Paso 2: Validar Placeholders
```bash
# Buscar en el documento:
{{[A-Z_]+}}

# Verificar que todas las variables estén en MAYÚSCULAS
```

### Paso 3: Guardar
- Formato: `.docx` (NO .doc ni .pdf)
- Nombre: `slug-del-acto.docx`
- Sin contraseña ni protección

### Paso 4: Subir a Storage
```typescript
// Backend → Storage → templates → Upload
// Verificar que aparece en la lista
```

### Paso 5: Registrar en BD
```sql
INSERT INTO document_templates (
  slug,
  nombre,
  descripcion,
  categoria,
  storage_path,
  requiere_notario,
  requiere_contrato,
  roles_partes,
  campos_adicionales
) VALUES (
  'contrato-compraventa',
  'Contrato de Compraventa',
  'Contrato de compraventa de bienes inmuebles',
  'extrajudicial',
  'contrato_compraventa.docx',
  true,
  true,
  '[{"role": "vendedor", "label": "Vendedor(es)"}, {"role": "comprador", "label": "Comprador(es)"}]'::jsonb,
  '[{"field": "precio_monto", "type": "number", "required": true}]'::jsonb
);
```

---

## ✅ Checklist de Calidad

### Antes de Subir
- [ ] Todas las variables en MAYÚSCULAS
- [ ] Doble llave `{{` y `}}`
- [ ] Sin espacios en placeholders
- [ ] Formato profesional aplicado
- [ ] Sin errores ortográficos
- [ ] Guardado como .docx
- [ ] Nombre de archivo correcto

### Después de Subir
- [ ] Genera documento sin errores
- [ ] Todas las variables sustituidas
- [ ] Sin corchetes `{{}}` en output
- [ ] Formato se mantiene
- [ ] Tamaño razonable (< 5MB)

---

## 🐛 Errores Comunes

### ❌ Variables sin sustituir
**Problema:** Aparecen `{{VARIABLE}}` en documento final
**Solución:**
- Verificar que la variable existe en el edge function
- Revisar mayúsculas/minúsculas
- Comprobar que el campo está lleno en el formulario

### ❌ Formato perdido
**Problema:** Documento sale sin formato
**Solución:**
- NO usar Copiar/Pegar desde PDF
- Aplicar formato directamente en Word
- Evitar estilos personalizados complejos

### ❌ Documento muy pesado
**Problema:** Archivo > 10MB
**Solución:**
- Comprimir imágenes (si hay)
- Eliminar metadatos innecesarios
- Simplificar formato

---

## 📚 Recursos

### Documentación
- [Docxtemplater Official](https://docxtemplater.com/)
- [Placeholders Syntax](https://docxtemplater.com/docs/tag-types/)
- [Loops in Templates](https://docxtemplater.com/docs/loops/)

### Herramientas
- Microsoft Word 2016+
- LibreOffice Writer (alternativa)
- Validador de placeholders (regex)

---

**Versión:** 1.0  
**Fecha:** 2025-01-15  
**Autor:** Sistema PraxisLex
