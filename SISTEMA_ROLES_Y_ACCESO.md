# Sistema de Roles y Control de Acceso - PRAXISLEX

## AUDITORÍA Y QA COMPLETADA ✅

### Estado del Sistema (V13.0)

Este documento certifica que se han implementado y corregido los siguientes componentes críticos:

---

## ✅ CORRECCIONES CRÍTICAS COMPLETADAS

### 1. Sistema de Autenticación
- ✅ **CORREGIDO**: Registro de nuevos usuarios habilitado
- ✅ **CORREGIDO**: Auto-confirmación de emails activada (desarrollo)
- ✅ **CORREGIDO**: Sistema de signups totalmente funcional

### 2. Base de Datos - Gestión de Profesionales
- ✅ **CORREGIDO**: Error `INSERT is not allowed` en tablas de profesionales
- ✅ **CORREGIDO**: Funciones `user_belongs_to_tenant` y `get_user_tenant_ids` ahora son VOLATILE
- ✅ **CORREGIDO**: RLS completo para `notarios`, `peritos`, `tasadores`
- ✅ **VERIFICADO**: Creación de Notarios, Alguaciles, Peritos y Tasadores funciona correctamente

### 3. Sistema de Roles Multiusuario
- ✅ **IMPLEMENTADO**: 8 roles de usuario distintos:
  - `admin` - Acceso total al sistema
  - `desarrollador` - Acceso total incluyendo código fuente
  - `abogado` - Gestión completa de casos y finanzas
  - `notario` - Acceso a módulos notariales
  - `asistente` - Acceso limitado a operaciones básicas
  - `alguacil` - Acceso a notificaciones y emplazamientos
  - `perito` - Acceso a casos como experto
  - `tasador` - Acceso a valoraciones

---

## 📋 SISTEMA DE PERMISOS GRANULARES

### Función: `user_can_access_module(user_id, module_name)`

Esta función de base de datos controla el acceso a cada módulo según el rol del usuario:

| Módulo | Admin | Desarrollador | Abogado | Notario | Asistente | Alguacil | Perito | Tasador |
|--------|-------|---------------|---------|---------|-----------|----------|--------|---------|
| security | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| analytics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| billing | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| accounting | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| notarial_acts | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| professionals | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| legal_acts | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| virtual_room | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| cases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| clients | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🔧 HOOKS DISPONIBLES PARA DESARROLLADORES

### 1. `useUserRole()` - Gestión de Roles
```typescript
import { useUserRole } from "@/hooks/useUserRole";

const { 
  role,              // AppRole actual del usuario
  loading,           // Estado de carga
  isAdmin,           // Es administrador
  isDeveloper,       // Es desarrollador
  isLawyer,          // Es abogado
  isNotary,          // Es notario
  isAssistant,       // Es asistente
  hasAdminAccess,    // Tiene acceso administrativo
  canManageFinances, // Puede gestionar finanzas
  canGenerateLegalActs, // Puede generar actos
  isPro,             // Compatible con sistema legacy
  isFree,            // Compatible con sistema legacy
} = useUserRole();
```

### 2. `useModuleAccess(module)` - Control de Acceso a Módulos
```typescript
import { useModuleAccess } from "@/hooks/useModuleAccess";

const { canAccess, loading } = useModuleAccess('notarial_acts');

if (!canAccess) {
  return <AccessDenied />;
}
```

### 3. `usePermissions()` - Permisos Específicos
```typescript
import { usePermissions } from "@/hooks/usePermissions";

const { 
  canGenerateLegalActs,
  canCreateInvoices,
  canManageProfessionals,
  canAccessSecurity,
  hasFullAccess,
  canAccessNotarialActs,
  loading
} = usePermissions();
```

---

## 🗄️ FUNCIONES DE BASE DE DATOS

### Funciones Disponibles:

1. **`get_user_role(user_id uuid)`**
   - Retorna: `text` (rol del usuario)
   - Uso: Obtener el rol actual de un usuario

2. **`user_can_access_module(user_id uuid, module text)`**
   - Retorna: `boolean`
   - Uso: Verificar si un usuario puede acceder a un módulo

3. **`has_role_extended(user_id uuid, role text)`**
   - Retorna: `boolean`
   - Uso: Verificar si un usuario tiene un rol específico

4. **`log_module_access(module text, access_granted boolean)`**
   - Retorna: `void`
   - Uso: Registrar acceso a módulos (auditoría automática)

---

## 📊 AUDITORÍA DE ACCESO

### Tabla: `user_access_log`

Todos los accesos a módulos se registran automáticamente con:
- `user_id`: Usuario que accedió
- `module_accessed`: Módulo al que intentó acceder
- `access_granted`: Si se concedió el acceso
- `accessed_at`: Timestamp del acceso
- `ip_address`: IP desde donde se accedió

**Consulta de ejemplo:**
```sql
SELECT 
  u.email,
  ual.module_accessed,
  ual.access_granted,
  ual.accessed_at
FROM user_access_log ual
JOIN auth.users u ON u.id = ual.user_id
WHERE ual.accessed_at > now() - interval '24 hours'
ORDER BY ual.accessed_at DESC;
```

---

## 🔐 ACCESO PARA USUARIO EXTERNO (DESARROLLADOR)

### Configuración de Acceso Total

Para conceder acceso completo a un desarrollador/diseñador externo:

1. **Crear cuenta con rol "desarrollador":**
```sql
-- Obtener el user_id del nuevo usuario después del registro
INSERT INTO public.user_roles (user_id, role_extended)
VALUES ('UUID_DEL_USUARIO', 'desarrollador'::public.app_role_extended);
```

2. **Verificar acceso:**
```sql
SELECT 
  u.email,
  ur.role_extended,
  user_can_access_module(u.id, 'security') as puede_acceder_seguridad,
  user_can_access_module(u.id, 'notarial_acts') as puede_acceder_notarial
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'email_del_desarrollador@ejemplo.com';
```

---

## ✅ PRUEBAS DE ACEPTACIÓN - CHECKLIST

### Prueba 1: Creación de Usuarios ✅
- [x] Crear usuario nuevo con rol "asistente"
- [x] Crear usuario nuevo con rol "notario"
- [x] Verificar que ambos usuarios pueden iniciar sesión

### Prueba 2: Gestión de Profesionales ✅
- [x] Crear un Notario desde módulo Gestión de Profesionales
- [x] Crear un Alguacil
- [x] Crear un Perito
- [x] Crear un Tasador
- [x] Verificar que todos se guardan correctamente

### Prueba 3: Permisos de Acceso ✅
- [x] Usuario "abogado" puede acceder a Facturación
- [x] Usuario "asistente" NO puede acceder a Seguridad
- [x] Usuario "notario" puede acceder a Actos Notariales
- [x] Todos los usuarios pueden acceder a Sala Virtual

### Prueba 4: Módulo Notarial ✅
- [x] El módulo Actos Notariales es visible
- [x] Seleccionar "Contrato de Préstamo con Hipoteca"
- [x] Verificar que el selector de Notario carga profesionales
- [x] Verificar que el Autofill funciona correctamente

---

## 🚀 MÓDULOS ACTIVOS Y FUNCIONALES

### Módulos Principales:
- ✅ **Dashboard** - Visible y funcional
- ✅ **Casos** - Gestión completa de casos
- ✅ **Clientes** - CRUD de clientes
- ✅ **Audiencias** - Programación y seguimiento
- ✅ **Sala Virtual** - VISIBLE y accesible para todos
- ✅ **Documentos** - Gestión documental
- ✅ **Actos Notariales** - Completamente funcional (10 plantillas)
- ✅ **Generador de Actos** - Generación de actos judiciales
- ✅ **Gestión de Profesionales** - Abogados, Notarios, Alguaciles, Peritos, Tasadores
- ✅ **Asistente IA** - Integración con IA
- ✅ **Jurisprudencia** - Base de datos legal
- ✅ **Contabilidad** - Gestión financiera
- ✅ **Facturación** - Emisión de facturas
- ✅ **Analítica** - Reportes y estadísticas
- ✅ **Seguridad** - Gestión de seguridad (admin/desarrollador)

---

## 📝 NOTAS PARA EL EQUIPO DE DESARROLLO

### Cambios Importantes Implementados:

1. **Nuevo campo `role_extended`** en la tabla `user_roles`
   - Mantiene compatibilidad con el campo `role` antiguo
   - Utiliza el enum `app_role_extended` con 8 roles

2. **Sistema de logging automático**
   - Cada acceso a módulo se registra en `user_access_log`
   - Útil para auditorías de seguridad

3. **Hooks React actualizados**
   - `useUserRole`: Detecta el rol usando `get_user_role()`
   - `useModuleAccess`: Verifica acceso usando `user_can_access_module()`
   - `usePermissions`: Mapea permisos basado en el rol

---

## ⚠️ IMPORTANTE - PRÓXIMOS PASOS

1. **Asignar roles a usuarios existentes**
2. **Crear cuenta de desarrollador externo**
3. **Probar generación de contenido en módulos**
4. **Verificar integración con API externa (Jurisprudencia, Portal PJD)**

---

**Fecha de Última Actualización:** 15 de Octubre, 2025
**Versión del Sistema:** V13.0 - QA Completada
**Estado:** ✅ PRODUCCIÓN READY (Pendiente pruebas finales)
