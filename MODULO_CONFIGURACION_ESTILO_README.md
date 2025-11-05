# Módulo: Configuración de Estilo (Aprendizaje desde Documentos)

## 📋 Propósito

Este módulo permite que los usuarios suban hasta 15 documentos legales/contractuales y el sistema aprende automáticamente el estilo de redacción y formato para replicarlo en futuros documentos generados.

## 🎯 Características

- **Carga de documentos**: Soporta PDF, DOCX, RTF, ODT, HTML, TXT, imágenes (con OCR automático)
- **Análisis inteligente**: Extrae tipografía, estructura, cláusulas, variables, léxico y tono
- **Variables detectadas**: Identifica campos dinámicos como nombres, cédulas, RNC, montos, fechas
- **Cláusulas reutilizables**: Detecta fragmentos de texto recurrentes
- **Perfiles publicables**: Guarda configuraciones de estilo versionadas
- **Integración transparente**: El generador de documentos consume el perfil activo automáticamente

## 🗄️ Base de Datos

### Tablas Principales

1. **doc_learning_uploads**: Archivos subidos (queued/processed/failed)
2. **doc_learning_runs**: Ejecuciones de análisis con métricas
3. **doc_learning_variables**: Variables detectadas con patrones y ejemplos
4. **doc_learning_clauses**: Cláusulas frecuentes con hash de deduplicación
5. **style_profiles**: Perfiles publicados (versionados, uno activo por tenant)

### Storage

- **legal-source-docs**: Bucket privado (20MB límite, tipos permitidos configurados)

## 🔌 Edge Functions

1. **doc-learning-upload**: Registra archivos subidos
2. **doc-learning-analyze**: Procesa documentos y extrae características
3. **doc-learning-publish**: Crea perfil de estilo versionado
4. **integration-style-profile**: Endpoint de SOLO LECTURA para el generador

## 🚀 Flujo de Uso

1. **Cargar**: Subir hasta 15 documentos → `/configuracion/estilo` (tab Cargar)
2. **Analizar**: Ejecutar análisis → ver métricas en tab Análisis
3. **Revisar**: Editar variables/cláusulas → tab Variables & Cláusulas
4. **Publicar**: Crear perfil activo → tab Perfil & Publicación
5. **Usar**: El generador consume automáticamente el perfil activo

## 🔗 Integración con Generador

El módulo de generación de documentos puede consultar:

```typescript
GET /integration/generation/style-profile/current
```

Respuesta incluye:
- `layout_json`: Tipografía, márgenes, estilos
- `lexicon_json`: Formalidad, conectores, formato de moneda/fechas
- `clause_library_json`: Cláusulas canónicas
- `variable_map_json`: Variables con patrones y ejemplos

## 🛡️ Seguridad

- RLS multi-tenant en todas las tablas
- Políticas de storage por usuario
- Opción de eliminar originales post-análisis
- Validación completa con Zod en edge functions

## 📊 Datos Extraídos

- **Estilo**: Fuentes, tamaños, interlineado, márgenes, alineación
- **Estructura**: Secciones, encabezados, formato de firmas
- **Cláusulas**: Fragmentos recurrentes con frecuencia y confianza
- **Variables**: Patrones regex para cédulas RD, RNC, montos, fechas, direcciones
- **Léxico**: Formalidad, persona gramatical, frases comunes

## 🎨 Componentes UI

- `CargarTab`: Dropzone con validaciones
- `AnalisisTab`: KPIs, métricas, resumen de estilo
- `VariablesClausulasTab`: Tablas editables con búsqueda
- `PerfilPublicacionTab`: Vista previa y botón publicar
- `HistorialTab`: Runs y versiones de perfiles

## 📝 Notas Técnicas

- Análisis simulado en v1 (en producción usar OCR real, NLP)
- Formato de moneda: RD$ con opción de duplicar en letras
- Formato de fecha: "a los _ días del mes de ___ del año __"
- Timezone: America/Santo_Domingo
- Idioma: Español RD
