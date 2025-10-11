# 🧪 VERIFICACIÓN E2E - PRAXISLEX ONBOARDING

> **Versión:** 1.0  
> **Fecha:** Octubre 2025  
> **Estado:** ✅ Implementado

---

## ✅ CHECKLIST COMPLETO

### A. Salud del Sistema
- [ ] **ENV válidas**: Variables VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY configuradas
- [ ] **Conexión Supabase**: Tablas accesibles, RLS operativo
- [ ] **Service Worker**: UpdatePrompt aparece en deploy nuevo

### B. Onboarding y Roles
- [ ] **Registro Magic Link**: 
  - Usuario recibe email
  - Click en link → crea user_profiles con role='cliente'
  - Trigger crea registro en clients automáticamente
  
- [ ] **Login OTP**: 
  - Envío de código
  - Verificación exitosa
  - Sesión persistente en localStorage
  
- [ ] **Invitación Cliente**:
  - Abogado envía invitación desde `/clientes`
  - Cliente recibe email con link `/invitation-accept?token=...`
  - Al aceptar: actualiza clients.auth_user_id
  - Cliente puede acceder a `/portal`

- [ ] **Cambio de Rol**:
  - Admin cambia role de 'cliente' a 'abogado' en user_profiles
  - Usuario ve módulos internos (casos, audiencias, contabilidad)

### C. Acceso a Alcances por Rol

#### Cliente (`role='cliente'`)
- [ ] Ve Portal del Cliente (`/portal`)
- [ ] Lista de casos propios
- [ ] Audiencias próximas
- [ ] Facturas y pagos
- [ ] Documentos asociados
- [ ] **NO** ve módulos administrativos

#### Abogado (`role='abogado'`)
- [ ] Dashboard completo
- [ ] Módulo Casos
- [ ] Módulo Audiencias
- [ ] Módulo Contabilidad
- [ ] RAG Jurisprudencia
- [ ] Redacción IA
- [ ] Puede crear clientes

#### Asistente (`role='asistente'`)
- [ ] Dashboard operativo
- [ ] Casos (lectura/actualización)
- [ ] Audiencias
- [ ] **NO** ve configuraciones administrativas

#### Admin (`role='admin'`)
- [ ] Acceso total
- [ ] Módulo Seguridad
- [ ] Analytics
- [ ] Configuración de firma

### D. IA Tutora Permanente
- [ ] **Ícono flotante** visible en todas las páginas
- [ ] Click → abre chat IA
- [ ] Chat responde en contexto del módulo activo
- [ ] **Acciones ejecutables**:
  - "Crea audiencia mañana 9:00" → inserta en `hearings` con `case_number`
  - "Factura RD$2,500 a Cliente X" → inserta en `invoices` con `case_number`
  - "Crear caso" → abre diálogo
  - "Buscar jurisprudencia" → ejecuta búsqueda
- [ ] Logs en `ai_actions_log`

### E. Contabilidad
- [ ] **Crear Factura**: estado "pendiente", monto calculado con ITBIS
- [ ] **Registrar Pago**: actualiza balance, refleja en portal
- [ ] **Créditos**: afectan saldo general
- [ ] **Gastos**: deducibles, asignables a caso
- [ ] **Dashboards**: cifras correctas (no ceros falsos)

### F. Casos y Audiencias
- [ ] **Crear Caso**: genera `case_number` automático formato `EXP-YYYYMMDD-XXXXXX`
- [ ] **Audiencias Manuales**: vincula a `case_id` correcto
- [ ] **Audiencias IA**: crea con `case_number` asociado
- [ ] **Listados**: conteos precisos

### G. Documentos
- [ ] **Subir documento**: aparece en Portal y en módulo Documentos
- [ ] **Generación IA**: produce .docx con referencia a expediente
- [ ] **Descarga**: funcional

### H. RAG/Jurisprudencia
- [ ] **Búsqueda**: devuelve resultados relevantes
- [ ] **Citaciones**: visibles con contexto
- [ ] **Anonimización**: no expone PII en queries a LLM
- [ ] **Embeddings**: vectores generados correctamente

### I. PWA Instalación

#### Android Chrome
- [ ] Evento `beforeinstallprompt` capturado
- [ ] Banner "Instalar PraxisLex" mostrado
- [ ] Click "Instalar" → app añadida a pantalla de inicio
- [ ] Abre en modo standalone
- [ ] Modo offline funcional

#### iOS Safari
- [ ] Detección de Safari + iOS
- [ ] Banner con instrucciones:
  1. Compartir → Añadir a pantalla de inicio
- [ ] App instalada
- [ ] Funciona offline (cache básico)

#### Desktop (Chrome/Edge)
- [ ] Botón "Instalar App" en header
- [ ] Click → diálogo nativo del navegador
- [ ] App instalada como PWA de escritorio
- [ ] Shortcut en menú inicio

### J. Offline Básico
- [ ] **Sin conexión**: App carga shell + aviso "Sin conexión"
- [ ] **Reintento**: al volver conexión, sincroniza
- [ ] **Service Worker**: caché de assets estáticos

### K. Seguridad
- [ ] **RLS**: clientes solo ven sus datos
- [ ] **Staff**: solo ve su firma (`law_firm_id`)
- [ ] **Audit Logs**: PII reveal registrado en `events_audit` (inmutable)
- [ ] **Tokens**: invitaciones hasheadas, no plaintext
- [ ] **Error Boundary**: muestra ID y opción "Reintentar", no pantalla muerta

---

## 🧪 PRUEBAS MANUALES

### Test 1: Onboarding Cliente Nuevo
```
1. Ir a /auth
2. Ingresar email nuevo (ej: cliente@test.com)
3. Método: Magic Link
4. Abrir email → click en link
5. ✅ Redirige a /portal
6. ✅ Ver "Mis Casos", "Audiencias", "Facturas"
7. ✅ Verificar: user_profiles.role = 'cliente'
8. ✅ Verificar: clients.auth_user_id = user.id
```

### Test 2: IA Crea Audiencia
```
1. Login como abogado
2. Ir a /casos/EXP-20251010-000001
3. Click en ícono flotante IA
4. Escribir: "Crea una audiencia para mañana a las 9:00 en el Civil"
5. ✅ Audiencia creada con case_number del expediente
6. ✅ Log en ai_actions_log
7. ✅ Visible en /audiencias
```

### Test 3: PWA Android
```
1. Abrir Chrome Android en preview URL
2. Esperar 3-5 segundos
3. ✅ Ver banner "Instalar PraxisLex"
4. Click "Instalar"
5. ✅ App aparece en drawer de apps
6. Abrir app → standalone sin barra de navegador
```

### Test 4: Portal Cliente con Datos
```
1. Como abogado: crear caso para cliente X
2. Crear factura para cliente X
3. Crear audiencia para caso de cliente X
4. Login como cliente X
5. Ir a /portal
6. ✅ Ver caso en lista
7. ✅ Ver audiencia próxima
8. ✅ Ver factura pendiente
9. ✅ Total facturado ≠ 0
```

---

## 🚀 CRITERIOS DE ACEPTACIÓN

### Crítico (Bloquea producción)
- ✅ Ningún usuario queda bloqueado en registro/login
- ✅ Portal cliente nunca muestra ceros falsos si hay datos
- ✅ RLS funciona: clientes no ven datos de otros clientes
- ✅ PWA instalable en al menos Android/Desktop

### Importante (No bloquea pero debe arreglarse pronto)
- ✅ IA crea acciones con `case_number` correcto
- ✅ Audit logs registran PII access
- ✅ Offline básico funcional
- ✅ Error boundaries muestran UI recuperable

### Deseado (Nice to have)
- ✅ Notificaciones push
- ✅ Tests E2E automatizados (Playwright)
- ✅ Onboarding wizard con pasos
- ✅ Animaciones fluidas

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Target | Actual |
|---------|--------|--------|
| Registro exitoso | >95% | TBD |
| PWA instalaciones | >30% | TBD |
| Uso IA tutora | >50% | TBD |
| Tiempo primer valor | <2 min | TBD |
| Errores críticos | 0 | TBD |

---

## 🔄 FLUJO DE VERIFICACIÓN RECOMENDADO

### Paso 1: Preparación (10 min)
1. Desplegar a staging/preview
2. Verificar ENV variables
3. Ejecutar migraciones
4. Verificar Service Worker actualizado

### Paso 2: Tests Críticos (30 min)
1. Onboarding cliente nuevo (Test 1)
2. Acceso por rol (Checklist C)
3. IA crea acción (Test 2)
4. PWA instalación (Test 3)

### Paso 3: Tests Funcionales (45 min)
1. Contabilidad (Checklist E)
2. Casos y audiencias (Checklist F)
3. Documentos (Checklist G)
4. RAG (Checklist H)

### Paso 4: Tests de Seguridad (20 min)
1. RLS por rol (Checklist K)
2. Audit logs
3. Error boundaries

### Paso 5: Aprobación (5 min)
1. Revisar checklist completo
2. Verificar criterios críticos ✅
3. Aprobar para producción

---

## 🐛 ISSUES CONOCIDOS Y WORKAROUNDS

### Issue: iOS no cachea offline
**Workaround**: Usar estrategia network-first con fallback limitado

### Issue: Magic Link puede tardar en llegar
**Workaround**: Ofrecer también OTP como alternativa

---

## 📝 NOTAS FINALES

- **Onboarding completo**: Magic Link, OTP, Password
- **Roles automáticos**: Cliente por defecto, trigger crea registro
- **PWA multi-plataforma**: Android, iOS, Desktop
- **IA permanente**: Ícono flotante siempre visible
- **Seguridad**: RLS + Audit + Tokens hasheados

**Si con este sistema un usuario no puede entrar, instalar o usar la app, el problema ya no es técnico; es antropológico.**
