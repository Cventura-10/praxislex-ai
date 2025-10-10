import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Generate cryptographically secure random token
 */
const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Simple Resend API client
const sendEmail = async (apiKey: string, emailData: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
};



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  clientId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { clientId }: InvitationRequest = await req.json();

    // Verificar que el cliente pertenece al usuario
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      throw new Error("Cliente no encontrado");
    }

    if (!client.email) {
      throw new Error("El cliente no tiene email registrado");
    }

    // Generate secure invitation token
    const invitationToken = generateSecureToken();
    
    // Hash token before storage using secure RPC
    const { data: tokenHash, error: hashError } = await supabase.rpc('hash_invitation_token', {
      p_token: invitationToken
    });

    if (hashError || !tokenHash) {
      console.error("Error hashing token:", hashError);
      throw new Error("Error al generar hash del token");
    }

    // Store only the hashed token (never plain text)
    const { error: invitationError } = await supabase
      .from("client_invitations")
      .insert({
        client_id: clientId,
        token_hash: tokenHash,
        created_by: user.id,
      });

    if (invitationError) {
      throw invitationError;
    }

    const invitationUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com')}/invitation-accept?token=${invitationToken}`;

    // Enviar email de invitación
    const emailResponse = await sendEmail(Deno.env.get("RESEND_API_KEY") ?? "", {
      from: "PraxisLex <onboarding@resend.dev>",
      to: [client.email],
      subject: "Invitación al Portal del Cliente - PraxisLex",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitación al Portal del Cliente</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Bienvenido a PraxisLex</h1>
              <p style="margin: 10px 0 0 0; color: #f0f0f0; font-size: 16px;">Portal del Cliente</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333; font-size: 22px;">Estimado/a ${client.nombre_completo},</h2>
              
              <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                Su abogado le ha invitado a acceder al Portal del Cliente de PraxisLex, donde podrá:
              </p>
              
              <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #666; font-size: 15px; line-height: 1.8;">
                <li>Consultar el estado de sus casos en tiempo real</li>
                <li>Ver próximas audiencias programadas</li>
                <li>Revisar facturas y estado de cuenta</li>
                <li>Acceder a documentos legales relacionados con sus casos</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Acceder al Portal
                </a>
              </div>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                  <strong style="color: #333;">Importante:</strong> En su primer acceso deberá aceptar los términos y condiciones para el manejo de su información personal conforme al acuerdo de cuota-litis firmado.
                </p>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #999; font-size: 13px; line-height: 1.6;">
                Si tiene alguna duda o problema para acceder, por favor contacte con su abogado.
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} PraxisLex. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Invitación enviada:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitación enviada exitosamente",
        invitationUrl 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error en send-client-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
