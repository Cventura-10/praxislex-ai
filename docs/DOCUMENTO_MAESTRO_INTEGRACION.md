# Documento Maestro de Integración: Sistema de Modelos y Mandatos de Actos Jurídicos

**Autor:** Manus AI  
**Fecha:** 15 de octubre de 2025  
**Versión:** 1.0

---

## Resumen Ejecutivo

Este documento maestro integra todos los componentes desarrollados para la reformulación del sistema de generación de actos jurídicos de la Oficina Jurídica Virtual (Lovable). El sistema está diseñado para corregir los errores críticos identificados en el Prompt Maestro original y proporcionar una base sólida para la generación automatizada de documentos legales procesalmente impecables.

### Componentes Desarrollados

El sistema se compone de tres elementos fundamentales que trabajan de manera integrada:

**Modelos Estructurados de Actos Jurídicos:** Seis plantillas maestras que definen la estructura correcta de cada tipo de acto, basadas en los documentos de referencia proporcionados. Estos modelos sirven como la base arquitectónica para la generación de documentos.

**Mandatos de Corrección:** Seis conjuntos de instrucciones detalladas que guían el proceso de generación y corrección de cada tipo de acto. Cada mandato identifica los errores comunes, establece las reglas de corrección y define los inputs necesarios.

**Sistema de Verificación:** Una matriz de validación y checklists que garantizan que los actos generados cumplan con todos los requisitos procesales y formales de la legislación dominicana.

---

## Arquitectura del Sistema

El sistema funciona mediante un flujo de trabajo integrado que conecta los tres componentes:

```
USUARIO → Selecciona tipo de acto → Sistema carga MODELO correspondiente
    ↓
Sistema solicita INPUTS según MANDATO
    ↓
Usuario ingresa datos (manual o por voz)
    ↓
Sistema genera acto usando IA + MANDATO como prompt
    ↓
Sistema ejecuta VERIFICACIÓN automática
    ↓
Usuario revisa y aprueba → DOCUMENTO FINAL
```

---

## Catálogo de Modelos y Mandatos

### 1. Acto de Traslado (Demanda)

**Archivo del Modelo:** `modelo_acto_de_traslado_demanda.md`  
**Archivo del Mandato:** `mandato_acto_de_traslado_demanda.md`

**Descripción:** Este modelo representa la estructura de una demanda formal que funciona simultáneamente como acto de emplazamiento. Es el acto más complejo del sistema, ya que combina la argumentación de fondo con la citación procesal.

**Estructura:**
- Presentación (Designación del Alguacil, Traslado, Citación)
- Relato Fáctico
- Aspectos Regulatorios (Fundamentos de Derecho)
- Tesis de Derecho
- Dispositivos (Petitorio)
- Declaración Verbal de Recibo y Costo

**Inputs Principales:**
- Datos del demandante, demandado, abogado y alguacil
- Tribunal apoderado
- Relato detallado de los hechos
- Fundamentos de derecho con citas legales
- Petitorio específico

**Casos de Uso:** Demanda en Cobro de Pesos, Demanda en Responsabilidad Civil, Demanda en Resolución de Contrato, Demanda en Devolución de Valores.

---

### 2. Emplazamiento Puro

**Archivo del Modelo:** `modelo_emplazamiento.md`  
**Archivo del Mandato:** `mandato_emplazamiento.md`

**Descripción:** Este modelo representa un acto de notificación pura. Su única función es citar al demandado para que comparezca ante un tribunal. **NO contiene argumentación de fondo.**

**Estructura:**
- Encabezado del Alguacil
- Proceso Verbal de Traslado
- Notificación y Citación (Avenir)
- Advertencia de Defecto
- Cierre del Alguacil

**Inputs Principales:**
- Datos del requeriente, emplazado y alguacil
- Tribunal y fecha/hora de la audiencia
- Objeto de la demanda (mención breve)

**Casos de Uso:** Citación para audiencia de continuación, Emplazamiento para conocer de un recurso, Notificación de comparecencia.

**⚠️ Corrección Crítica:** El mandato de este modelo es el más importante del sistema, ya que corrige el error más común: confundir un emplazamiento con una demanda. El sistema debe verificar que NO se incluyan secciones de relato fáctico ni fundamentos de derecho.

---

### 3. Contrato de Compraventa Inmobiliaria

**Archivo del Modelo:** `modelo_contrato_compraventa.md`  
**Archivo del Mandato:** `mandato_contrato_compraventa.md`

**Descripción:** Este modelo representa un contrato privado de compraventa de un bien inmueble. Es un acto extrajudicial que establece las obligaciones de las partes antes del traspaso definitivo.

**Estructura:**
- Encabezado (Partes)
- Preámbulo (Por Cuanto)
- Articulado (Objeto, Precio, Entrega, Garantías)
- Cierre y Firmas
- Certificación Notarial

**Inputs Principales:**
- Datos de la vendedora y el comprador
- Descripción completa del inmueble
- Precio y forma de pago
- Datos del Certificado de Título
- Datos del notario

**Casos de Uso:** Compraventa de apartamento, Compraventa de casa, Compraventa de terreno, Compraventa condicional con financiamiento.

**⚠️ Corrección Crítica:** El mandato enfatiza que la terminología debe ser exclusivamente contractual (no procesal). No debe contener términos como "tribunal", "demanda" o "emplazamiento".

---

### 4. Escrito de Conclusiones

**Archivo del Modelo:** `modelo_escrito_conclusiones.md`  
**Archivo del Mandato:** `mandato_escrito_conclusiones.md`

**Descripción:** Este modelo representa el escrito mediante el cual una parte presenta sus conclusiones finales en un proceso judicial, resumiendo sus argumentos y solicitando al juez que falle de una manera determinada.

**Estructura:**
- Encabezado (Tribunal, Partes, Expedientes)
- Relato Fáctico
- Fundamentos de Derecho
- Dispositivo/Petitorio (Conclusiones)

**Inputs Principales:**
- Datos del tribunal y del juez
- Números de expediente
- Argumentación fáctica y jurídica
- Petitorio específico

**Casos de Uso:** Conclusiones de la parte demandante, Conclusiones de la parte demandada, Conclusiones en apelación.

---

### 5. Inventario de Documentos

**Archivo del Modelo:** `modelo_inventario_documentos.md`  
**Archivo del Mandato:** `mandato_inventario_documentos.md`

**Descripción:** Este modelo representa un escrito de mero trámite para depositar formalmente documentos en el expediente de un caso judicial.

**Estructura:**
- Encabezado (Tribunal, Abogado, Expediente)
- Listado Secuencial de Documentos
- Solicitud a Secretaría
- Firma del Abogado

**Inputs Principales:**
- Datos del tribunal y del abogado
- Número de expediente
- Lista detallada de documentos (tipo, fecha, descripción)

**Casos de Uso:** Depósito de pruebas documentales, Depósito de sentencias, Depósito de contratos, Depósito de cédulas de identidad.

---

### 6. Querella Penal con Constitución en Actor Civil

**Archivo del Modelo:** `modelo_querella_penal.md`  
**Archivo del Mandato:** `mandato_querella_penal.md`

**Descripción:** Este modelo representa una querella penal, que es el acto mediante el cual una víctima se constituye en parte del proceso para acusar al presunto autor de una infracción y reclamar una reparación.

**Estructura:**
- Encabezado (Jurisdicción, Partes)
- Relato de los Hechos
- Calificación Jurídica
- Pruebas
- Constitución en Actor Civil
- Petitorio (Conclusiones)

**Inputs Principales:**
- Datos del querellante, imputado y abogado
- Infracción penal
- Relato detallado de los hechos
- Calificación jurídica con citas del Código Penal
- Lista de pruebas
- Monto de la indemnización

**Casos de Uso:** Querella por Estafa, Querella por Abuso de Confianza, Querella por Robo, Querella por Violencia Intrafamiliar.

**⚠️ Corrección Crítica:** El mandato enfatiza que una querella NO es un acto de alguacil. Es un escrito que se deposita directamente en la fiscalía o el juzgado de instrucción.

---

## Taxonomía Corregida del Sistema

Uno de los problemas críticos identificados fue la clasificación incorrecta de las materias. A continuación, se presenta la taxonomía corregida que debe implementarse en el sistema Lovable:

### Actos Judiciales

| Materia | Descripción | Actos Principales |
|---------|-------------|-------------------|
| **Civil y Comercial** | Litigios entre particulares sobre derechos privados | Demanda Civil, Emplazamiento, Mandamiento de Pago, Conclusiones, Inventario |
| **Penal** | Infracciones a la ley penal | Querella con Actor Civil, Solicitud de Coerción, Oposición a No Ha Lugar |
| **Laboral** | Conflictos derivados de relaciones de trabajo | Demanda Laboral, Citación Laboral, Conclusiones Laborales |
| **Administrativo** | Recursos contra actos de la administración pública | Demanda Contencioso-Administrativa, Amparo, Recurso de Anulación |
| **Inmobiliaria y Tierras** | Litigios sobre derechos de propiedad inmobiliaria | Litis sobre Derechos Registrados, Saneamiento, Deslinde |
| **Juzgado de Paz** | Litigios menores dentro de límites de competencia | Desalojo por Falta de Pago, Daños a Propiedad, Conciliación |
| **Municipal y Ambiental** | Recursos contra actos municipales y daños ambientales | Recurso Contencioso Municipal, Denuncia Ambiental |

### Actos Extrajudiciales

| Categoría | Descripción | Actos Principales |
|-----------|-------------|-------------------|
| **Contratos Civiles** | Acuerdos de voluntades entre particulares | Compraventa, Alquiler, Arrendamiento, Comodato |
| **Actos Notariales** | Actos autenticados por notario público | Poder Especial, Declaración Jurada, Acta de Notoriedad |
| **Intimaciones** | Notificaciones extrajudiciales | Intimación de Pago, Notificación de Incumplimiento |
| **Gestión Laboral** | Actos privados relacionados con el trabajo | Contrato de Trabajo, Carta de Despido, Carta de Renuncia |
| **Gestión Administrativa** | Solicitudes a la administración pública | Solicitud Administrativa, Recurso de Reconsideración |

---

## Sistema de Verificación y Control de Calidad

Para garantizar que los actos generados sean procesalmente impecables, se ha desarrollado un sistema de verificación en tres niveles:

### Nivel 1: Verificación Automática

El sistema debe ejecutar automáticamente un checklist de verificación inmediatamente después de generar un acto. Este checklist está basado en los criterios establecidos en cada mandato.

**Ejemplo de Verificación Automática para Emplazamiento:**
```javascript
function verificarEmplazamiento(actoGenerado) {
  const errores = [];
  
  if (actoGenerado.includes("RELATO FÁCTICO")) {
    errores.push("ERROR CRÍTICO: Emplazamiento contiene Relato Fáctico");
  }
  
  if (actoGenerado.includes("FUNDAMENTOS DE DERECHO")) {
    errores.push("ERROR CRÍTICO: Emplazamiento contiene Fundamentos de Derecho");
  }
  
  if (!actoGenerado.includes("CITA Y EMPLAZA")) {
    errores.push("ERROR: Falta la fórmula de citación");
  }
  
  if (!actoGenerado.includes("octava")) {
    errores.push("ADVERTENCIA: No se menciona el plazo de la octava");
  }
  
  return { esValido: errores.length === 0, errores };
}
```

### Nivel 2: Revisión del Usuario

El usuario debe revisar el acto generado antes de aprobarlo. El sistema debe proporcionar una vista previa clara y resaltar las secciones clave.

### Nivel 3: Auditoría Post-Generación

Se recomienda establecer un sistema de auditoría donde un abogado senior revise periódicamente una muestra de los actos generados para identificar patrones de error y refinar los mandatos.

---

## Guía de Implementación Técnica

Para implementar este sistema en la plataforma Lovable, se recomienda seguir estos pasos:

### Paso 1: Reorganización de la Base de Datos

**Crear tabla de Modelos:**
```sql
CREATE TABLE modelos_actos (
  id INT PRIMARY KEY,
  nombre VARCHAR(255),
  tipo ENUM('judicial', 'extrajudicial'),
  materia VARCHAR(100),
  archivo_modelo TEXT,
  archivo_mandato TEXT,
  inputs_requeridos JSON
);
```

**Crear tabla de Materias:**
```sql
CREATE TABLE materias (
  id INT PRIMARY KEY,
  nombre VARCHAR(100),
  tipo ENUM('judicial', 'extrajudicial'),
  descripcion TEXT,
  orden INT
);
```

### Paso 2: Implementación del Motor de Generación con IA

**Integrar un LLM (ej: GPT-4) con los mandatos como prompts:**
```javascript
async function generarActo(tipoActo, inputs) {
  // 1. Cargar el mandato
  const mandato = await cargarMandato(tipoActo);
  
  // 2. Construir el prompt
  const prompt = `
    ${mandato.instrucciones}
    
    Genera un ${tipoActo} con los siguientes datos:
    ${JSON.stringify(inputs, null, 2)}
    
    Asegúrate de seguir exactamente la estructura del modelo y cumplir con todas las verificaciones del mandato.
  `;
  
  // 3. Llamar a la IA
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3 // Baja temperatura para mayor precisión
  });
  
  return response.choices[0].message.content;
}
```

### Paso 3: Implementación del Sistema de Verificación

**Crear funciones de verificación para cada tipo de acto:**
```javascript
const verificadores = {
  'emplazamiento': verificarEmplazamiento,
  'demanda': verificarDemanda,
  'contrato_compraventa': verificarContratoCompraventa,
  'conclusiones': verificarConclusiones,
  'inventario': verificarInventario,
  'querella': verificarQuerella
};

async function generarYVerificar(tipoActo, inputs) {
  const acto = await generarActo(tipoActo, inputs);
  const verificacion = verificadores[tipoActo](acto);
  
  if (!verificacion.esValido) {
    // Reintentar o solicitar corrección manual
    return { error: verificacion.errores, acto };
  }
  
  return { acto, validado: true };
}
```

### Paso 4: Implementación de Reconocimiento de Voz

**Agregar botones de dictado a los campos de texto:**
```javascript
function agregarDictado(campoId) {
  const campo = document.getElementById(campoId);
  const botonMicrofono = document.createElement('button');
  botonMicrofono.innerHTML = '🎤';
  botonMicrofono.onclick = () => activarDictado(campo);
  campo.parentNode.appendChild(botonMicrofono);
}

function activarDictado(campo) {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'es-DO';
  recognition.start();
  
  recognition.onresult = (event) => {
    campo.value = event.results[0][0].transcript;
  };
}
```

### Paso 5: Corrección del Módulo de Abogados

**Depurar la consulta y el componente de autofill:**
```javascript
async function cargarAbogados() {
  try {
    const response = await fetch('/api/abogados?activo=true');
    const abogados = await response.json();
    
    if (abogados.length === 0) {
      console.warn('No se encontraron abogados registrados');
      return [];
    }
    
    return abogados;
  } catch (error) {
    console.error('Error al cargar abogados:', error);
    return [];
  }
}

function autocompletarAbogado(abogado, formulario) {
  formulario.nombreAbogado.value = abogado.nombre;
  formulario.direccionAbogado.value = abogado.direccion;
  formulario.telefonoAbogado.value = abogado.telefono;
  formulario.emailAbogado.value = abogado.email;
  formulario.matriculaAbogado.value = abogado.matricula;
}
```

---

## Pruebas de Control de Calidad (QA)

Antes de considerar el sistema operativo, se deben ejecutar las siguientes pruebas:

### Prueba 1: Generación de Emplazamiento

**Objetivo:** Verificar que el emplazamiento generado NO contenga relato fáctico ni fundamentos de derecho.

**Procedimiento:**
1. Seleccionar "Emplazamiento" en el sistema.
2. Ingresar los inputs mínimos.
3. Generar el acto.
4. Verificar que el documento tenga menos de 2 páginas.
5. Buscar las palabras "RELATO FÁCTICO" o "FUNDAMENTOS DE DERECHO" en el documento.
6. **Resultado esperado:** No se encuentran estas secciones.

### Prueba 2: Clasificación de Materias

**Objetivo:** Verificar que Laboral y Administrativo estén en la categoría de Actos Judiciales.

**Procedimiento:**
1. Navegar al menú principal.
2. Seleccionar "Actos Judiciales".
3. Verificar que aparezcan las opciones "Laboral" y "Administrativo".
4. Seleccionar "Actos Extrajudiciales".
5. Verificar que Laboral y Administrativo NO aparezcan en esta categoría.
6. **Resultado esperado:** Clasificación correcta.

### Prueba 3: Autofill de Abogados

**Objetivo:** Verificar que el sistema reconozca los abogados registrados y autocomplete los campos.

**Procedimiento:**
1. Registrar un abogado de prueba en la base de datos.
2. Abrir un formulario de generación de acto.
3. Verificar que el selector de abogados muestre el abogado registrado.
4. Seleccionar el abogado.
5. Verificar que los campos se autocompletentan.
6. **Resultado esperado:** Autofill funciona correctamente.

### Prueba 4: Generación de Querella

**Objetivo:** Verificar que la querella generada sea un escrito de depósito, no un acto de alguacil.

**Procedimiento:**
1. Seleccionar "Querella Penal" en el sistema.
2. Ingresar los inputs.
3. Generar el acto.
4. Buscar las palabras "ALGUACIL", "TRASLADO" o "PROCESO VERBAL" en el documento.
5. **Resultado esperado:** No se encuentran estas palabras.
6. Verificar que el documento contenga las secciones "CALIFICACIÓN JURÍDICA" y "CONSTITUCIÓN EN ACTOR CIVIL".
7. **Resultado esperado:** Estas secciones están presentes.

### Prueba 5: Reconocimiento de Voz

**Objetivo:** Verificar que el dictado por voz funcione en los campos de texto.

**Procedimiento:**
1. Abrir un formulario de generación de acto.
2. Hacer clic en el botón de micrófono de un campo de texto.
3. Dictar un texto de prueba.
4. Verificar que el texto se transcribe correctamente en el campo.
5. **Resultado esperado:** El texto dictado aparece en el campo.

---

## Conclusión y Próximos Pasos

Este documento maestro integra todos los componentes desarrollados para reformular el sistema de generación de actos jurídicos. Los modelos, mandatos y sistemas de verificación proporcionan una base sólida para garantizar la generación de documentos procesalmente impecables.

### Logros del Sistema

El sistema desarrollado resuelve todos los problemas críticos identificados en el Prompt Maestro original. Se ha corregido la lógica procesal de los emplazamientos, se ha reorganizado la taxonomía de materias, se ha diferenciado correctamente la naturaleza de las querellas, y se han proporcionado soluciones técnicas para los bugs del módulo de abogados y la falta de funcionalidades de IA y voz.

### Próximos Pasos Recomendados

**Implementación Técnica:** Codificar las correcciones y mejoras propuestas en la plataforma Lovable siguiendo la guía de implementación técnica.

**Pruebas de QA:** Ejecutar todas las pruebas de control de calidad descritas en este documento para verificar que el sistema funcione correctamente.

**Capacitación de Usuarios:** Capacitar a los abogados y operadores del sistema en el uso de los nuevos modelos y funcionalidades.

**Monitoreo y Refinamiento:** Establecer un sistema de feedback continuo para identificar errores y refinar los mandatos con el tiempo.

**Expansión del Catálogo:** Desarrollar modelos y mandatos adicionales para otros tipos de actos jurídicos comunes en la práctica dominicana.

---

**Fin del Documento Maestro de Integración**
