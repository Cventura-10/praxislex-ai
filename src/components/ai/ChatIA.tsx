import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatIAProps {
  context?: string;
  onAction?: (intent: string, result: any) => void;
}

export function ChatIA({ context, onAction }: ChatIAProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola, soy tu asistente de PraxisLex. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("assistant-help", {
        body: {
          message: input,
          context: context || "Usuario interactuando con el sistema PraxisLex",
          history: messages.slice(-10), // Últimos 10 mensajes para contexto
        },
      });

      console.log('📡 Assistant response:', { data, error });

      if (error) {
        console.error('❌ Assistant error:', error);
        
        // Manejar errores específicos
        if (error.message?.includes('RATE_LIMIT') || error.message?.includes('rate limit')) {
          throw new Error('Has excedido el límite de solicitudes. Por favor, espera unos minutos antes de intentar nuevamente.');
        }
        if (error.message?.includes('402') || error.message?.includes('Payment')) {
          throw new Error('Créditos de IA agotados. Por favor, recarga en Configuración.');
        }
        if (error.message?.includes('429') || error.message?.includes('límite')) {
          throw new Error('Límite de solicitudes excedido. Intenta nuevamente en unos momentos.');
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('No se recibió respuesta del asistente');
      }

      if (data.mode === "action") {
        // Acción ejecutada
        toast.success(data.confirmation, {
          description: data.intent,
        });
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.confirmation,
          },
        ]);

        // Callback opcional para que el padre maneje la acción
        onAction?.(data.intent, data.result);
      } else if (data.mode === "disambiguation") {
        // Múltiples clientes coinciden - mostrar opciones
        const choicesText = data.choices
          .map((c: any, idx: number) => `${idx + 1}. ${c.nombre}`)
          .join("\n");
        
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `${data.message}\n\n${choicesText}\n\nResponde con el número del cliente correcto.`,
          },
        ]);
      } else if (data.mode === "need_more_info") {
        // Necesita más información
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
          },
        ]);
      } else if (data.mode === "error") {
        toast.error("Error", {
          description: data.reply,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
          },
        ]);
      } else {
        // Modo conversacional
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
          },
        ]);
      }
    } catch (e: any) {
      console.error("❌ Error en asistente:", e);
      
      const errorMessage = e?.message || e?.error?.message || "No se pudo procesar tu solicitud";
      
      toast.error("Error", {
        description: errorMessage,
      });
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Disculpa, ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-elegant">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Asistente IA
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-secondary" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Escribe tu mensaje o solicitud..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ejemplos: "Crea una audiencia para mañana", "Registra una factura de RD$2,500"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
