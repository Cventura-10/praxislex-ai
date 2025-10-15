# Índice del Sistema de Modelos y Mandatos de Actos Jurídicos

**Autor:** Manus AI  
**Fecha:** 15 de octubre de 2025  
**Versión:** 1.0

---

## Descripción General

Este sistema proporciona una solución integral para la generación automatizada de actos jurídicos procesalmente impecables, adaptados a la legislación dominicana. El sistema está compuesto por modelos estructurados, mandatos de corrección y sistemas de verificación que trabajan de manera integrada.

---

## Estructura de Archivos

### 📁 Carpeta: `modelos_actos_juridicos/`

Contiene las plantillas maestras de cada tipo de acto jurídico:

1. **`modelo_acto_de_traslado_demanda.md`**
   - Tipo: Acto Judicial
   - Descripción: Demanda formal que funciona como acto de emplazamiento
   - Basado en: DEMANDAENDEVOLUCIONVALORES.pdf
   - Uso: Demandas civiles, comerciales, laborales

2. **`modelo_emplazamiento.md`**
   - Tipo: Acto Judicial
   - Descripción: Acto de notificación pura para citar a comparecer
   - Uso: Citaciones para audiencias
   - ⚠️ **Importante:** NO contiene relato fáctico ni fundamentos de derecho

3. **`modelo_contrato_compraventa.md`**
   - Tipo: Acto Extrajudicial
   - Descripción: Contrato privado de compraventa inmobiliaria
   - Basado en: CONTRATODECOMPRAVENTAINMOBILIARIAB05(1).docx
   - Uso: Compraventa de inmuebles

4. **`modelo_escrito_conclusiones.md`**
   - Tipo: Acto Judicial (Escrito Vario)
   - Descripción: Escrito para presentar conclusiones en un proceso
   - Uso: Conclusiones de demandante o demandado

5. **`modelo_inventario_documentos.md`**
   - Tipo: Acto Judicial (Diligencia)
   - Descripción: Escrito de mero trámite para depositar documentos
   - Uso: Depósito de pruebas documentales

6. **`modelo_querella_penal.md`**
   - Tipo: Acto Judicial (Penal)
   - Descripción: Querella con constitución en actor civil
   - Uso: Acusaciones penales con reclamación civil
   - ⚠️ **Importante:** NO es un acto de alguacil, es un escrito de depósito

---

### 📁 Carpeta: `mandatos_correccion/`

Contiene las instrucciones detalladas para generar y corregir cada tipo de acto:

1. **`mandato_acto_de_traslado_demanda.md`**
   - Corrige: Estructura dual demanda-emplazamiento
   - Verifica: Plazo de la octava, elección de domicilio, petitorio en negrilla

2. **`mandato_emplazamiento.md`**
   - Corrige: **ERROR CRÍTICO** - Eliminación de contenido de fondo
   - Verifica: Que NO contenga relato fáctico ni fundamentos de derecho

3. **`mandato_contrato_compraventa.md`**
   - Corrige: Terminología contractual (no procesal)
   - Verifica: Descripción del inmueble, precio, certificación notarial

4. **`mandato_escrito_conclusiones.md`**
   - Corrige: Coherencia entre relato, fundamentos y petitorio
   - Verifica: Encabezado completo, fórmula sacramental de cierre

5. **`mandato_inventario_documentos.md`**
   - Corrige: Descripciones vagas de documentos
   - Verifica: Listado secuencial, descripción completa (tipo, fecha, instrumentador)

6. **`mandato_querella_penal.md`**
   - Corrige: **ERROR CRÍTICO** - Naturaleza de la querella (no es acto de alguacil)
   - Verifica: Terminología penal, calificación jurídica, pruebas

---

### 📄 Documentos de Soporte

1. **`verificacion_mandatos.md`**
   - Contenido: Matriz de validación de todos los mandatos
   - Uso: Control de calidad del sistema
   - Incluye: Checklists de verificación rápida para cada tipo de acto

2. **`aplicacion_practica_mandatos.md`**
   - Contenido: Análisis de los problemas del sistema actual y soluciones propuestas
   - Uso: Guía para implementar las correcciones en Lovable
   - Incluye: Taxonomía corregida, correcciones técnicas, código de ejemplo

3. **`documento_maestro_integracion.md`**
   - Contenido: Documento maestro que integra todos los componentes
   - Uso: Guía completa del sistema
   - Incluye: Arquitectura, catálogo completo, guía de implementación técnica, pruebas de QA

---

## Guía de Uso Rápido

### Para Desarrolladores de Lovable:

1. **Leer primero:** `documento_maestro_integracion.md` para entender la arquitectura completa.
2. **Implementar correcciones:** Seguir la sección "Guía de Implementación Técnica".
3. **Ejecutar pruebas:** Seguir la sección "Pruebas de Control de Calidad (QA)".

### Para Usuarios del Sistema:

1. **Seleccionar tipo de acto:** Navegar por la taxonomía corregida (Judicial/Extrajudicial → Materia → Acto).
2. **Ingresar datos:** Completar los inputs solicitados (manual o por voz).
3. **Generar acto:** El sistema aplicará automáticamente el modelo y mandato correspondiente.
4. **Revisar y aprobar:** Verificar el documento generado antes de su uso.

### Para Auditores de Calidad:

1. **Consultar checklists:** Usar los checklists en `verificacion_mandatos.md` (Anexo).
2. **Verificar actos generados:** Aplicar el checklist correspondiente a cada tipo de acto.
3. **Reportar errores:** Documentar cualquier desviación del modelo para refinar los mandatos.

---

## Problemas Críticos Resueltos

✅ **Emplazamientos con estructura de demanda:** Mandato específico que elimina contenido de fondo.

✅ **Clasificación incorrecta de materias:** Taxonomía corregida con Laboral y Administrativo en categoría judicial.

✅ **Querellas como actos de alguacil:** Mandato que establece la naturaleza de escrito de depósito.

✅ **Bug del módulo de abogados:** Solución técnica para corregir el autofill.

✅ **Falta de generación con IA:** Arquitectura propuesta para integrar LLM con mandatos.

✅ **Falta de reconocimiento de voz:** Código de ejemplo para implementar Web Speech API.

---

## Taxonomía Corregida (Resumen)

### Actos Judiciales:
- Civil y Comercial
- Penal
- Laboral ⚠️ **MOVIDO desde Extrajudicial**
- Administrativo ⚠️ **MOVIDO desde Extrajudicial**
- Inmobiliaria y Tierras **NUEVO**
- Juzgado de Paz **NUEVO**
- Municipal y Ambiental **NUEVO**

### Actos Extrajudiciales:
- Contratos Civiles
- Actos Notariales
- Intimaciones
- Gestión Laboral (solo actos privados)
- Gestión Administrativa (solo actos privados)

---

## Contacto y Soporte

Para preguntas o soporte sobre el uso de este sistema, consultar el `documento_maestro_integracion.md` o contactar al equipo de desarrollo de Lovable.

---

**Versión del Sistema:** 1.0  
**Última Actualización:** 15 de octubre de 2025  
**Desarrollado por:** Manus AI
