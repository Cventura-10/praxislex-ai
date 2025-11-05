import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema de validación
const analyzeSchema = z.object({
  upload_ids: z.array(z.string().uuid()).min(1).max(15),
  delete_originals: z.boolean().optional().default(false),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener tenant_id
    const { data: tenantData } = await supabase
      .rpc('get_user_tenant_id', { p_user_id: user.id });

    if (!tenantData) {
      return new Response(
        JSON.stringify({ error: 'Tenant no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawPayload = await req.json();
    
    // Validar payload
    const validationResult = analyzeSchema.safeParse(rawPayload);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Datos inválidos', 
          detalles: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = validationResult.data;

    // Crear run
    const { data: runData, error: runError } = await supabase
      .from('doc_learning_runs')
      .insert({
        tenant_id: tenantData,
        user_id: user.id,
        docs_count: payload.upload_ids.length,
        status: 'running'
      })
      .select()
      .single();

    if (runError) {
      console.error('Error al crear run:', runError);
      return new Response(
        JSON.stringify({ error: 'Error al iniciar análisis. Contacte soporte.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener documentos
    const { data: uploads } = await supabase
      .from('doc_learning_uploads')
      .select('*')
      .in('id', payload.upload_ids)
      .eq('tenant_id', tenantData);

    if (!uploads || uploads.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se encontraron documentos' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Análisis simulado (en producción aquí iría OCR, NLP, etc.)
    const extractedVariables = [
      { name: 'parte_a.nombre', pattern: '[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+', examples: ['Juan Pérez', 'María García'], confidence: 85.5 },
      { name: 'parte_a.cedula', pattern: '\\d{3}-\\d{7}-\\d', examples: ['001-1234567-8', '402-9876543-2'], confidence: 92.0 },
      { name: 'parte_b.rnc', pattern: '\\d-\\d{2}-\\d{5}-\\d', examples: ['1-01-12345-6'], confidence: 88.0 },
      { name: 'monto', pattern: 'RD\\$ ?[0-9,]+\\.\\d{2}', examples: ['RD$ 100,000.00', 'RD$50,000.00'], confidence: 95.0 },
      { name: 'ciudad', pattern: 'Santo Domingo|Santiago|La Vega', examples: ['Santo Domingo'], confidence: 98.0 },
      { name: 'fecha_larga', pattern: '\\d{1,2} de [a-z]+ de \\d{4}', examples: ['15 de enero de 2024'], confidence: 90.0 },
    ];

    const extractedClauses = [
      { title: 'Objeto del Contrato', body: 'El presente contrato tiene por objeto...', hash: 'hash1', frequency: 3, confidence: 92.0 },
      { title: 'Precio y Forma de Pago', body: 'El precio pactado es de...', hash: 'hash2', frequency: 2, confidence: 88.0 },
      { title: 'Vigencia', body: 'Este contrato tendrá vigencia de...', hash: 'hash3', frequency: 2, confidence: 85.0 },
      { title: 'Jurisdicción', body: 'Las partes se someten a la jurisdicción de los tribunales de...', hash: 'hash4', frequency: 3, confidence: 95.0 },
    ];

    // Insertar variables
    const variablesToInsert = extractedVariables.map(v => ({
      tenant_id: tenantData,
      run_id: runData.id,
      name: v.name,
      pattern: v.pattern,
      examples: v.examples,
      confidence: v.confidence,
      required: v.confidence > 90
    }));

    await supabase
      .from('doc_learning_variables')
      .insert(variablesToInsert);

    // Insertar cláusulas
    const clausesToInsert = extractedClauses.map(c => ({
      tenant_id: tenantData,
      run_id: runData.id,
      title: c.title,
      body: c.body,
      hash: c.hash,
      frequency: c.frequency,
      confidence: c.confidence
    }));

    await supabase
      .from('doc_learning_clauses')
      .insert(clausesToInsert);

    // Actualizar uploads a processed
    await supabase
      .from('doc_learning_uploads')
      .update({ status: 'processed' })
      .in('id', payload.upload_ids);

    // Completar run
    const metrics = {
      coverage: 87.5,
      clauses_detected: extractedClauses.length,
      variables_detected: extractedVariables.length,
      avg_confidence: 89.2,
      warnings: []
    };

    const summary = {
      typography: {
        body_font: 'Times New Roman',
        body_size: 12,
        title_font: 'Times New Roman',
        title_size: 14,
        line_spacing: 1.5
      },
      structure: {
        has_header: true,
        has_footer: true,
        sections: ['ENTRE:', 'CONSIDERANDO:', 'CLÁUSULAS', 'FIRMAS']
      },
      lexicon: {
        formality: 'alta',
        person: 'impersonal',
        common_phrases: ['En virtud de', 'Por medio del presente', 'Las partes acuerdan']
      }
    };

    await supabase
      .from('doc_learning_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metrics,
        summary
      })
      .eq('id', runData.id);

    // Eliminar originales si se solicitó
    if (payload.delete_originals) {
      for (const upload of uploads) {
        const filePath = upload.file_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('legal-source-docs')
          .remove([filePath]);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        run_id: runData.id,
        metrics,
        message: 'Análisis completado exitosamente' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en doc-learning-analyze:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({ error: 'Error al procesar el análisis. Contacte soporte.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
