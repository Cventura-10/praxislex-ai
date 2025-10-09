# Implementación PraxisLex - Resumen de Mejoras

## ✅ Completado

### 1. Documentación de Formularios (FORMS_IA_INTAKE.md)
- ✅ Creado documento maestro con especificaciones completas
- ✅ Convenciones de nomenclatura (MAYÚSCULAS_CON_GUIONES)
- ✅ Estructura estándar de formularios jurídicos
- ✅ Prompts base por materia (Civil, Constitucional, Laboral, Inmobiliario)
- ✅ Guardrails del asistente IA
- ✅ Índice de modelos implementados (9 tipos de documentos)

### 2. Validaciones con Zod (src/lib/validation/formsIntake.ts)
- ✅ `modeloBaseSchema` - Validación de esquemas de modelos
- ✅ `intakeCompletoSchema` - Validación completa de formularios
- ✅ Esquemas específicos por materia:
  - Civil: Cobro de pesos, Daños, Referimiento
  - Constitucional: Amparo
  - Laboral: Prestaciones
  - Inmobiliario: Deslinde
- ✅ Helpers de validación:
  - `campoRequerido()` - Manejo de campos opcionales
  - `validarCedula()` - Formato de cédula dominicana
  - `anonimizarPII()` - Anonimización antes de LLM
  - `restituirPII()` - Restitución después de LLM
  - `validarPetitorioNumerado()` - Verifica formato PRIMERO/SEGUNDO

### 3. Branding PraxisLex (src/components/branding/PraxisLexBranding.tsx)
- ✅ Componente `PraxisLexLogo` reutilizable (tamaños sm/md/lg)
- ✅ Componente `PraxisLexHeader` con logo integrado
- ✅ Componente `PraxisLexFooter` con copyright
- ✅ Logo ya integrado en Header existente (src/components/layout/Header.tsx)

### 4. Metadatos y SEO (index.html)
- ✅ Open Graph tags completos (Facebook)
- ✅ Twitter Card tags
- ✅ Meta descripción optimizada
- ✅ Keywords relevantes para búsqueda
- ✅ Favicon y manifest.json ya configurados
- ✅ Fuentes Playfair Display + Inter cargadas

## 📋 Próximos Pasos Recomendados

### 5. Integración del Asistente IA
```typescript
// En src/pages/AILegalDrafting.tsx o nuevo componente
import { anonimizarPII, restituirPII } from "@/lib/validation/formsIntake";

const generateDocument = async (formData: IntakeCompleto) => {
  // 1. Cargar FORMS_IA_INTAKE.md como contexto
  const formsPrompt = await loadFormsPrompt();
  
  // 2. Anonimizar PII
  const sanitizedData = {
    ...formData,
    hechos: anonimizarPII(formData.hechos),
    fundamentos: anonimizarPII(formData.fundamentos)
  };
  
  // 3. Componer prompt
  const systemPrompt = "Eres un asistente jurídico experto en derecho dominicano...";
  const contextPrompt = formsPrompt + schema.prompt_base;
  const userPrompt = `Genera ${schema.nombre_tecnico} con estos datos:\n${JSON.stringify(sanitizedData)}`;
  
  // 4. Llamar a edge function con Lovable AI
  const { data } = await supabase.functions.invoke('generate-legal-doc', {
    body: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contextPrompt + "\n\n" + userPrompt }
      ]
    }
  });
  
  // 5. Restituir PII en documento generado
  return restituirPII(data.content, piiMapping);
};
```

### 6. Edge Function para Lovable AI
```typescript
// supabase/functions/generate-legal-doc/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Gratis durante periodo promocional
        messages,
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### 7. Exportación DOCX/PDF
```typescript
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

const createDocxDocument = (content: string) => {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1418,    // 2.5 cm
            right: 1418,
            bottom: 1418,
            left: 1418,
          }
        }
      },
      children: [
        // Logo PraxisLex en header
        new Paragraph({
          children: [
            new TextRun({
              text: "PraxisLex",
              font: "Times New Roman",
              size: 32,
              bold: true,
            })
          ],
          alignment: AlignmentType.CENTER,
        }),
        
        // Contenido del documento
        ...parseContentToParagraphs(content)
      ]
    }]
  });

  return Packer.toBlob(doc);
};
```

### 8. Tests de Validación
```typescript
// src/lib/validation/__tests__/formsIntake.test.ts
import { describe, it, expect } from 'vitest';
import { 
  modeloBaseSchema, 
  intakeCompletoSchema,
  validarCedula,
  anonimizarPII 
} from '../formsIntake';

describe('Validaciones Intake', () => {
  it('valida nombre técnico correcto', () => {
    expect(
      modeloBaseSchema.safeParse({
        nombre_tecnico: 'CIVIL_COBRO_PESOS',
        materia: 'Civil',
        tipo: 'Acto judicial',
        campos: ['demandante', 'demandado'],
        prompt_base: 'Redacta...'
      }).success
    ).toBe(true);
  });

  it('rechaza nombre técnico con minúsculas', () => {
    expect(
      modeloBaseSchema.safeParse({
        nombre_tecnico: 'civil_cobro_pesos',
        materia: 'Civil',
        tipo: 'Acto',
        campos: ['demandante'],
        prompt_base: 'Test'
      }).success
    ).toBe(false);
  });

  it('anonimiza cédulas correctamente', () => {
    const texto = 'Juan Pérez, cédula 001-1234567-1';
    const anonimizado = anonimizarPII(texto);
    expect(anonimizado).toContain('[[CEDULA]]');
    expect(anonimizado).not.toContain('001-1234567-1');
  });
});
```

## 🔍 Verificación de Seguridad

### RLS Policies - ✅ Implementadas
- `profiles` - Políticas owner-only activas
- `legal_documents` - Políticas de acceso por usuario
- `cases`, `clients`, `invoices` - Todas con RLS habilitado

### Anonimización de PII
- Cédulas: `\d{3}-?\d{7}-?\d{1}` → `[[CEDULA]]`
- Emails: `[\w.+-]+@[\w-]+\.[\w.-]+` → `[[EMAIL]]`
- Teléfonos: `\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}` → `[[TEL]]`

## 📊 Modelos Jurídicos Disponibles

| ID | Título | Materia | Campos |
|----|--------|---------|---------|
| CIVIL_COBRO_PESOS | Demanda en cobro de pesos | Civil | 31 |
| CONST_AMPARO | Acción de amparo | Constitucional | 16 |
| CONST_HABEAS_CORPUS | Acción de Habeas Corpus | Constitucional | 8 |
| CONST_HABEAS_DATA | Acción de Habeas Data | Constitucional | 8 |
| CIVIL_REFERIMIENTO | Referimiento | Civil | 7 |
| LAB_PRESTACIONES | Prestaciones laborales | Laboral | 19 |
| INMO_DESLINDE | Deslinde/Saneamiento | Inmobiliario | 8 |
| CIVIL_DANOS_PERJUICIOS | Daños y Perjuicios | Civil | 18 |
| CIVIL_REIVINDICACION | Reivindicación | Civil | 9 |

## 🎨 Tokens de Diseño

Los siguientes tokens HSL están configurados en `src/index.css`:

```css
:root {
  --praxis-green: 162 75% 24%;      /* #0E6B4E */
  --praxis-slate: 217 33% 17%;      /* #1E293B */
  --praxis-gold: 44 65% 53%;        /* #D4AF37 */
  --praxis-cream: 60 33% 96%;       /* #F7F5EF */
}
```

## 📝 Checklist de Deployment

- [ ] Verificar .env con variables Supabase
- [ ] Crear edge function `generate-legal-doc`
- [ ] Habilitar Lovable AI en proyecto
- [ ] Cargar FORMS_IA_INTAKE.md en contexto del LLM
- [ ] Implementar exportación DOCX con logo
- [ ] Ejecutar tests de validación
- [ ] Verificar RLS en todas las tablas
- [ ] Optimizar Web Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] Configurar PWA manifest con logos PraxisLex

---

**Última actualización**: 2025-10-09  
**Versión de documentación**: 1.0  
**Responsable**: Tech Lead PraxisLex
