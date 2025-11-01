# Guía de Uso: Sistema de Hidratación Automática

## ✅ Implementación Completa

El sistema de hidratación automática está **100% funcional** con:

1. **Helper único** en `src/lib/formHydrate.ts`
2. **Selectores actualizados** que soportan hidratación automática
3. **Cascadas geográficas** automáticas
4. **Numeración automática** de actos (ACT-YYYY-###)

---

## 🎯 Funciones Principales

### `hydrateClient(form, base, cliente)`

Autollena **todos** los campos de un cliente en el formulario.

```typescript
import { hydrateClient } from '@/lib/formHydrate';

// Uso en selector de cliente
const clientData = await getClientById(clientId);
hydrateClient(form, 'primera_parte', {
  id: clientData.id,
  nombre_completo: clientData.nombre_completo,
  cedula_rnc: clientData.cedula_rnc,
  nacionalidad: clientData.nacionalidad,
  estado_civil: clientData.estado_civil,
  profesion: clientData.profesion,
  provincia_id: clientData.provincia_id,
  municipio_id: clientData.municipio_id,
  sector_id: clientData.sector_id,
  direccion: clientData.direccion,
  email: clientData.email,
  telefono: clientData.telefono,
  // ... otros campos
});
```

**Campos autocompletados:**
- ✅ Identificación (nombre, cédula, tipo persona)
- ✅ Datos civiles (nacionalidad, estado civil, profesión)
- ✅ Domicilio completo (provincia, municipio, sector, dirección, ciudad)
- ✅ Contacto (email, teléfono)
- ✅ Persona jurídica (razón social, representante, cargo)
- ✅ Profesionales (matrículas CARD y profesional)

---

### `hydrateNotario(form, notario)`

Autollena datos del notario con jurisdicción compuesta.

```typescript
import { hydrateNotario } from '@/lib/formHydrate';

const notarioData = notarios.find(n => n.id === notarioId);
hydrateNotario(form, {
  id: notarioData.id,
  nombre_completo: notarioData.nombre,
  exequatur: notarioData.exequatur,
  cedula_mask: notarioData.cedula_mask,
  oficina: notarioData.oficina,
  municipio_nombre: notarioData.municipio_nombre,
  provincia_nombre: notarioData.provincia_nombre,
  jurisdiccion: notarioData.jurisdiccion,
  telefono: notarioData.telefono,
  email: notarioData.email,
});
```

---

### `hydrateAbogado(form, base, abogado)`

Autollena datos de abogado (propio o contrario).

```typescript
import { hydrateAbogado } from '@/lib/formHydrate';

hydrateAbogado(form, 'abogado_contrario.0', {
  id: abogadoData.id,
  nombre: abogadoData.nombre,
  cedula: abogadoData.cedula,
  matricula_card: abogadoData.matricula_card,
  email: abogadoData.email,
  telefono: abogadoData.telefono,
  despacho_direccion: abogadoData.despacho_direccion,
});
```

---

### `resetGeoCascade(form, base)`

Resetea campos dependientes en cascadas geográficas.

```typescript
import { resetGeoCascade } from '@/lib/formHydrate';

// Cuando cambia la provincia, limpiar municipio y sector
useEffect(() => {
  const subscription = watch((value, { name }) => {
    if (name === 'primera_parte.provincia_id') {
      resetGeoCascade(form, 'primera_parte');
    }
  });
  return () => subscription.unsubscribe();
}, [watch, form]);
```

---

## 🔧 Uso en Componentes

### ClientSelector (Ya Actualizado)

```tsx
import { ClientSelector } from '@/components/legal-acts/ClientSelector';
import { useForm } from 'react-hook-form';

function MyForm() {
  const form = useForm();
  
  return (
    <ClientSelector
      label="Primera Parte"
      fieldPrefix="primera_parte"
      value={form.watch('primera_parte.cliente_id') || null}
      onChange={(id) => form.setValue('primera_parte.cliente_id', id || undefined)}
      form={form}  // 🔑 Pasar form activa hidratación automática
      required
    />
  );
}
```

**Características:**
- ✅ Búsqueda por cédula
- ✅ Selector de clientes existentes
- ✅ Opción de entrada manual
- ✅ Badge de "Autocompletado"
- ✅ Toast de confirmación
- ✅ Compatibilidad con versión legacy (`onFieldUpdate`)

---

### NotarioSelector (Ya Actualizado)

```tsx
import { NotarioSelector } from '@/components/legal-acts/NotarioSelector';

function MyForm() {
  const form = useForm();
  
  return (
    <NotarioSelector
      label="Notario Público"
      value={form.watch('notario.id') || null}
      onChange={(id) => form.setValue('notario.id', id || undefined)}
      form={form}  // 🔑 Pasar form activa hidratación automática
      required
    />
  );
}
```

---

### LocationSelect con Cascadas

```tsx
import { LocationSelect } from '@/components/legal-acts/LocationSelect';
import { resetGeoCascade } from '@/lib/formHydrate';

function MyForm() {
  const form = useForm();
  const { watch, control, setValue } = form;
  
  // Cascada automática
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'primera_parte.provincia_id') {
        resetGeoCascade(form, 'primera_parte');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, form]);
  
  return (
    <LocationSelect
      control={control}
      setValue={setValue}
      nameProvincia="primera_parte.provincia_id"
      nameMunicipio="primera_parte.municipio_id"
      nameSector="primera_parte.sector_id"
    />
  );
}
```

---

## 📝 Numeración Automática de Actos

### Base de Datos (Ya Implementado)

```sql
-- Tabla de secuencias por año
CREATE TABLE public.act_sequences (
  year INT PRIMARY KEY,
  current_number INT NOT NULL DEFAULT 0
);

-- Función para generar número
CREATE FUNCTION public.next_act_number(p_year INT)
RETURNS TEXT AS $$
DECLARE n INT;
BEGIN
  INSERT INTO public.act_sequences(year, current_number)
  VALUES (p_year, 0)
  ON CONFLICT (year) DO NOTHING;

  UPDATE public.act_sequences
  SET current_number = current_number + 1
  WHERE year = p_year
  RETURNING current_number INTO n;

  RETURN 'ACT-' || p_year || '-' || lpad(n::text, 3, '0');
END$$ LANGUAGE plpgsql;

-- Trigger en generated_acts
CREATE TRIGGER trg_assign_numero_acto
BEFORE INSERT ON public.generated_acts
FOR EACH ROW EXECUTE FUNCTION public.assign_numero_acto();

-- Trigger en notarial_acts
CREATE TRIGGER trg_assign_numero_notarial
BEFORE INSERT ON public.notarial_acts
FOR EACH ROW EXECUTE FUNCTION public.assign_numero_acto();
```

### Uso en Formulario

```tsx
// El número se genera automáticamente al insertar
const { data: newAct } = await supabase
  .from('generated_acts')
  .insert({
    tipo_acto: 'contrato',
    titulo: 'Contrato de Arrendamiento',
    user_id: user.id,
    tenant_id: tenantId,
    // numero_acto: null  ← Se genera automáticamente
  })
  .select()
  .single();

console.log(newAct.numero_acto); // "ACT-2025-001"
```

---

## ✅ Validaciones Pre-Generación

```typescript
import { validateBeforeGeneration, validateMontos, validateDomicilio } from '@/lib/forms/validation';

const onGenerate = () => {
  const errors: string[] = [];
  
  // 1. Validar schema básico
  const schemaErrors = validateBeforeGeneration({
    primera_parte: form.getValues('primera_parte'),
    segunda_parte: form.getValues('segunda_parte'),
    notario: form.getValues('notario'),
    contrato: form.getValues('contrato'),
  });
  if (schemaErrors) errors.push(...schemaErrors);
  
  // 2. Validar montos (evitar RD$0.00)
  const montosErrors = validateMontos(form.getValues());
  errors.push(...montosErrors);
  
  // 3. Validar domicilios completos
  const domicilio1 = validateDomicilio(form.getValues('primera_parte'), 'Primera Parte');
  errors.push(...domicilio1);
  
  if (errors.length > 0) {
    toast.error("Datos incompletos", {
      description: errors.slice(0, 3).join("\n"),
    });
    return; // FAIL-FAST
  }
  
  // Continuar con generación...
};
```

---

## 🎨 Ejemplo Completo

Ver `src/components/legal-acts/IntakeFormWithHydration.tsx` para un ejemplo funcional completo que demuestra:

- ✅ Hidratación automática de clientes (primera y segunda parte)
- ✅ Hidratación de notario
- ✅ Cascadas geográficas automáticas
- ✅ Campos readonly autocompletados
- ✅ Validación antes de generación
- ✅ Numeración automática
- ✅ Generación de DOCX (no HTML)

---

## 🚀 Próximos Pasos

Para integrar en formularios existentes:

1. **Convertir a react-hook-form** si usan `useState` directo
2. **Pasar prop `form`** a ClientSelector/NotarioSelector
3. **Agregar cascadas geo** con `resetGeoCascade`
4. **Validar antes de generar** con helpers de validación
5. **Confiar en trigger DB** para numeración automática

---

## 📚 Archivos Clave

- `src/lib/formHydrate.ts` - Helper único de hidratación
- `src/components/legal-acts/ClientSelector.tsx` - Selector con hidratación
- `src/components/legal-acts/NotarioSelector.tsx` - Selector de notarios
- `src/components/legal-acts/IntakeFormWithHydration.tsx` - Ejemplo completo
- `src/lib/forms/validation.ts` - Validaciones pre-generación
- `supabase/migrations/*assign_numero_acto*.sql` - Numeración automática
