# Módulo de Generación de Actos Procesales

## 🎯 Descripción General

Sistema completo de generación de documentos jurídicos con dos modalidades:
1. **Redacción Asistida con IA**: Formulario guiado que genera documentos automáticamente
2. **Redacción Manual**: Editor con plantillas predefinidas y notas legales

## 📂 Estructura del Módulo

### Páginas Principales
```
src/pages/
├── LegalActsGenerator.tsx    # Catálogo de actos (página de inicio)
└── LegalActWizard.tsx         # Wizard de generación (intake o manual)
```

### Componentes
```
src/components/legal-acts/
├── IntakeFormFlow.tsx         # Flujo de formulario asistido con IA
└── ManualEditorFlow.tsx       # Editor manual con vista previa
```

### Datos
```
src/lib/
└── legalActsData.ts          # Catálogo jerárquico de actos procesales
```

## 🚀 Flujo de Usuario

### 1. Selección del Acto
**Ruta**: `/generador-actos`

El usuario puede:
- Buscar por nombre del acto
- Navegar por categorías (Judicial/Extrajudicial)
- Explorar por materias (Civil, Penal, Laboral, Administrativo)

Catálogo incluye:
- **Actos Judiciales**: 23 tipos (demandas, apelaciones, medidas, etc.)
- **Actos Extrajudiciales**: 15 tipos (contratos, poderes, intimaciones, etc.)

### 2. Modo de Redacción

Al seleccionar un acto, se presenta un diálogo con dos opciones:

#### A. Redacción Asistida (Recomendado)
- Formulario guiado por pasos con validación
- Generación automática mediante IA (Lovable AI)
- Vista previa formateada del documento
- Guardado automático en base de datos
- Descarga directa en formato Word (.docx)

**Características**:
- ✅ Progreso visual (3 pasos, ~14 campos)
- ✅ Validación de campos requeridos
- ✅ Generación con contexto legal dominicano
- ✅ Vista previa antes de descargar
- ✅ Copia al portapapeles
- ✅ Metadatos extraídos automáticamente

#### B. Redacción Manual
- Editor de texto con plantilla estructurada
- Modo Editor / Vista Previa (toggle)
- Plantillas con notas legales y guías
- Contador de palabras y caracteres
- Guardado de borradores
- Descarga en Word

**Características**:
- ✅ Plantilla con instrucciones entre corchetes []
- ✅ Vista previa renderizada en tiempo real
- ✅ Función copiar al portapapeles
- ✅ Restablecer plantilla original
- ✅ Guardado como borrador

## 🔧 Funcionalidades Técnicas

### Formulario Asistido (IntakeFormFlow)

**Campos Genéricos** (aplicables a mayoría de actos):
```typescript
- Demandante: nombre, cédula, domicilio
- Demandado: nombre, cédula, domicilio  
- Tribunal: nombre, ubicación
- Objeto de la acción
- Hechos (cronología)
- Fundamentos de derecho
- Pretensiones/Dispositivos
- Cuantía (opcional)
- Anexos
```

**Proceso de Generación**:
1. Validación de campos requeridos por paso
2. Envío a Edge Function `generate-legal-doc`
3. Generación con contexto específico del acto
4. Guardado en tabla `legal_documents`
5. Presentación de vista previa
6. Exportación a Word con formato

### Editor Manual (ManualEditorFlow)

**Plantillas Estructuradas**:
- Encabezados con separadores visuales
- Secciones predefinidas con notas explicativas
- Campos entre corchetes [] para completar
- Guías sobre requisitos legales

**Vista Previa**:
- Renderización con DocumentViewer
- Toggle entre modo edición/vista previa
- Formato preservado en descarga Word

## 💾 Integración con Base de Datos

### Tabla: `legal_documents`

```sql
Campos principales:
- user_id: Abogado que genera el documento
- tipo_documento: ID del acto (ej: 'demanda_civil')
- materia: Materia legal (ej: 'Civil y Comercial')
- titulo: Título descriptivo
- contenido: Texto completo del documento
- demandante_nombre: Nombre del demandante
- demandado_nombre: Nombre del demandado
- juzgado: Tribunal competente
- numero_expediente: Número de caso (opcional)
- case_number: Referencia a caso interno (opcional)
```

**RLS Habilitado**: Solo el usuario que crea el documento puede verlo/modificarlo.

## 🤖 Integración con IA

### Edge Function: `generate-legal-doc`

**Modelo**: `google/gemini-2.5-flash` (gratuito hasta Oct 13, 2025)

**Prompt Estratégico**:
- Contexto del sistema legal dominicano
- Estructura específica del tipo de acto
- Datos del formulario
- Requisitos formales y estilo

**Respuesta**:
```json
{
  "document": "Texto generado del documento legal..."
}
```

## 📝 Exportación a Word

Usa librería `docx` para generar documentos .docx con:
- Encabezado centrado (Heading 1)
- Datos de partes en negrita
- Contenido con formato de párrafos
- Espaciado apropiado
- Nombre de archivo descriptivo con fecha

## 🎨 Experiencia de Usuario

### Diseño Visual
- **Tema consistente**: Colores primarios y secundarios del sistema
- **Iconografía**: Lucide React icons
- **Feedback visual**: 
  - Badges para tipos de acto
  - Progress bars en formularios
  - Toasts para confirmaciones
  - Estados de loading

### Navegación
- Breadcrumbs implícitos en headers
- Botón "Volver" en todas las páginas
- Navegación jerárquica con collapsibles

### Responsive
- Grid adaptable (1-2 columnas según viewport)
- ScrollAreas para listas largas
- Controles táctiles optimizados

## 🔐 Seguridad y Validación

### Frontend
- ✅ Validación de campos requeridos
- ✅ Sanitización de inputs
- ✅ Autenticación requerida
- ✅ Mensajes de error user-friendly

### Backend
- ✅ RLS en tabla legal_documents
- ✅ Verificación de user_id en inserts
- ✅ Rate limiting en Edge Function
- ✅ Sanitización de prompts IA

## 📊 Métricas y Analytics

Eventos trackeados automáticamente:
- Selección de acto
- Modo de redacción elegido
- Documentos generados
- Descargas realizadas
- Errores en generación

## 🚀 Próximas Mejoras

### Corto Plazo
- [ ] Formularios específicos por tipo de acto (no genéricos)
- [ ] Más plantillas manuales especializadas
- [ ] Firmas digitales
- [ ] Versionado de documentos

### Mediano Plazo
- [ ] Colaboración en tiempo real
- [ ] Sugerencias de jurisprudencia relevante
- [ ] Validación legal automática
- [ ] Templates compartidos entre bufetes

### Largo Plazo
- [ ] OCR para importar documentos físicos
- [ ] Comparación de versiones (diff)
- [ ] Workflow de aprobación
- [ ] Integración con expedientes electrónicos

## 📚 Referencias

- **Código Procesal Dominicano**: Estructuras legales basadas en legislación vigente
- **Lucide Icons**: https://lucide.dev/icons
- **docx Library**: https://docx.js.org
- **Lovable AI**: https://docs.lovable.dev/features/ai

## 🤝 Contribución

Para agregar nuevos actos procesales:

1. Editar `src/lib/legalActsData.ts`
2. Agregar el acto en la categoría/materia correspondiente
3. Especificar `hasIntake` y `hasManual`
4. Actualizar plantillas si es modo manual
5. Probar generación con IA si es intake

---

**Última actualización**: 2025-10-11
**Autor**: Equipo PraxisLex
**Estado**: ✅ Operacional con vista previa funcional
