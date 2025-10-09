# FORMS_IA_INTAKE — Sistema de Redacción IA para PraxisLex

## Objetivo
Sistema de intake de formularios jurídicos que alimenta al asistente IA para generar documentos legales formales en República Dominicana.

## Convenciones de Nomenclatura

### Nombres Técnicos
- **Formato**: `MATERIA_TIPO_ACCION` (MAYÚSCULAS + guiones bajos)
- **Regex**: `^[A-Z0-9_]+$`
- **Ejemplos**:
  - `CIVIL_COBRO_PESOS`
  - `CONST_AMPARO`
  - `LAB_PRESTACIONES`
  - `INMO_DESLINDE`

## Estructura Estándar de Formularios

### Secciones Obligatorias

1. **Datos del Acto**
   - No. Acto, Folios, Ciudad, Alguacil

2. **Partes**
   - **Demandante/Accionante**: Nombre, nacionalidad, edad, estado civil, profesión, cédula, domicilio
   - **Demandado/Accionado**: Nombre, cargo, cédula, domicilio
   - **Abogado Apoderado**: Nombre, cédula, matrícula CARD, dirección, teléfono, email

3. **Tribunal**
   - Nombre, sala, materia, ubicación, expediente judicial, GEDEX

4. **Contenido**
   - **Hechos**: Narrativa cronológica, fechas, acontecimientos
   - **Fundamento Legal**: Artículos, leyes, jurisprudencia (mínimo 2 citas con URL)
   - **Petitorio**: Pretensiones numeradas (PRIMERO, SEGUNDO, TERCERO...)

5. **Pruebas**
   - Anexos, documentos adjuntos, lista de pruebas

## Esquema JSON de Modelos

```json
{
  "nombre_tecnico": "CIVIL_COBRO_PESOS",
  "materia": "Civil",
  "tipo": "Acto judicial",
  "accion": "Cobro de Pesos",
  "campos": [
    "demandante_nombre",
    "demandante_cedula",
    "demandante_domicilio",
    "demandado_nombre",
    "tribunal_nombre",
    "hechos",
    "fundamentos",
    "pretensiones"
  ],
  "prompt_base": "Redacta un acto de demanda en cobro de pesos según el procedimiento ordinario dominicano. Usa estilo formal procesal, cita artículos del Código Civil y jurisprudencia de la SCJ. Estructura: Presentación → Hechos → Fundamento → Petitorio → Firmas."
}
```

## Prompts Base por Materia

### Civil
```
Redacta un acto de [TIPO] en materia civil siguiendo el procedimiento dominicano.
- Estilo: Formal, técnico, procesal
- Tipografía: Times New Roman 12, interlineado 1.5, márgenes 2.5cm
- Estructura: Presentación de partes → Hechos (cronológico) → Fundamento legal → Petitorio (numerado) → Firmas y sello
- Citas legales: Código Civil dominicano, Código de Procedimiento Civil
- Jurisprudencia: Mínimo 2 sentencias SCJ con número, fecha y URL
- Petitorio: Numerado con PRIMERO, SEGUNDO, TERCERO...
- Anonimización: Reemplaza PII con [Por completar] si falta dato
```

### Constitucional
```
Redacta una acción constitucional de [TIPO] ante el Tribunal Constitucional de RD.
- Énfasis: Derechos fundamentales vulnerados, urgencia
- Base normativa: Constitución de la República Dominicana, Ley 137-11
- Jurisprudencia: Precedentes del TC-RD vinculantes
- Medidas cautelares: Si procede, justificar periculum in mora y fumus boni iuris
```

### Laboral
```
Redacta demanda laboral en [ACCIÓN] ante Tribunal de Trabajo.
- Base legal: Código de Trabajo dominicano (Ley 16-92)
- Detalles: Relación laboral, salario, fecha inicio/fin, motivo terminación
- Cálculo: Prestaciones, preaviso, auxilio cesantía, vacaciones, salarios caídos
- Jurisprudencia: SCJ en materia laboral
```

### Inmobiliario
```
Redacta acción inmobiliaria de [TIPO] ante Tribunal de Tierras.
- Base legal: Ley 108-05, Reglamento de Registro de Tierras
- Identificación: Parcela, DC, matrícula, linderos
- Anexos: Certificación de título, mensura, planos
```

## Validaciones Zod

```typescript
export const modeloBaseSchema = z.object({
  nombre_tecnico: z.string().regex(/^[A-Z0-9_]+$/),
  materia: z.string().min(3),
  tipo: z.string().min(3),
  campos: z.array(z.string().min(3)).nonempty(),
  prompt_base: z.string().min(10)
});

export const intakeCompletoSchema = z.object({
  demandante_nombre: z.string().min(3).max(200),
  demandante_cedula: z.string().optional(),
  demandante_domicilio: z.string().optional(),
  demandado_nombre: z.string().min(3).max(200),
  demandado_domicilio: z.string().optional(),
  abogado_nombre: z.string().min(3),
  abogado_matricula: z.string().optional(),
  tribunal_nombre: z.string().min(3),
  expediente_judicial: z.string().optional(),
  hechos: z.string().min(30),
  fundamentos: z.string().min(10),
  pretensiones: z.string().min(10)
});
```

## Anonimización PII

Antes de enviar al LLM:
```typescript
function anonimizarPII(texto: string): string {
  return texto
    .replace(/\d{3}-?\d{7}-?\d{1}/g, "[[CEDULA]]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[[EMAIL]]")
    .replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[[TEL]]");
}
```

Después de recibir respuesta del LLM, restituir valores reales.

## Composición del Prompt para IA

```typescript
const systemPrompt = `Eres un asistente jurídico experto en derecho dominicano.
Genera documentos formales con estilo procesal, cita jurisprudencia y mantén formato correcto.`;

const contextPrompt = formsPrompt + schema.prompt_base;

const userPrompt = `Genera ${schema.nombre_tecnico} con estos datos:
${JSON.stringify(datosIntake, null, 2)}`;

const messages = [
  { role: "system", content: systemPrompt },
  { role: "user", content: contextPrompt + "\n\n" + userPrompt }
];
```

## Exportación

### DOCX
- Plantilla con bloque de firmas y sello
- Tipografía: Times New Roman 12
- Interlineado: 1.5
- Márgenes: 2.5 cm

### PDF
- Conversión desde DOCX
- Incluir logo PraxisLex en cabecera

## Índice de Modelos Implementados

| ID Técnico | Título | Materia | Estado |
|------------|--------|---------|--------|
| CIVIL_COBRO_PESOS | Demanda en cobro de pesos | Civil | ✅ Activo |
| CONST_AMPARO | Acción de amparo | Constitucional | ✅ Activo |
| CONST_HABEAS_CORPUS | Acción de Habeas Corpus | Constitucional | ✅ Activo |
| CONST_HABEAS_DATA | Acción de Habeas Data | Constitucional | ✅ Activo |
| CIVIL_REFERIMIENTO | Referimiento | Civil | ✅ Activo |
| LAB_PRESTACIONES | Prestaciones laborales | Laboral | ✅ Activo |
| INMO_DESLINDE | Deslinde / Saneamiento | Inmobiliario | ✅ Activo |
| CIVIL_DANOS_PERJUICIOS | Daños y Perjuicios | Civil | ✅ Activo |
| CIVIL_REIVINDICACION | Reivindicación | Civil | ✅ Activo |

## Guardrails del Asistente IA

1. **Tono**: Formal, procesal, técnico-jurídico
2. **Citas**: Mínimo 2 referencias jurisprudenciales con datos completos
3. **Formato**: Times 12, 1.5, márgenes 2.5cm
4. **Datos faltantes**: Marcar como [Por completar] y solicitar al usuario
5. **PII**: Anonimizar antes del LLM, restituir después
6. **Petitorio**: Siempre numerado (PRIMERO, SEGUNDO, TERCERO...)
7. **Firmas**: Incluir bloque estándar con nombres, firmas y sello

## Integración con RAG (Opcional)

Si pgvector está disponible:

```sql
SELECT titulo, contenido, url_fuente
FROM jurisprudence_embeddings
WHERE materia = 'Civil'
ORDER BY embedding <-> query_vector
LIMIT 5;
```

Anclar resultados como "Fuentes citadas" al final del documento.

---

**Versión**: 1.0  
**Última actualización**: 2025-10-09  
**Responsable**: Tech Lead PraxisLex
