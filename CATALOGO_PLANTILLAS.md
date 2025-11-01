# 📊 Catálogo de Plantillas DOCX

## 🎯 Sistema de Plantillas Implementado

El sistema soporta múltiples plantillas dinámicas que se seleccionan automáticamente según el tipo de acto.

---

## 📋 Plantillas Disponibles

### ✅ 1. Contrato de Alquiler
```yaml
slug: contrato-alquiler
archivo: contrato_alquiler.docx
categoria: extrajudicial
estado: ✅ IMPLEMENTADO
requiere_notario: true
requiere_contrato: true

roles_partes:
  - role: arrendador
    label: "Arrendador(es)"
    min: 1
    max: 5
  - role: arrendatario
    label: "Arrendatario(s)"
    min: 1
    max: 5

campos_adicionales:
  - field: inmueble_descripcion
    label: "Descripción del Inmueble"
    type: textarea
    required: true
  - field: uso
    label: "Uso del Inmueble"
    type: select
    options: [residencial, comercial, industrial]
    required: true
  - field: canon_monto
    label: "Canon Mensual (RD$)"
    type: number
    required: true
  - field: plazo_meses
    label: "Plazo (meses)"
    type: number
    required: true

placeholders:
  - NUMERO_ACTO
  - FECHA_LARGA
  - P1_NOMBRE, P1_CEDULA_RNC, P1_DOMICILIO
  - P2_NOMBRE, P2_CEDULA_RNC, P2_DOMICILIO
  - NOTARIO_NOMBRE, NOTARIO_EXEQUATUR
  - INMUEBLE_DESCRIPCION, USO_INMUEBLE
  - CANON_NUM, CANON_LETRAS
  - PLAZO_MESES, PLAZO_LETRAS
```

### 📝 2. Contrato de Compraventa
```yaml
slug: contrato-compraventa
archivo: contrato_compraventa.docx
categoria: extrajudicial
estado: ⏳ POR IMPLEMENTAR
requiere_notario: true
requiere_contrato: true

roles_partes:
  - role: vendedor
    label: "Vendedor(es)"
  - role: comprador
    label: "Comprador(es)"

campos_adicionales:
  - field: bien_descripcion
    label: "Descripción del Bien"
    type: textarea
  - field: precio_monto
    label: "Precio (RD$)"
    type: number
  - field: forma_pago
    label: "Forma de Pago"
    type: select
    options: [efectivo, transferencia, cheque, financiamiento]
  - field: fecha_entrega
    label: "Fecha de Entrega"
    type: date

placeholders_adicionales:
  - PRECIO_NUM, PRECIO_LETRAS
  - FORMA_PAGO
  - BIEN_DESCRIPCION
  - FECHA_ENTREGA
```

### ⚖️ 3. Demanda Civil
```yaml
slug: demanda-civil
archivo: demanda_civil.docx
categoria: judicial
estado: ⏳ POR IMPLEMENTAR
requiere_notario: false
requiere_contrato: false

roles_partes:
  - role: demandante
    label: "Demandante(s)"
  - role: demandado
    label: "Demandado(s)"

campos_adicionales:
  - field: objeto_demanda
    label: "Objeto de la Demanda"
    type: textarea
  - field: hechos
    label: "Narración de Hechos"
    type: textarea
  - field: derecho
    label: "Fundamentos de Derecho"
    type: textarea
  - field: petitorio
    label: "Petitorio"
    type: textarea
  - field: valor_demanda
    label: "Valor de la Demanda (RD$)"
    type: number

placeholders_adicionales:
  - OBJETO_DEMANDA
  - HECHOS
  - DERECHO
  - PETITORIO
  - VALOR_NUM, VALOR_LETRAS
  - TRIBUNAL_NOMBRE
```

### 📜 4. Poder General
```yaml
slug: poder-general
archivo: poder_general.docx
categoria: notarial
estado: ⏳ POR IMPLEMENTAR
requiere_notario: true
requiere_contrato: false

roles_partes:
  - role: poderdante
    label: "Poderdante(s)"
  - role: apoderado
    label: "Apoderado(s)"

campos_adicionales:
  - field: poderes_conferidos
    label: "Poderes Conferidos"
    type: textarea
  - field: duracion
    label: "Duración del Poder"
    type: text
  - field: restricciones
    label: "Restricciones (opcional)"
    type: textarea

placeholders_adicionales:
  - PODERES_CONFERIDOS
  - DURACION
  - RESTRICCIONES
```

### 🏛️ 5. Testamento
```yaml
slug: testamento
archivo: testamento.docx
categoria: notarial
estado: ⏳ POR IMPLEMENTAR
requiere_notario: true
requiere_contrato: false

roles_partes:
  - role: testador
    label: "Testador"
    min: 1
    max: 1

campos_adicionales:
  - field: disposiciones
    label: "Disposiciones Testamentarias"
    type: textarea
  - field: testigo1_nombre
    label: "Testigo 1 - Nombre"
    type: text
  - field: testigo1_cedula
    label: "Testigo 1 - Cédula"
    type: text
  - field: testigo2_nombre
    label: "Testigo 2 - Nombre"
    type: text
  - field: testigo2_cedula
    label: "Testigo 2 - Cédula"
    type: text

placeholders_adicionales:
  - DISPOSICIONES
  - TESTIGO1_NOMBRE, TESTIGO1_CEDULA
  - TESTIGO2_NOMBRE, TESTIGO2_CEDULA
```

### 📋 6. Acta Notarial
```yaml
slug: acta-notarial
archivo: acta_notarial.docx
categoria: notarial
estado: ⏳ POR IMPLEMENTAR
requiere_notario: true
requiere_contrato: false

roles_partes:
  - role: compareciente
    label: "Compareciente(s)"

campos_adicionales:
  - field: objeto_acta
    label: "Objeto del Acta"
    type: textarea
  - field: lugar_actuacion
    label: "Lugar de Actuación"
    type: text
  - field: hora_actuacion
    label: "Hora"
    type: time

placeholders_adicionales:
  - OBJETO_ACTA
  - LUGAR_ACTUACION
  - HORA_ACTUACION
```

### ⚖️ 7. Recurso de Amparo
```yaml
slug: recurso-amparo
archivo: recurso_amparo.docx
categoria: judicial
estado: ⏳ POR IMPLEMENTAR
requiere_notario: false
requiere_contrato: false

roles_partes:
  - role: recurrente
    label: "Recurrente(s)"
  - role: recurrido
    label: "Recurrido(s)"

campos_adicionales:
  - field: derecho_vulnerado
    label: "Derecho Fundamental Vulnerado"
    type: textarea
  - field: acto_impugnado
    label: "Acto Impugnado"
    type: textarea
  - field: fundamentos
    label: "Fundamentos"
    type: textarea
  - field: medidas_provisionales
    label: "Medidas Provisionales Solicitadas"
    type: textarea

placeholders_adicionales:
  - DERECHO_VULNERADO
  - ACTO_IMPUGNADO
  - FUNDAMENTOS
  - MEDIDAS_PROVISIONALES
```

### 📄 8. Contrato de Trabajo
```yaml
slug: contrato-trabajo
archivo: contrato_trabajo.docx
categoria: extrajudicial
estado: ⏳ POR IMPLEMENTAR
requiere_notario: false
requiere_contrato: true

roles_partes:
  - role: empleador
    label: "Empleador"
  - role: empleado
    label: "Empleado"

campos_adicionales:
  - field: cargo
    label: "Cargo"
    type: text
  - field: salario_monto
    label: "Salario Mensual (RD$)"
    type: number
  - field: horario
    label: "Horario de Trabajo"
    type: text
  - field: fecha_inicio
    label: "Fecha de Inicio"
    type: date
  - field: tipo_contrato
    label: "Tipo de Contrato"
    type: select
    options: [indefinido, plazo_fijo, obra_servicio]

placeholders_adicionales:
  - CARGO
  - SALARIO_NUM, SALARIO_LETRAS
  - HORARIO
  - FECHA_INICIO
  - TIPO_CONTRATO
```

---

## 🔄 Proceso de Implementación

### Para Agregar Nueva Plantilla:

#### 1. Crear plantilla DOCX
```bash
# Seguir GUIA_CREACION_PLANTILLAS.md
# Archivo: nombre-plantilla.docx
```

#### 2. Subir a Storage
```typescript
// Backend → Storage → templates → Upload
```

#### 3. Registrar en BD
```sql
INSERT INTO document_templates (...) VALUES (...);
```

#### 4. Actualizar Edge Function (si necesita nuevas variables)
```typescript
// supabase/functions/generate-legal-doc/index.ts
// Agregar lógica en normalizaPayload() si es necesario
```

#### 5. Testing
```bash
# Usar CHECKLIST_PRUEBAS_DOCX.md
```

---

## 📊 Estadísticas

| Categoría | Total | Implementadas | Pendientes |
|-----------|-------|---------------|------------|
| Extrajudicial | 3 | 1 | 2 |
| Judicial | 2 | 0 | 2 |
| Notarial | 3 | 0 | 3 |
| **TOTAL** | **8** | **1** | **7** |

---

## 🎯 Prioridades

### Alta Prioridad 🔴
1. Contrato de Compraventa (extrajudicial)
2. Demanda Civil (judicial)
3. Poder General (notarial)

### Media Prioridad 🟡
4. Testamento (notarial)
5. Recurso de Amparo (judicial)

### Baja Prioridad 🟢
6. Acta Notarial (notarial)
7. Contrato de Trabajo (extrajudicial)

---

## 🔧 Mantenimiento

### Versiones de Plantillas
```sql
-- Actualizar versión
UPDATE document_templates 
SET version = '1.1', 
    updated_at = now()
WHERE slug = 'contrato-alquiler';

-- Desactivar plantilla obsoleta
UPDATE document_templates 
SET activo = false 
WHERE slug = 'plantilla-antigua';
```

### Migración de Plantillas
```sql
-- Crear nueva versión manteniendo la anterior
INSERT INTO document_templates (slug, nombre, version, storage_path, ...)
VALUES ('contrato-alquiler-v2', 'Contrato de Alquiler v2', '2.0', 'contrato_alquiler_v2.docx', ...);
```

---

**Versión:** 1.0  
**Última actualización:** 2025-01-15  
**Mantenido por:** Sistema PraxisLex
