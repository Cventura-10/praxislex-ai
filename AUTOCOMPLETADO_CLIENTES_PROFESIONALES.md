# Sistema de Autocompletado de Clientes y Profesionales

## 📋 Descripción

Sistema integrado en el módulo de Generación de Actos que permite autocompletar información de clientes y profesionales desde la base de datos, evitando la entrada manual repetitiva de datos.

## ✨ Características Implementadas

### 1. **Autocompletado de Clientes**

#### Búsqueda por Cédula
- Campo de búsqueda rápida por número de cédula
- Busca en la base de datos encriptada de clientes
- Autocompleta todos los datos del cliente instantáneamente

#### Selector de Cliente Existente
- Dropdown con lista de todos los clientes registrados
- Muestra nombre completo y cédula (enmascarada por seguridad)
- Al seleccionar, autocompleta:
  - Nombre completo
  - Cédula/RNC
  - Domicilio
  - Nacionalidad
  - Estado civil
  - Profesión
  - Email
  - Teléfono

#### Entrada Manual
- Opción "Ingresar datos manualmente" disponible siempre
- Permite crear actos para clientes no registrados

### 2. **Autocompletado de Profesionales**

Ya estaba implementado pero mejorado:

#### Abogados
- Selector en el primer paso del formulario
- Autocompleta: nombre, cédula, matrícula CARD, despacho, email, teléfono

#### Notarios
- Selector para actos notariales/extrajudiciales
- Autocompleta: nombre, cédula, matrícula CDN, oficina, jurisdicción

#### Alguaciles
- Para actos de notificación judicial
- Autocompleta: nombre, cédula, matrícula, jurisdicción

#### Peritos y Tasadores
- Para actos que requieren evaluación técnica
- Autocompleta: nombre, especialidad, matrícula, institución

## 🎯 Casos de Uso

### Actos Judiciales
1. **Demandante**: Se presenta selector de cliente al inicio
2. **Demandado**: Selector adicional para la contraparte
3. **Abogado**: Selector de abogado responsable (opcional)
4. Los campos se autocompletan automáticamente
5. Usuario puede editar cualquier campo si necesita ajustes

### Actos Extrajudiciales
1. **Primera Parte**: Selector de cliente (ej: vendedor, arrendador)
2. **Segunda Parte**: Selector de cliente (ej: comprador, arrendatario)
3. **Notario**: Selector para certificación notarial
4. Todos los campos se llenan automáticamente

## 🔐 Seguridad

- **Datos Encriptados**: Las cédulas se almacenan encriptadas en la base de datos
- **RLS Policies**: Solo el usuario propietario puede ver sus clientes
- **Rate Limiting**: La función `reveal_client_pii` tiene límite de acceso
- **Enmascaramiento**: Los datos sensibles se muestran enmascarados en listas
- **Auditoría**: Todos los accesos a PII se registran en `data_access_audit`

## 💡 Ventajas

1. ✅ **Ahorro de Tiempo**: No repetir datos ya ingresados
2. ✅ **Menos Errores**: Datos consistentes en todos los documentos
3. ✅ **Experiencia Profesional**: Sistema moderno y eficiente
4. ✅ **Cumplimiento**: Manejo seguro de información personal
5. ✅ **Flexibilidad**: Siempre permite entrada manual cuando se necesita

## 📊 Flujo de Trabajo

```
1. Usuario navega a Generador de Actos
2. Selecciona materia y tipo de acto
3. En el formulario aparecen selectores de cliente/profesional
4. Opciones disponibles:
   a) Buscar por cédula → Enter → Datos autocompletados
   b) Seleccionar de dropdown → Datos autocompletados
   c) "Ingresar manualmente" → Campos vacíos para llenar
5. Campos autocompletados son editables
6. Continuar con el resto del formulario
7. Generar documento
```

## 🔧 Componentes Técnicos

### Hooks Creados
- `useClients()`: Gestión de clientes con búsqueda y reveal
- Profesionales ya existían: `useLawyers()`, `useNotarios()`, etc.

### Componentes Nuevos
- `ClientSelector.tsx`: Selector reutilizable de clientes
- Ya existían: `ProfessionalSelectors.tsx` (abogados, notarios, etc.)

### Funciones de Base de Datos Utilizadas
- `get_clients_masked`: Lista clientes con datos enmascarados
- `reveal_client_pii`: Revela datos completos con rate limiting
- `encrypt_cedula`: Encripta cédulas antes de guardar

## 🎨 Interfaz de Usuario

### Indicadores Visuales
- 🔍 Icono de búsqueda para búsqueda por cédula
- ✓ Checkmark verde cuando datos se autocompletan
- 💡 Tooltips explicativos
- 🔒 Badge de "Autocompletado desde cliente" en campos

### Feedback al Usuario
- Toast de confirmación cuando se carga un cliente
- Toast de error si no se encuentra la cédula
- Indicador visual de campos autocompletados
- Placeholder "Ingrese manualmente o seleccione cliente arriba"

## 📝 Ejemplo de Uso

### Crear Demanda en Cobro de Pesos

1. Ir a **Generador de Actos** → **Civil** → **Demanda en Cobro de Pesos**
2. En "Demandante":
   - Opción A: Escribir cédula `001-1234567-8` y presionar Enter
   - Opción B: Seleccionar "Juan Pérez" del dropdown
   - ✓ Se llenan: nombre, cédula, domicilio, email, teléfono
3. En "Demandado":
   - Buscar por cédula o seleccionar de lista
   - ✓ Se llenan todos los campos
4. En "Abogado":
   - Seleccionar tu perfil de abogado
   - ✓ Se llenan: nombre, matrícula, cédula, despacho
5. Completar: tribunal, hechos, pretensiones
6. **Generar Documento** → Todo listo en minutos

## 🚀 Próximas Mejoras

- [ ] Crear cliente nuevo desde el mismo formulario
- [ ] Búsqueda por nombre (además de cédula)
- [ ] Historial de documentos generados por cliente
- [ ] Templates predefinidos por tipo de cliente
- [ ] Importación masiva de clientes desde Excel

## ❓ Resolución de Problemas

### "Cliente no encontrado"
- Verifica que la cédula esté correctamente ingresada
- Verifica que el cliente exista en tu módulo de Clientes
- Si no existe, usa la opción "Ingresar manualmente"

### "No se pueden cargar los datos"
- Verifica tu conexión a internet
- Revisa que tengas permisos sobre ese cliente
- Contacta soporte si el error persiste

### Campos no se llenan automáticamente
- Asegúrate de seleccionar un cliente de la lista
- Si usas búsqueda por cédula, presiona Enter o click en buscar
- Algunos campos opcionales pueden estar vacíos en el cliente

---

**Versión**: 1.0  
**Fecha**: 31 de octubre de 2025  
**Desarrollado para**: PraxisLex Sistema de Gestión Jurídica
