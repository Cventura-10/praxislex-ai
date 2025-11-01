# 📄 Contenido Exacto para contrato_alquiler.docx

## 🎯 Instrucciones

Crea un documento Word (.docx) y copia EXACTAMENTE este contenido. Los placeholders entre `{{doble llave}}` serán sustituidos automáticamente.

---

## 📝 Contenido del Documento

```
                        REPÚBLICA DOMINICANA

                      CONTRATO DE ALQUILER

Número de Acto: {{NUMERO_ACTO}}
Número de Acta: {{NUMERO_ACTA}}
Folios: {{NUMERO_FOLIOS}}

{{CIUDAD}}, {{FECHA_LARGA}}


ENTRE:

De una parte, {{P1_NOMBRE}}, de nacionalidad {{P1_NACIONALIDAD}}, mayor de edad, {{P1_ESTADO_CIVIL}}, {{P1_PROFESION}}, titular de la cédula/RNC No. {{P1_CEDULA_RNC}}, domiciliado(a) en {{P1_DOMICILIO}}, quien en lo adelante se denominará {{P1_ETIQUETA}}.

Y de la otra parte, {{P2_NOMBRE}}, de nacionalidad {{P2_NACIONALIDAD}}, mayor de edad, {{P2_ESTADO_CIVIL}}, {{P2_PROFESION}}, titular de la cédula/RNC No. {{P2_CEDULA_RNC}}, domiciliado(a) en {{P2_DOMICILIO}}, quien en lo adelante se denominará {{P2_ETIQUETA}}.

Han convenido celebrar el presente CONTRATO DE ALQUILER bajo las siguientes cláusulas:


PRIMERO: OBJETO DEL CONTRATO

{{P1_ETIQUETA}} da en alquiler a {{P2_ETIQUETA}} el siguiente inmueble: {{INMUEBLE_DESCRIPCION}}, destinado a uso {{USO_INMUEBLE}}.


SEGUNDO: PRECIO

El canon mensual de alquiler se establece en la suma de RD$ {{CANON_NUM}} ({{CANON_LETRAS}}), pagaderos por anticipado dentro de los primeros cinco (5) días de cada mes.


TERCERO: PLAZO

El presente contrato se celebra por un período de {{PLAZO_MESES}} meses ({{PLAZO_LETRAS}}), contados a partir de la fecha de firma del presente documento.


CUARTO: OBLIGACIONES DEL ARRENDADOR

{{P1_ETIQUETA}} se obliga a:
a) Entregar el inmueble en buen estado de conservación
b) Realizar las reparaciones mayores que sean necesarias
c) Respetar el uso pacífico del inmueble por parte de {{P2_ETIQUETA}}


QUINTO: OBLIGACIONES DEL ARRENDATARIO

{{P2_ETIQUETA}} se obliga a:
a) Pagar puntualmente el canon de alquiler
b) Dar al inmueble el uso convenido ({{USO_INMUEBLE}})
c) Mantener el inmueble en buen estado de conservación
d) Realizar las reparaciones menores que sean necesarias


SEXTO: TERMINACIÓN

El presente contrato podrá ser terminado por cualquiera de las partes mediante notificación escrita con treinta (30) días de anticipación.


SÉPTIMO: JURISDICCIÓN

Para todos los efectos legales del presente contrato, las partes eligen como domicilio la ciudad de {{CIUDAD}}, {{MUNICIPIO_NOMBRE}}, {{PROVINCIA_NOMBRE}}, sometiéndose a la jurisdicción de los tribunales competentes de la misma.


FE DE NOTARIO

Yo, {{NOTARIO_NOMBRE}}, Notario Público de los del número para {{NOTARIO_JURISDICCION}}, con Exequátur No. {{NOTARIO_EXEQUATUR}}, cédula de identidad y electoral No. {{NOTARIO_CEDULA_MASK}}, con oficina abierta en {{NOTARIO_OFICINA}}, jurisdicción de {{NOTARIO_JURISDICCION}}, CERTIFICO Y DOY FE:

Que las partes que anteceden han firmado el presente contrato en mi presencia, previa lectura íntegra que les hice del mismo, ratificando su contenido y firmando para constancia junto conmigo.

En fe de lo cual, suscribo el presente acto notarial en la ciudad de {{CIUDAD}}, a los {{FECHA_LARGA}}.


_______________________          _______________________
{{P1_ETIQUETA}}                  {{P2_ETIQUETA}}
{{P1_NOMBRE}}                    {{P2_NOMBRE}}


_______________________
{{NOTARIO_NOMBRE}}
Notario Público
Exequátur No. {{NOTARIO_EXEQUATUR}}
```

---

## ✅ Checklist de Creación

1. **Crear documento Word** → Nuevo documento en blanco
2. **Formato del título:**
   - "REPÚBLICA DOMINICANA" → Centrado, Negrita, 14pt
   - "CONTRATO DE ALQUILER" → Centrado, Negrita, 16pt
3. **Copiar contenido** → Pegar TODO el texto de arriba
4. **Verificar placeholders** → Todos deben tener `{{DOBLE_LLAVE}}`
5. **Formato del cuerpo:**
   - Fuente: Times New Roman, 12pt
   - Interlineado: 1.5
   - Alineación: Justificado
6. **Guardar como:**
   - Nombre: `contrato_alquiler.docx`
   - Formato: `.docx` (NO .doc ni .pdf)

---

## 🔑 Placeholders Usados

### Identificación
- `{{NUMERO_ACTO}}` - ACT-2025-001
- `{{NUMERO_ACTA}}` - Número de acta
- `{{NUMERO_FOLIOS}}` - Cantidad de folios
- `{{CIUDAD}}` - Ciudad
- `{{MUNICIPIO_NOMBRE}}` - Municipio
- `{{PROVINCIA_NOMBRE}}` - Provincia
- `{{FECHA_LARGA}}` - "15 de enero de 2025"

### Primera Parte (Propietario)
- `{{P1_NOMBRE}}` - Nombre completo
- `{{P1_CEDULA_RNC}}` - Cédula/RNC
- `{{P1_NACIONALIDAD}}` - Nacionalidad
- `{{P1_ESTADO_CIVIL}}` - Estado civil
- `{{P1_PROFESION}}` - Profesión
- `{{P1_DOMICILIO}}` - Domicilio completo
- `{{P1_ETIQUETA}}` - EL PROPIETARIO / LA PROPIETARIA

### Segunda Parte (Inquilino)
- `{{P2_NOMBRE}}` - Nombre completo
- `{{P2_CEDULA_RNC}}` - Cédula/RNC
- `{{P2_NACIONALIDAD}}` - Nacionalidad
- `{{P2_ESTADO_CIVIL}}` - Estado civil
- `{{P2_PROFESION}}` - Profesión
- `{{P2_DOMICILIO}}` - Domicilio completo
- `{{P2_ETIQUETA}}` - EL INQUILINO / LA INQUILINA

### Notario
- `{{NOTARIO_NOMBRE}}` - Nombre completo
- `{{NOTARIO_EXEQUATUR}}` - Número de exequátur
- `{{NOTARIO_CEDULA_MASK}}` - Cédula enmascarada
- `{{NOTARIO_OFICINA}}` - Dirección de oficina
- `{{NOTARIO_JURISDICCION}}` - Jurisdicción

### Contrato
- `{{INMUEBLE_DESCRIPCION}}` - Descripción del inmueble
- `{{USO_INMUEBLE}}` - RESIDENCIAL / COMERCIAL
- `{{CANON_NUM}}` - 15000.00
- `{{CANON_LETRAS}}` - quince mil pesos
- `{{PLAZO_MESES}}` - 12
- `{{PLAZO_LETRAS}}` - doce meses

---

## 📤 Subir a Lovable Cloud

Una vez creado el archivo:

1. **Abrir Backend** → Click en el botón de backend
2. **Storage** → Ir a sección Storage
3. **Bucket `templates`** → Seleccionar el bucket
4. **Upload** → Subir `contrato_alquiler.docx`
5. **Verificar** → Debe aparecer en la lista de archivos

---

## ⚠️ Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Aparecen corchetes `[TEXTO]` | Usaste `[VARIABLE]` en vez de `{{VARIABLE}}` | Reemplazar con doble llave |
| "Template not found" | Nombre incorrecto del archivo | Debe ser exactamente `contrato_alquiler.docx` |
| "Invalid format" | Guardaste como .doc o .pdf | Guardar como .docx |
| Variables sin sustituir | Nombre no coincide exactamente | Revisar mayúsculas/minúsculas |

---

## 🧪 Probar después de subir

1. Ir a `/redaccion-ia-new`
2. Seleccionar "Contrato de Alquiler"
3. Completar formulario
4. Click "Guardar y Asignar Número"
5. Click "Descargar DOCX"
6. Abrir DOCX descargado
7. Verificar que NO hay `{{VARIABLES}}` ni `[CORCHETES]`

---

**Fecha:** 2025-01-15  
**Versión:** 1.0
