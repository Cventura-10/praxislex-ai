import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ==========================================
// INPUT VALIDATION & SANITIZATION (Security Fix)
// ==========================================

// Sanitize text inputs - remove HTML/scripts, limit length
function sanitizeText(text: string, maxLength = 1000): string {
  return text
    .trim()
    .substring(0, maxLength)
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ''); // Strip all HTML tags
}

// Validation schemas for each AI action type
const CreateCaseSchema = z.object({
  titulo: z.string().min(1).max(200),
  client_id: z.string().uuid().optional(),
  materia: z.string().max(100).optional(),
  descripcion: z.string().max(2000).optional(),
});

const CreateHearingSchema = z.object({
  case_id: z.string().uuid(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  tribunal: z.string().max(200),
  tipo: z.string().max(50).optional(),
  descripcion: z.string().max(1000).optional(),
});

const CreateInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  concepto: z.string().min(1).max(500),
  monto: z.number().positive().max(999999999),
});

const CreateDocumentSchema = z.object({
  titulo: z.string().min(1).max(200),
  tipo_documento: z.string().max(50),
  materia: z.string().max(100),
  contenido: z.string().max(50000),
});

const CreateExpenseSchema = z.object({
  concepto: z.string().min(1).max(500),
  monto: z.number().positive().max(999999999),
  categoria: z.string().max(50),
  case_id: z.string().uuid().optional(),
});

const CreatePaymentSchema = z.object({
  client_id: z.string().uuid(),
  monto: z.number().positive().max(999999999),
  concepto: z.string().min(1).max(500),
  metodo_pago: z.string().max(50),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { message, context, history } = await req.json();

    const systemPrompt = `Eres el asistente operativo de PraxisLex, un sistema de gestión jurídica.

Puedes:
1. Responder preguntas sobre el sistema
2. Guiar a los usuarios en sus tareas
3. Detectar intenciones de crear registros (casos, audiencias, facturas, documentos)

Cuando detectes una intención clara de crear algo, responde en formato JSON:
{
  "intent": "tipo_de_accion",
  "params": { datos_necesarios },
  "confirmation": "Mensaje de confirmación para el usuario"
}

Intenciones soportadas:
- create_case: Crear nuevo caso jurídico
- create_hearing: Crear audiencia
- create_invoice: Crear factura
- create_document: Crear documento legal
- create_expense: Registrar gasto
- create_payment: Registrar pago
- none: Solo respuesta conversacional

Si no hay intención clara de acción, responde texto normal orientando al usuario.
Contexto del usuario: ${context || "Sin contexto adicional"}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          { role: "system", content: systemPrompt },
          ...(history || []),
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de uso excedido. Intenta más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados. Contacta al administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const rawReply = aiData.choices?.[0]?.message?.content?.trim() || "";
    
    let reply: any;
    try {
      reply = JSON.parse(rawReply);
    } catch {
      reply = { intent: "none", text: rawReply };
    }

    // Ejecutar acciones según la intención
    if (reply.intent && reply.intent !== "none") {
      let result: any = null;
      let caseNumber: string | null = null;

      // ==========================================
      // VALIDATE & SANITIZE ALL INPUTS (Security)
      // ==========================================
      
      try {
        switch (reply.intent) {
          case "create_hearing": {
            // Validate inputs with Zod
            const validated = CreateHearingSchema.parse(reply.params);
            const sanitized = {
              ...validated,
              tribunal: sanitizeText(validated.tribunal, 200),
              descripcion: validated.descripcion ? sanitizeText(validated.descripcion, 1000) : "",
            };
            
            // Obtener case_number del caso
            const { data: caseData } = await supabaseAdmin
              .from("cases")
              .select("case_number")
              .eq("id", sanitized.case_id)
              .single();
            
            caseNumber = caseData?.case_number || null;

            result = await supabaseAdmin
              .from("hearings")
              .insert({
                user_id: user.id,
                case_id: sanitized.case_id,
                case_number: caseNumber,
                fecha: sanitized.fecha,
                hora: sanitized.hora,
                juzgado: sanitized.tribunal,
                tipo: sanitized.tipo || "audiencia",
                caso: sanitized.descripcion,
                estado: "programada",
              })
              .select()
              .single();
            break;
          }

          case "create_invoice": {
            const validated = CreateInvoiceSchema.parse(reply.params);
            const sanitized = {
              ...validated,
              concepto: sanitizeText(validated.concepto, 500),
            };
            
            // Obtener case_number del último caso del cliente
            const { data: caseData } = await supabaseAdmin
              .from("cases")
              .select("case_number")
              .eq("client_id", sanitized.client_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();
            
            caseNumber = caseData?.case_number || null;

            result = await supabaseAdmin
              .from("invoices")
              .insert({
                user_id: user.id,
                client_id: sanitized.client_id,
                case_number: caseNumber,
                numero_factura: `INV-${Date.now()}`,
                concepto: sanitized.concepto,
                monto: sanitized.monto,
                estado: "pendiente",
                fecha: new Date().toISOString().split('T')[0],
              })
              .select()
              .single();
            break;
          }

          case "create_case": {
            const validated = CreateCaseSchema.parse(reply.params);
            const sanitized = {
              ...validated,
              titulo: sanitizeText(validated.titulo, 200),
              descripcion: validated.descripcion ? sanitizeText(validated.descripcion, 2000) : "",
              materia: validated.materia ? sanitizeText(validated.materia, 100) : "General",
            };
            
            result = await supabaseAdmin
              .from("cases")
              .insert({
                user_id: user.id,
                client_id: sanitized.client_id || null,
                titulo: sanitized.titulo,
                descripcion: sanitized.descripcion,
                materia: sanitized.materia,
                estado: "activo",
              })
              .select()
              .single();
            
            caseNumber = result.data?.case_number || null;
            break;
          }

          case "create_document": {
            const validated = CreateDocumentSchema.parse(reply.params);
            const sanitized = {
              ...validated,
              titulo: sanitizeText(validated.titulo, 200),
              tipo_documento: sanitizeText(validated.tipo_documento, 50),
              materia: sanitizeText(validated.materia, 100),
              contenido: sanitizeText(validated.contenido, 50000),
            };
            
            result = await supabaseAdmin
              .from("legal_documents")
              .insert({
                user_id: user.id,
                titulo: sanitized.titulo,
                tipo_documento: sanitized.tipo_documento,
                materia: sanitized.materia,
                contenido: sanitized.contenido,
              })
              .select()
              .single();
            break;
          }

          case "create_expense": {
            const validated = CreateExpenseSchema.parse(reply.params);
            const sanitized = {
              ...validated,
              concepto: sanitizeText(validated.concepto, 500),
              categoria: sanitizeText(validated.categoria, 50),
            };
            
            if (sanitized.case_id) {
              const { data: caseData } = await supabaseAdmin
                .from("cases")
                .select("case_number")
                .eq("id", sanitized.case_id)
                .single();
              
              caseNumber = caseData?.case_number || null;
            }

            result = await supabaseAdmin
              .from("expenses")
              .insert({
                user_id: user.id,
                case_id: sanitized.case_id || null,
                case_number: caseNumber,
                concepto: sanitized.concepto,
                monto: sanitized.monto,
                categoria: sanitized.categoria,
                fecha: new Date().toISOString().split('T')[0],
              })
              .select()
              .single();
            break;
          }

          case "create_payment": {
            const validated = CreatePaymentSchema.parse(reply.params);
            const sanitized = {
              ...validated,
              concepto: sanitizeText(validated.concepto, 500),
              metodo_pago: sanitizeText(validated.metodo_pago, 50),
            };
            
            // Obtener case_number del último caso del cliente
            const { data: caseData } = await supabaseAdmin
              .from("cases")
              .select("case_number")
              .eq("client_id", sanitized.client_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();
            
            caseNumber = caseData?.case_number || null;

            result = await supabaseAdmin
              .from("payments")
              .insert({
                user_id: user.id,
                client_id: sanitized.client_id,
                case_number: caseNumber,
                monto: sanitized.monto,
                concepto: sanitized.concepto,
                metodo_pago: sanitized.metodo_pago,
                fecha: new Date().toISOString().split('T')[0],
              })
              .select()
              .single();
            break;
          }

          default:
            result = { message: "Acción no reconocida" };
        }

        // Registrar acción en log
        await supabaseAdmin.from("ai_actions_log").insert({
          user_id: user.id,
          user_token: token.substring(0, 20),
          intent: reply.intent,
          params: reply.params,
          case_number: caseNumber,
        });

        const expedienteMsg = caseNumber ? ` Expediente: ${caseNumber}` : "";
        
        return new Response(
          JSON.stringify({
            mode: "action",
            intent: reply.intent,
            confirmation: `${reply.confirmation || "Operación completada"}.${expedienteMsg}`,
            result: result.data,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (validationError) {
        // Input validation failed - return error to user
        console.error("Validation error:", validationError);
        return new Response(
          JSON.stringify({
            mode: "error",
            reply: "Los datos proporcionados no son válidos. Por favor, verifica la información e intenta de nuevo.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Modo conversacional
    return new Response(
      JSON.stringify({ mode: "chat", reply: reply.text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Assistant error:", error);
    return new Response(
      JSON.stringify({ 
        mode: "error",
        reply: "Ocurrió un error procesando tu solicitud. Por favor, intenta de nuevo." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});