# PraxisLex - Plataforma Jurídica Integral
## Resumen Ejecutivo de Características

**Plataforma de gestión jurídica profesional con IA para abogados en República Dominicana**

---

## 🎯 MÓDULOS PRINCIPALES

### 1. **Dashboard (Panel Principal)**
- Vista general de estadísticas del despacho
- KPIs en tiempo real
- Resumen de casos activos
- Próximas audiencias
- Notificaciones de plazos

### 2. **Gestión de Casos**
- Creación y seguimiento de expedientes
- Estados: Activo, En proceso, Ganado, Perdido, Archivado
- Asociación con clientes
- Gestión de plazos y deadlines
- Historial completo de cada caso

### 3. **Gestión de Clientes**
- Base de datos de clientes con encriptación
- Campos: Nombre, Cédula/RNC (encriptado), Email, Teléfono, Dirección
- Sistema de invitaciones para portal de cliente
- Protección de datos sensibles mediante RLS (Row Level Security)
- Enmascaramiento de información personal

### 4. **Audiencias y Calendario**
- Programación de audiencias
- Recordatorios automáticos
- Integración con casos
- Vista de calendario
- Notificaciones de próximos eventos

### 5. **Gestión Documental**
- Almacenamiento seguro de documentos
- Asociación con casos y clientes
- Visor de documentos integrado
- Categorización y búsqueda

### 6. **Redacción IA (AI Legal Drafting)**
**Características principales:**
- Generación automática de documentos legales con IA
- Plantillas predefinidas incluyen:
  - Demanda en cobro de pesos
  - Acción de amparo
  - Contestación de demanda
  - Recurso de apelación
  - Contrato de arrendamiento
  - Poder especial
  - Y muchas más...
- Modo estructurado (formularios predefinidos)
- Modo manual (entrada libre)
- Entrada por voz integrada
- Búsqueda de jurisprudencia automática
- Exportación a formato Word (.docx)
- Integración con portal judicial (en desarrollo)

### 7. **Jurisprudencia**
- Búsqueda inteligente de precedentes
- Base de datos legal
- Integración con redacción de documentos
- Citación automática

### 8. **Contabilidad y Facturación**
**Módulo de Contabilidad:**
- Gestión de gastos del despacho
- Registro de honorarios
- Control de pagos de clientes
- Reportes financieros

**Módulo de Facturación:**
- Emisión de facturas
- Seguimiento de pagos
- Historial de transacciones
- Visor de facturas integrado

### 9. **Portal del Cliente**
- Acceso seguro para clientes
- Vista de sus casos
- Documentos compartidos
- Comunicación directa
- Sistema de invitaciones por email

### 10. **Configuración y Perfiles**
**Configuración del Despacho:**
- Datos de la firma legal
- Gestión de usuarios
- Roles y permisos

**Perfil de Usuario:**
- Información personal
- Credenciales
- Preferencias

---

## 🔐 SEGURIDAD

### Autenticación
- Sistema de login/registro
- Autenticación mediante Supabase Auth
- Confirmación automática de email
- Protección de rutas con AuthGuard

### Encriptación de Datos
- Cédulas/RNC encriptados con Base64
- Campos sensibles protegidos
- Funciones de encriptación/desencriptación en base de datos

### Row Level Security (RLS)
- Políticas de acceso por usuario
- Restricciones a nivel de base de datos
- Protección de datos entre usuarios
- Políticas específicas para:
  - Clientes
  - Casos
  - Documentos
  - Invitaciones
  - Facturas

### Roles de Usuario
- **Free:** Acceso básico
- **Pro:** Funcionalidades avanzadas
- **Admin:** Gestión completa del despacho

---

## 🤖 INTELIGENCIA ARTIFICIAL

### Modelos Disponibles
- Google Gemini 2.5 Pro/Flash/Flash Lite
- OpenAI GPT-5/GPT-5 Mini/GPT-5 Nano
- Sin necesidad de API keys propias

### Casos de Uso IA
1. **Redacción de documentos legales**
2. **Búsqueda de jurisprudencia**
3. **Transcripción de audio a texto**
4. **Generación de resúmenes**
5. **Análisis de documentos**

---

## 💾 ARQUITECTURA TÉCNICA

### Frontend
- **Framework:** React 18.3
- **Build Tool:** Vite
- **Lenguaje:** TypeScript
- **Estilo:** Tailwind CSS + shadcn/ui
- **Routing:** React Router DOM v6
- **Estado:** React Query (TanStack Query)
- **Formularios:** React Hook Form + Zod

### Backend (Lovable Cloud/Supabase)
- **Base de datos:** PostgreSQL
- **Autenticación:** Supabase Auth
- **Storage:** Supabase Storage
- **Edge Functions:** Deno runtime
- **Realtime:** Supabase Realtime

### Componentes UI (shadcn/ui)
- Accordion, Alert, Avatar, Badge
- Button, Calendar, Card, Carousel
- Checkbox, Dialog, Dropdown, Form
- Input, Select, Table, Tabs
- Toast, Tooltip, y más...

---

## 📊 BASE DE DATOS

### Tablas Principales
- **clients:** Información de clientes (con encriptación)
- **cases:** Expedientes y casos legales
- **hearings:** Audiencias programadas
- **deadlines:** Plazos y fechas importantes
- **documents:** Almacenamiento de documentos
- **invoices:** Facturas y pagos
- **client_invitations:** Tokens de invitación
- **user_roles:** Roles y permisos
- **law_firm_profiles:** Perfiles de despachos

### Edge Functions
1. **generate-legal-doc:** Generación de documentos con IA
2. **jurisprudence-search:** Búsqueda de jurisprudencia
3. **transcribe-audio:** Transcripción de voz a texto
4. **send-client-invitation:** Envío de invitaciones
5. **delete-user:** Eliminación de usuarios
6. **documents-generate:** Generación de documentos adicionales

---

## 🎨 DISEÑO

### Sistema de Diseño
- Tokens semánticos en `index.css`
- Configuración Tailwind en `tailwind.config.ts`
- Variables CSS para colores HSL
- Soporte dark/light mode
- Animaciones y transiciones suaves

### Tipografía
- **Principal:** Inter (300-700)
- **Decorativa:** Playfair Display (600-800)

### Responsive
- Mobile-first approach
- Breakpoints adaptativos
- Sidebar colapsable
- Vistas optimizadas para tablet y desktop

---

## 🌟 CARACTERÍSTICAS ESPECIALES

### Entrada por Voz
- Componente `VoiceInput` integrado
- Transcripción automática en formularios
- Disponible en redacción de documentos

### Notificaciones en Tiempo Real
- Sistema de notificaciones con prioridad
- Alertas de plazos próximos
- Recordatorios de audiencias
- Actualización automática

### Exportación de Documentos
- Generación de archivos Word (.docx)
- Formato profesional
- Plantillas legales predefinidas

### Búsqueda Inteligente
- Búsqueda de jurisprudencia
- Filtros avanzados
- Integración con documentos

---

## 📱 NAVEGACIÓN PRINCIPAL

```
/ (Dashboard)
├── /casos (Gestión de Casos)
├── /clientes (Gestión de Clientes)
├── /audiencias (Calendar de Audiencias)
├── /documentos (Gestión Documental)
├── /redaccion-ia (Redacción con IA)
├── /jurisprudencia (Base de Jurisprudencia)
├── /contabilidad (Contabilidad del Despacho)
├── /facturacion (Facturación y Cobros)
├── /portal (Portal del Cliente)
├── /perfil (Perfil de Usuario)
├── /configuracion (Configuración General)
│   └── /configuracion/firma (Configuración del Despacho)
└── /upgrade (Mejora a Plan Pro)
```

---

## 🔧 VARIABLES DE ENTORNO

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

---

## 📦 DEPENDENCIAS PRINCIPALES

**Core:**
- react, react-dom, react-router-dom
- @tanstack/react-query
- @supabase/supabase-js

**UI:**
- @radix-ui/* (componentes primitivos)
- tailwindcss, tailwindcss-animate
- lucide-react (iconos)

**Formularios:**
- react-hook-form
- @hookform/resolvers
- zod

**Utilidades:**
- date-fns
- docx (generación Word)
- xlsx (hojas de cálculo)
- clsx, class-variance-authority

**Gráficos:**
- recharts

---

## 🚀 SEO Y META

### Meta Tags Configurados
- Title: "PraxisLex - Plataforma Jurídica Integral"
- Description: Gestión jurídica con IA para República Dominicana
- Open Graph tags para redes sociales
- Twitter cards
- Fonts: Google Fonts (Inter + Playfair Display)

---

## 📋 ESTADO DEL PROYECTO

### Completado ✅
- Sistema de autenticación
- Gestión de clientes con encriptación
- Gestión de casos y audiencias
- Redacción de documentos con IA
- Portal de cliente
- Sistema de notificaciones
- RLS policies completas
- Diseño responsive

### En Desarrollo 🚧
- Integración con portal judicial
- Mejoras en búsqueda de jurisprudencia
- Reportes avanzados de contabilidad

---

## 🎓 NOTAS TÉCNICAS

### Convenciones de Código
- Componentes en PascalCase
- Hooks personalizados con prefijo `use`
- Tipos TypeScript estrictos
- Componentes pequeños y reutilizables

### Principios de Diseño
- Mobile-first
- Semantic tokens para colores
- No estilos inline directos
- Uso del design system

### Seguridad
- Nunca exponer secretos en frontend
- RLS habilitado en todas las tablas sensibles
- Encriptación de datos personales
- Validación en cliente y servidor

---

**Versión del Documento:** 1.0  
**Última Actualización:** 2025-10-08  
**Proyecto:** PraxisLex - Donde la teoría se hace práctica