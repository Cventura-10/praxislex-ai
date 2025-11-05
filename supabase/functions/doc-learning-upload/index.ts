import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema de validación
const uploadSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_type: z.string().min(1),
  file_size: z.number().positive().max(20971520), // 20MB
  file_url: z.string().url(),
  pages: z.number().int().positive().optional(),
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
    const validationResult = uploadSchema.safeParse(rawPayload);
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

    // Calcular checksum (simplificado)
    const checksum = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(payload.file_url + payload.file_name)
    );
    const checksumHex = Array.from(new Uint8Array(checksum))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Insertar registro en doc_learning_uploads
    const { data, error } = await supabase
      .from('doc_learning_uploads')
      .insert({
        tenant_id: tenantData,
        user_id: user.id,
        file_url: payload.file_url,
        file_name: payload.file_name,
        file_type: payload.file_type,
        file_size: payload.file_size,
        pages: payload.pages,
        checksum_sha256: checksumHex,
        status: 'queued'
      })
      .select()
      .single();

    if (error) {
      console.error('Error al registrar upload:', error);
      return new Response(
        JSON.stringify({ error: 'Error al procesar la solicitud. Contacte soporte.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        upload_id: data.id,
        message: 'Archivo registrado exitosamente' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en doc-learning-upload:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud. Contacte soporte.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
