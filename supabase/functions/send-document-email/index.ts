import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sanitizeError, corsHeaders } from '../_shared/errorSanitizer.ts';

// NOTA: Esta función requiere RESEND_API_KEY configurado
// El usuario debe crear una cuenta en https://resend.com
// y agregar el API key en los secrets del proyecto

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no configurado. Crea una cuenta en https://resend.com");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      to, 
      cc,
      subject, 
      body, 
      documentPath,
      userId,
      relatedTable,
      relatedId,
    } = await req.json();

    if (!to || !subject || !body) {
      throw new Error("to, subject y body son requeridos");
    }

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