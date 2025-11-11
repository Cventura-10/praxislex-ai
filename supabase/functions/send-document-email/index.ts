import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { sanitizeError, corsHeaders } from '../_shared/errorSanitizer.ts';

// Input validation schema
const SendEmailSchema = z.object({
  to: z.union([
    z.string().email("Email de destinatario inválido").max(255),
    z.array(z.string().email()).max(10, "Máximo 10 destinatarios")
  ]),
  cc: z.union([
    z.string().email("Email CC inválido"),
    z.array(z.string().email()).max(10, "Máximo 10 destinatarios CC")
  ]).optional(),
  subject: z.string().min(1, "Asunto requerido").max(200, "Asunto demasiado largo"),
  body: z.string().min(1, "Cuerpo del mensaje requerido").max(50000, "Cuerpo demasiado largo"),
  documentPath: z.string().max(500, "Ruta de documento demasiado larga").optional(),
  userId: z.string().uuid("ID de usuario inválido").optional(),
  relatedTable: z.string().max(100, "Nombre de tabla inválido").optional(),
  relatedId: z.string().uuid("ID relacionado inválido").optional(),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate request body
    const requestBody = await req.json();
    let validated;
    
    try {
      validated = SendEmailSchema.parse(requestBody);
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

    const { to, cc, subject, body, documentPath, userId, relatedTable, relatedId } = validated;

    console.log("[send-document-email] Enviando email a:", to);

    let attachmentData = null;

    // Si hay documento adjunto, descargarlo
    if (documentPath) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("generated_documents")
        .download(documentPath);

      if (downloadError) {
        console.error("[send-document-email] Error al descargar adjunto:", downloadError);
      } else {
        // Convertir a base64 para Resend
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        attachmentData = {
          filename: documentPath.split("/").pop() || "documento.docx",
          content: base64,
        };
      }
    }

    // Enviar email usando Resend
    const emailPayload: any = {
      from: "PraxisLex <onboarding@resend.dev>", // Cambiar por tu dominio verificado
      to: Array.isArray(to) ? to : [to],
      subject,
      html: body,
    };

    if (cc) {
      emailPayload.cc = Array.isArray(cc) ? cc : [cc];
    }

    if (attachmentData) {
      emailPayload.attachments = [attachmentData];
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Error de Resend: ${JSON.stringify(resendData)}`);
    }

    console.log("[send-document-email] Email enviado:", resendData.id);

    // Registrar en email_logs
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        user_id: userId,
        to_emails: Array.isArray(to) ? to : [to],
        cc_emails: cc ? (Array.isArray(cc) ? cc : [cc]) : null,
        subject,
        body_html: body,
        attachments: attachmentData ? [attachmentData.filename] : [],
        related_table: relatedTable,
        related_id: relatedId,
        status: "sent",
        provider_id: resendData.id,
        provider_response: resendData,
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("[send-document-email] Error al registrar log:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        message: "Email enviado exitosamente",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: sanitizeError(error, 'send-document-email'),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});