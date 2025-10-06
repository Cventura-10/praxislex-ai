import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    // Auth verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { audio, mimeType } = await req.json();

    // Input validation
    if (!audio || audio.length > 25000000) {
      return new Response(JSON.stringify({ error: 'Invalid audio data' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!audio) {
      throw new Error('No se proporcionó audio');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    console.log('Procesando audio para transcripción...');

    // Decodificar base64 audio
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Crear FormData
    const formData = new FormData();
    // Usar el tipo MIME recibido o por defecto webm
    const type = typeof mimeType === 'string' && mimeType ? mimeType : 'audio/webm';
    const extMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/ogg': 'ogg',
      'audio/ogg;codecs=opus': 'ogg',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
    };
    const ext = extMap[type] || 'webm';
    const blob = new Blob([bytes], { type });
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

    // Llamar a OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de OpenAI:', response.status, errorText);

      // Propagar códigos específicos para mejor manejo en el cliente
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'API de voz no configurada o inválida. Verifica la clave.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de transcripción excedido. Intenta nuevamente más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Error al transcribir audio');
    }

    const result = await response.json();
    console.log('Transcripción exitosa');

    return new Response(
      JSON.stringify({ text: result.text }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error en transcribe-audio:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
