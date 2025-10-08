# Sistema de Contabilidad PraxisLex

## 📊 Estructura General

El sistema de contabilidad está dividido en **3 módulos principales**:

### 1. Contabilidad de Clientes (`/contabilidad`)
**Archivo**: `src/pages/Accounting.tsx`
**Propósito**: Gestión de facturas emitidas a clientes

**Funcionalidades**:
- ✅ Crear facturas con número, cliente, concepto y monto
- ✅ Ver listado de facturas con estados (pendiente, pagado, vencido, etc.)
- ✅ Filtrar facturas por estado
- ✅ Visualizar factura en PDF
- ✅ Estadísticas: Total pendiente, cobrado, vencidos, este mes

**Tablas DB utilizadas**:
- `invoices` - Facturas emitidas
- `clients` - Información de clientes

**Navegación**:
- Botón "Contabilidad General" → `/contabilidad-general`
- Botón "Créditos y Pagos" → `/creditos-pagos`

---

### 2. Créditos, Pagos y Gastos por Cliente (`/creditos-pagos`)
**Archivo**: `src/pages/AccountingNew.tsx`
**Propósito**: Gestión de transacciones financieras relacionadas con clientes

**Funcionalidades**:
- ✅ Registrar créditos a clientes
- ✅ Registrar pagos de clientes (asociados o no a facturas)
- ✅ Registrar gastos relacionados con casos/clientes
- ✅ Ver estado de cuenta por cliente (débitos, créditos, saldo)
- ✅ Filtrar gastos por cliente y caso

**Tablas DB utilizadas**:
- `client_credits` - Créditos/débitos de clientes
  - tipo: 'credito' | 'debito'
- `payments` - Pagos recibidos
- `expenses` - Gastos procesales
- `clients` - Información de clientes
- `cases` - Casos asociados

**Navegación**:
- Botón "Volver" → `/contabilidad`

---

### 3. Contabilidad General de la Firma (`/contabilidad-general`)
**Archivo**: `src/pages/FirmAccounting.tsx`
**Propósito**: Gestión de ingresos y gastos NO relacionados con clientes específicos

**Funcionalidades**:
- ✅ Registrar ingresos generales de la firma
- ✅ Registrar gastos de oficina/operativos
- ✅ Ver resumen financiero (total ingresos, gastos, balance, ITBIS)
- ✅ Cálculo automático de ITBIS e intereses
- ✅ Tabs para separar ingresos y gastos

**Tablas DB utilizadas**:
- `client_credits` - Ingresos generales
  - tipo: 'ingreso_general'
  - client_id: NULL
- `expenses` - Gastos de oficina
  - client_id: NULL
  - case_id: NULL

**Función de base de datos**:
- `get_firm_accounting_summary(p_user_id)` - Resumen consolidado

**Navegación**:
- Botón "Volver" → `/contabilidad`

---

## 🗄️ Esquema de Base de Datos

### Tabla: `invoices`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- client_id (uuid, FK → clients)
- numero_factura (text, REQUIRED)
- concepto (text, REQUIRED)
- monto (numeric, REQUIRED)
- fecha (date, REQUIRED)
- estado (text: 'pendiente' | 'parcial' | 'pagado' | 'vencido' | 'cancelado')
- itbis (numeric, default: 0)
- interes (numeric, default: 0)
- subtotal (numeric, nullable)
- created_at, updated_at
```

### Tabla: `payments`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- client_id (uuid, FK → clients, nullable)
- invoice_id (uuid, FK → invoices, nullable)
- monto (numeric, REQUIRED)
- metodo_pago (text, REQUIRED)
- concepto (text, REQUIRED)
- fecha (date, default: CURRENT_DATE)
- referencia (text, nullable)
- notas (text, nullable)
- aplicado_interes (numeric, default: 0)
- created_at, updated_at
```

### Tabla: `expenses`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- client_id (uuid, FK → clients, nullable)
- case_id (uuid, FK → cases, nullable)
- concepto (text, REQUIRED)
- categoria (text, REQUIRED)
- monto (numeric, REQUIRED)
- fecha (date, default: CURRENT_DATE)
- metodo_pago (text, nullable)
- proveedor (text, nullable)
- referencia (text, nullable)
- notas (text, nullable)
- reembolsable (boolean, default: true)
- reembolsado (boolean, default: false)
- itbis (numeric, default: 0)
- subtotal (numeric, nullable)
- created_at, updated_at
```

### Tabla: `client_credits`
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- client_id (uuid, FK → clients, nullable)
- monto (numeric, REQUIRED)
- concepto (text, REQUIRED)
- tipo (text, REQUIRED: 'credito' | 'debito' | 'ingreso_general' | 'gasto_general')
- fecha (date, default: CURRENT_DATE)
- referencia (text, nullable)
- notas (text, nullable)
- interes (numeric, default: 0)
- created_at, updated_at
```

**CONSTRAINT IMPORTANTE**:
```sql
CHECK (tipo = ANY (ARRAY['credito', 'debito', 'ingreso_general', 'gasto_general']))
```

---

## 🔐 Seguridad (RLS Policies)

Todas las tablas tienen Row Level Security (RLS) habilitado con políticas:

1. **SELECT**: Los usuarios solo ven sus propios registros (`user_id = auth.uid()`)
2. **INSERT**: Los usuarios solo pueden crear registros para ellos mismos
3. **UPDATE**: Los usuarios solo pueden actualizar sus propios registros
4. **DELETE**: Los usuarios solo pueden eliminar sus propios registros

**Validaciones adicionales**:
- Para `expenses` y `payments`: Verifican que `client_id` pertenezca al usuario
- Para `expenses`: Verifican que `case_id` pertenezca al usuario

---

## 📋 Validaciones de Frontend

### Schemas Zod Implementados:

1. **invoiceSchema** - Validación de facturas
2. **paymentSchema** - Validación de pagos
3. **expenseSchema** - Validación de gastos
4. **clientCreditSchema** - Validación de créditos/débitos

**Ubicación**: `src/lib/validation.ts`

---

## 🎨 Constantes y Catálogos

### Métodos de Pago (`METODOS_PAGO`)
- Efectivo
- Transferencia Bancaria
- Cheque
- Tarjeta de Crédito/Débito
- Azul
- CardNET

### Categorías de Gastos (`CATEGORIAS_GASTOS`)
**Gastos Procesales**:
- Tasas Judiciales
- Timbres y Papel Sellado
- Notificaciones y Alguacilazgo
- Honorarios de Peritos
- Traducciones
- Copias Certificadas
- Publicaciones y Edictos
- Transporte y Traslados
- Otros procesales

**Gastos Administrativos** (para Contabilidad General):
- Gastos de Oficina
- Alquiler
- Servicios Públicos
- Nómina y Personal
- Tecnología y Software
- Marketing y Publicidad
- Seguros
- Impuestos y Tasas

### Estados de Pago (`ESTADOS_PAGO`)
- Pendiente
- Pago Parcial
- Pagado
- Vencido
- Cancelado

### Tipos de Crédito (`TIPOS_CREDITO`)
- Crédito a Cliente
- Débito a Cliente
- Ingreso General
- Gasto General

**Ubicación**: `src/lib/constants.ts`

---

## 🧪 Casos de Uso

### Caso 1: Facturar a un Cliente
1. Usuario va a `/contabilidad`
2. Clic en "Nueva Factura"
3. Completa: número, cliente, concepto, monto
4. Sistema valida con `invoiceSchema`
5. Se crea registro en `invoices` con estado "pendiente"

### Caso 2: Registrar Pago de Cliente
**Opción A - Desde Créditos y Pagos**:
1. Usuario va a `/creditos-pagos`
2. Clic en "Nuevo Pago"
3. Selecciona cliente, monto, método de pago
4. Opcionalmente asocia a una factura
5. Sistema valida con `paymentSchema`
6. Se crea registro en `payments`

**Opción B - Desde Facturas** (futuro):
1. En `/contabilidad`, clic en "Registrar Pago" de una factura
2. Monto se pre-llena, factura se auto-asocia
3. Usuario completa método de pago
4. Se actualiza estado de factura a "pagado" o "parcial"

### Caso 3: Registrar Gasto Procesal
1. Usuario va a `/creditos-pagos`
2. Clic en "Nuevo Gasto"
3. Selecciona cliente y caso (opcional)
4. Completa categoría, concepto, monto
5. Marca si es reembolsable
6. Sistema valida con `expenseSchema`
7. Se crea registro en `expenses`

### Caso 4: Ingresos/Gastos Generales de la Firma
1. Usuario va a `/contabilidad-general`
2. Tab "Ingresos Generales" o "Gastos de Oficina"
3. Clic en "Nuevo Ingreso" o "Nuevo Gasto"
4. Completa concepto, monto, (opcionalmente ITBIS e intereses)
5. Sistema valida y guarda:
   - Ingresos → `client_credits` con tipo='ingreso_general', client_id=NULL
   - Gastos → `expenses` con client_id=NULL, case_id=NULL
6. Función `get_firm_accounting_summary()` calcula totales

### Caso 5: Ver Estado de Cuenta de Cliente
1. Usuario va a `/creditos-pagos`
2. Clic en "Ver Estado de Cuenta" de un cliente
3. Sistema consulta:
   - `invoices` (débitos - aumentan saldo a favor de firma)
   - `client_credits` tipo='debito' (débitos)
   - `client_credits` tipo='credito' (créditos - reducen saldo)
   - `payments` (créditos - reducen saldo)
4. Ordena por fecha y calcula saldo corriente
5. Muestra tabla con movimientos y saldo

---

## 🐛 Problemas Corregidos

### ✅ Error 1: Constraint violation en client_credits
**Problema**: `client_credits_tipo_check` solo permitía 'credito' y 'debito'
**Solución**: Migración actualiza constraint para permitir también 'ingreso_general' y 'gasto_general'

### ✅ Error 2: Falta de validación en formularios
**Problema**: No había schemas Zod para payments, expenses, client_credits
**Solución**: Creados `paymentSchema`, `expenseSchema`, `clientCreditSchema` en validation.ts

### ✅ Error 3: Categorías de gastos incompletas
**Problema**: Solo había categorías procesales, faltaban administrativas
**Solución**: Agregadas categorías como oficina, alquiler, servicios, personal, etc.

---

## 🚀 Mejoras Pendientes (Fase C)

1. **Validación en tiempo real en formularios**
   - Integrar schemas Zod con react-hook-form
   - Mostrar errores campo por campo

2. **Asociación automática de pagos a facturas**
   - En Accounting.tsx, botón "Registrar Pago" que pre-llene invoice_id
   - Al registrar pago, actualizar estado de factura automáticamente

3. **Exportación de reportes**
   - PDF de facturas individuales
   - Excel de estado de cuenta
   - Reporte de ingresos/gastos mensuales

4. **Dashboard de métricas**
   - Gráficos de ingresos vs gastos
   - Cuentas por cobrar vencidas
   - Proyección de flujo de caja

5. **Recordatorios automáticos**
   - Facturas próximas a vencer
   - Facturas vencidas sin pago

6. **ITBIS automático**
   - Calcular 18% automáticamente en formularios
   - Opción de incluir/excluir ITBIS

7. **Conciliación bancaria**
   - Importar movimientos bancarios
   - Marcar como conciliados

---

## 📚 Referencias

- **Documentación Supabase**: https://supabase.com/docs
- **Zod Validation**: https://zod.dev/
- **React Hook Form**: https://react-hook-form.com/
- **shadcn/ui**: https://ui.shadcn.com/

---

**Última actualización**: 2025-10-08
**Versión**: 1.0
**Estado**: ✅ Base de datos corregida | ⚠️ Validaciones agregadas | 🔄 Mejoras en progreso
