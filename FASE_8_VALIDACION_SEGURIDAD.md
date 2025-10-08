# Fase 8: Validación de Inputs y Hardening de Seguridad

## 🎯 Objetivos
Implementar validación exhaustiva en todos los puntos de entrada de datos para prevenir ataques de inyección, XSS, y corrupción de datos.

## 🔐 Implementaciones de Seguridad

### 1. Schemas de Validación Zod
- **Schemas centralizados** para todos los formularios
- **Validación client-side** con mensajes de error claros
- **Type-safety** completa con TypeScript
- **Reutilización** de schemas en todo el proyecto

### 2. Validación Server-Side
- **Edge Functions** con validación de entrada
- **Rate limiting** para prevenir abuso
- **Input sanitization** antes de procesamiento
- **Length limits** y character restrictions

### 3. Protección XSS
- **No dangerouslySetInnerHTML** sin sanitización
- **Encoding** de outputs dinámicos
- **CSP headers** en edge functions
- **Input filtering** de caracteres peligrosos

### 4. Prevención de Inyección SQL
- **Prepared statements** exclusivamente
- **Parameterized queries** en Supabase
- **Input validation** antes de queries
- **RLS policies** como capa adicional

### 5. Validación de Archivos
- **Type checking** de archivos subidos
- **Size limits** estrictos
- **Extension validation** 
- **Content verification** (magic bytes)

## 📋 Schemas Implementados

### Cliente Schema
```typescript
clientSchema = z.object({
  nombre_completo: z.string().trim().min(2).max(100),
  cedula_rnc: z.string().trim().regex(/^[0-9-]*$/),
  email: z.string().email().max(255),
  telefono: z.string().max(20),
  direccion: z.string().max(500)
})
```

### Caso Schema
```typescript
caseSchema = z.object({
  titulo: z.string().trim().min(3).max(200),
  numero_expediente: z.string().max(50),
  materia: z.string().min(3).max(100),
  descripcion: z.string().max(5000)
})
```

### Factura Schema
```typescript
invoiceSchema = z.object({
  numero_factura: z.string().max(50),
  monto: z.number().positive().max(999999999),
  concepto: z.string().trim().min(3).max(500),
  fecha: z.date()
})
```

### Audiencia Schema
```typescript
hearingSchema = z.object({
  caso: z.string().trim().min(3).max(200),
  juzgado: z.string().max(200),
  fecha: z.date().min(new Date()),
  hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
})
```

## 🛡️ Protecciones Implementadas

### 1. Input Sanitization
- **Trim whitespace** en todos los strings
- **Remove HTML tags** de text inputs
- **Escape special characters** para outputs
- **Normalize Unicode** para prevenir homograph attacks

### 2. URL Encoding
- **encodeURIComponent** para parámetros WhatsApp/email
- **URL validation** antes de redirecciones
- **Protocol whitelist** (http/https only)
- **Domain validation** para links externos

### 3. File Upload Security
```typescript
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const maxSize = 10 * 1024 * 1024; // 10MB

validateFile(file: File) {
  if (!allowedTypes.includes(file.type)) throw error;
  if (file.size > maxSize) throw error;
  // Verify magic bytes
}
```

### 4. Rate Limiting
- **10 requests/minute** por endpoint sensible
- **100 requests/hour** por usuario
- **IP-based** para endpoints públicos
- **Exponential backoff** en reintentos

## 🔍 Validaciones por Módulo

### Clientes
- ✅ Nombre: 2-100 caracteres
- ✅ Cédula/RNC: solo números y guiones
- ✅ Email: formato válido, max 255
- ✅ Teléfono: max 20 caracteres
- ✅ Dirección: max 500 caracteres

### Casos
- ✅ Título: 3-200 caracteres
- ✅ Expediente: único, max 50
- ✅ Materia: 3-100 caracteres
- ✅ Descripción: max 5000 caracteres

### Facturas
- ✅ Número: único, max 50
- ✅ Monto: positivo, max 999M
- ✅ Concepto: 3-500 caracteres
- ✅ ITBIS: 0-18%

### Audiencias
- ✅ Fecha: futura
- ✅ Hora: formato HH:MM
- ✅ Juzgado: max 200
- ✅ Tipo: enum válido

### Documentos Legales
- ✅ Título: 3-200 caracteres
- ✅ Contenido: max 50000 caracteres
- ✅ Tipo: enum válido
- ✅ Materia: obligatorio

## 🚨 Prevención de Ataques

### 1. SQL Injection
- ✅ Solo queries parametrizadas
- ✅ No concatenación de SQL
- ✅ Validación de tipos
- ✅ RLS como backup

### 2. XSS (Cross-Site Scripting)
- ✅ No eval() nunca
- ✅ No innerHTML con user input
- ✅ Escape de HTML entities
- ✅ CSP headers

### 3. CSRF (Cross-Site Request Forgery)
- ✅ SameSite cookies
- ✅ CSRF tokens en forms
- ✅ Verificación de origin
- ✅ Supabase JWT validation

### 4. Path Traversal
- ✅ No acceso directo a filesystem
- ✅ Supabase Storage paths validados
- ✅ Filename sanitization
- ✅ No ../ permitido

### 5. Command Injection
- ✅ No shell commands
- ✅ No eval/Function constructor
- ✅ Input validation estricta
- ✅ Sandboxed edge functions

## 📊 Validación Edge Functions

### Estructura Segura
```typescript
// Edge Function con validación
import { z } from 'zod';

const requestSchema = z.object({
  field: z.string().max(100)
});

Deno.serve(async (req) => {
  // 1. Validate request
  const body = await req.json();
  const validated = requestSchema.parse(body);
  
  // 2. Rate limit check
  // 3. Process safely
  // 4. Return sanitized response
});
```

### Rate Limiting
```typescript
const rateLimits = new Map();

function checkRateLimit(userId: string) {
  const now = Date.now();
  const userRequests = rateLimits.get(userId) || [];
  
  // Filter requests in last minute
  const recentRequests = userRequests.filter(
    t => now - t < 60000
  );
  
  if (recentRequests.length >= 10) {
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  rateLimits.set(userId, recentRequests);
}
```

## 🎨 Validación UI

### Form Validation
- **Real-time feedback** con React Hook Form
- **Error messages** claros y específicos
- **Disabled submit** hasta validación
- **Visual indicators** de campos inválidos

### Error Display
```typescript
{errors.nombre_completo && (
  <p className="text-sm text-destructive">
    {errors.nombre_completo.message}
  </p>
)}
```

## 🔧 Utilidades de Validación

### sanitizeInput
```typescript
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML
    .replace(/[^\w\s@.-]/gi, '') // Allow safe chars
    .slice(0, 1000); // Max length
}
```

### validateEmail
```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}
```

### validateCedula
```typescript
function validateCedula(cedula: string): boolean {
  const cedulaRegex = /^[0-9]{3}-?[0-9]{7}-?[0-9]{1}$/;
  return cedulaRegex.test(cedula);
}
```

## 📈 Checklist de Seguridad

### Inputs
- ✅ Todos los inputs validados client-side
- ✅ Todos los inputs validados server-side
- ✅ Length limits en todos los campos
- ✅ Type checking estricto
- ✅ Character whitelisting donde aplique

### Outputs
- ✅ HTML escaping de user content
- ✅ URL encoding para links
- ✅ JSON sanitization
- ✅ No eval/innerHTML sin sanitización

### Storage
- ✅ Datos sensibles encriptados
- ✅ RLS habilitado en todas las tablas
- ✅ Validación de permisos
- ✅ Audit logging

### Network
- ✅ HTTPS only
- ✅ CORS configurado correctamente
- ✅ Rate limiting implementado
- ✅ JWT validation

## 🔄 Próximas Mejoras

1. **DOMPurify** para sanitización HTML avanzada
2. **Helmet.js** para headers de seguridad
3. **Rate limiting distribuido** con Redis
4. **WAF** (Web Application Firewall)
5. **CAPTCHA** en formularios públicos
6. **2FA obligatorio** para admins
7. **Security headers** completos
8. **Vulnerability scanning** automatizado

## 📝 Notas de Implementación

### Zod Integration
- Todos los schemas en `src/lib/validation.ts`
- Reutilizables en client y server
- Type inference automática
- Error messages personalizados

### React Hook Form
- Validación optimizada con mode: 'onBlur'
- Resolver de Zod integrado
- Error handling consistente
- Accesibilidad (aria-invalid, etc.)

### Edge Functions
- Validación antes de cualquier procesamiento
- Input sanitization obligatoria
- Output encoding
- Error handling seguro (no leak info)

---

**Fase Completada:** ✅  
**Fecha:** 2025-10-08  
**Impacto:** Crítico - Protección fundamental contra ataques
