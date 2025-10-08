import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const templateId = formData.get('templateId') as string;
    const titulo = formData.get('titulo') as string;
    const materia = formData.get('materia') as string;
    const tipoDocumento = formData.get('tipoDocumento') as string;
    const fieldsSchema = formData.get('fieldsSchema') as string;

    if (!file || !templateId || !titulo || !materia || !tipoDocumento) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    if (!file.type.includes('word') && !file.type.includes('msword')) {
      return new Response(JSON.stringify({ error: 'Only .docx files are allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (10MB max)
    if (file.size > 10485760) {
      return new Response(JSON.stringify({ error: 'File size exceeds 10MB limit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload file to storage
    const fileName = `${user.id}/${templateId}_${Date.now()}.docx`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('legal-models')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload file', details: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse fields schema
    let parsedFieldsSchema;
    try {
      parsedFieldsSchema = fieldsSchema ? JSON.parse(fieldsSchema) : [];
    } catch (e) {
      parsedFieldsSchema = [];
    }

    // Insert template metadata
    const { data: templateData, error: templateError } = await supabase
      .from('legal_model_templates')
      .insert({
        user_id: user.id,
        template_id: templateId,
        titulo,
        materia,
        tipo_documento: tipoDocumento,
        storage_path: uploadData.path,
        fields_schema: parsedFieldsSchema
      })
      .select()
      .single();

    if (templateError) {
      console.error('Template insert error:', templateError);
      // Clean up uploaded file
      await supabase.storage.from('legal-models').remove([fileName]);
      return new Response(JSON.stringify({ error: 'Failed to save template metadata', details: templateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      template: templateData,
      message: 'Modelo jurídico registrado exitosamente'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error processing legal model:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
