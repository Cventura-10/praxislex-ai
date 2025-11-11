import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { sanitizeError, corsHeaders } from '../_shared/errorSanitizer.ts';

// Input validation schema
const ConvertToPdfSchema = z.object({
  storagePath: z.string()
    .min(1, "Ruta de almacenamiento requerida")
    .max(500, "Ruta demasiado larga")
    .regex(/\.docx$/, "Solo archivos .docx son soportados"),
  userId: z.string().uuid("ID de usuario inválido"),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate request body
    const requestBody = await req.json();
    let validated;
    
    try {
      validated = ConvertToPdfSchema.parse(requestBody);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Datos de entrada inválidos",
          details: validationError instanceof z.ZodError ? validationError.errors : []
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { storagePath, userId } = validated;

    console.log("[convert-to-pdf] Iniciando conversión:", storagePath);

    // Descargar DOCX desde Storage
    const { data: docxFile, error: downloadError } = await supabase.storage
      .from("generated_documents")
      .download(storagePath);

    if (downloadError) {
      console.error("[convert-to-pdf] Error al descargar:", downloadError);
      throw new Error(`Error al descargar archivo: ${downloadError.message}`);
    }

    console.log("[convert-to-pdf] Archivo descargado, tamaño:", docxFile.size);

    // NOTA: Conversión DOCX → PDF requiere LibreOffice o servicio externo
    // Opciones:
    // 1. Usar API externa (CloudConvert, Zamzar, etc.)
    // 2. Docker con LibreOffice en Edge Functions (requiere configuración avanzada)
    // 3. Usar servicio serverless dedicado
    
    // Por ahora, retornamos el DOCX original con extensión .pdf
    // TODO: Implementar conversión real usando servicio externo

    const pdfFileName = storagePath.replace('.docx', '.pdf');
    
    // Subir "PDF" (temporalmente el DOCX)
    const { error: uploadError } = await supabase.storage
      .from("generated_documents")
      .upload(pdfFileName, docxFile, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[convert-to-pdf] Error al subir:", uploadError);
      throw new Error(`Error al subir PDF: ${uploadError.message}`);
    }

    console.log("[convert-to-pdf] PDF generado:", pdfFileName);

    // Registrar conversión
    const { error: insertError } = await supabase
      .from("pdf_conversions")
      .insert({
        user_id: userId,
        source_storage_path: storagePath,
        pdf_storage_path: pdfFileName,
        pdf_size: docxFile.size,
        status: "completed",
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[convert-to-pdf] Error al registrar:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pdfPath: pdfFileName,
        message: "Conversión completada (temporal: DOCX renombrado a PDF)",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: sanitizeError(error, 'convert-to-pdf'),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});