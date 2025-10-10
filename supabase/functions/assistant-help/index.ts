import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

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

      switch (reply.intent) {
        case "create_hearing": {
          const { case_id, fecha, hora, tribunal, tipo, descripcion } = reply.params;
          
          // Obtener case_number del caso
          const { data: caseData } = await supabaseAdmin
            .from("cases")
            .select("case_number")
            .eq("id", case_id)
            .single();
          
          caseNumber = caseData?.case_number || null;

          result = await supabaseAdmin
            .from("hearings")
            .insert({
              user_id: user.id,
              case_id,
              case_number: caseNumber,
              fecha,
              hora,
              juzgado: tribunal,
              tipo,
              caso: descripcion || "",
              estado: "programada",
            })
            .select()
            .single();
          break;
        }

        case "create_invoice": {
          const { client_id, concepto, monto } = reply.params;
          
          // Obtener case_number del último caso del cliente
          const { data: caseData } = await supabaseAdmin
            .from("cases")
            .select("case_number")
            .eq("client_id", client_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          caseNumber = caseData?.case_number || null;

          result = await supabaseAdmin
            .from("invoices")
            .insert({
              user_id: user.id,
              client_id,
              case_number: caseNumber,
              numero_factura: `INV-${Date.now()}`,
              concepto,
              monto,
              estado: "pendiente",
              fecha: new Date().toISOString().split('T')[0],
            })
            .select()
            .single();
          break;
        }

        case "create_case": {
          const { client_id, titulo, descripcion, materia } = reply.params;
          
          result = await supabaseAdmin
            .from("cases")
            .insert({
              user_id: user.id,
              client_id,
              titulo,
              descripcion: descripcion || "",
              materia: materia || "General",
              estado: "activo",
            })
            .select()
            .single();
          
          caseNumber = result.data?.case_number || null;
          break;
        }

        case "create_document": {
          const { titulo, tipo_documento, materia, contenido } = reply.params;
          
          result = await supabaseAdmin
            .from("legal_documents")
            .insert({
              user_id: user.id,
              titulo,
              tipo_documento,
              materia,
              contenido: contenido || "",
            })
            .select()
            .single();
          break;
        }

        case "create_expense": {
          const { concepto, monto, categoria, case_id } = reply.params;
          
          if (case_id) {
            const { data: caseData } = await supabaseAdmin
              .from("cases")
              .select("case_number")
              .eq("id", case_id)
              .single();
            
            caseNumber = caseData?.case_number || null;
          }

          result = await supabaseAdmin
            .from("expenses")
            .insert({
              user_id: user.id,
              case_id,
              case_number: caseNumber,
              concepto,
              monto,
              categoria,
              fecha: new Date().toISOString().split('T')[0],
            })
            .select()
            .single();
          break;
        }

        case "create_payment": {
          const { client_id, monto, concepto, metodo_pago } = reply.params;
          
          // Obtener case_number del último caso del cliente
          const { data: caseData } = await supabaseAdmin
            .from("cases")
            .select("case_number")
            .eq("client_id", client_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          caseNumber = caseData?.case_number || null;

          result = await supabaseAdmin
            .from("payments")
            .insert({
              user_id: user.id,
              client_id,
              case_number: caseNumber,
              monto,
              concepto,
              metodo_pago,
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
