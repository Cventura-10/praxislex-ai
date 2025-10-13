import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ClientMessages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Obtener usuario actual
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Obtener todos los mensajes donde soy el destinatario o remitente (abogado)
  const { data: messages, refetch } = useQuery({
    queryKey: ['lawyer-messages', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      const { data, error } = await supabase
        .from('client_messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      return data;
    },
    enabled: !!currentUser,
    refetchInterval: 5000,
  });

  // Agrupar mensajes por cliente (sender o recipient que no sea el usuario actual)
  const messagesByClient = messages?.reduce((acc: any, msg: any) => {
    // Determinar quién es el cliente (el que no es el usuario actual)
    const clientId = msg.sender_id === currentUser?.id ? msg.recipient_id : msg.sender_id;
    
    if (!acc[clientId]) {
      acc[clientId] = {
        clientId,
        clientEmail: 'Cliente',
        clientName: `Cliente ${clientId.substring(0, 8)}`,
        messages: []
      };
    }
    acc[clientId].messages.push(msg);
    return acc;
  }, {});

  const clientConversations = messagesByClient ? Object.values(messagesByClient) : [];
  const selectedConversation = selectedClientId && messagesByClient?.[selectedClientId];

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedClientId || !currentUser) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('client_messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: selectedClientId,
          sender_type: 'lawyer',
          message: replyMessage.trim(),
        });

      if (error) throw error;

      toast({
        title: "Respuesta enviada",
        description: "Tu mensaje ha sido enviado al cliente",
      });

      setReplyMessage("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mensajes de Clientes</h1>
          <p className="text-muted-foreground">
            Comunicaciones desde el Portal del Cliente
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de conversaciones */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversaciones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {clientConversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay mensajes aún</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {(clientConversations as any[]).map((conv) => {
                    const unreadCount = conv.messages.filter((m: any) => !m.read_at && m.sender_type === 'client').length;
                    return (
                      <button
                        key={conv.clientId}
                        onClick={() => setSelectedClientId(conv.clientId)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedClientId === conv.clientId
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {conv.clientName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm truncate">{conv.clientName}</p>
                              {unreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.messages[0]?.message}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Vista de conversación */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedConversation
                ? `Conversación con ${selectedConversation.clientName}`
                : 'Selecciona una conversación'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedConversation ? (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Selecciona una conversación para ver los mensajes</p>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {selectedConversation.messages
                      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((msg: any) => {
                        const isFromClient = msg.sender_type === 'client';
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isFromClient ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                isFromClient
                                  ? 'bg-muted'
                                  : 'bg-primary text-primary-foreground'
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isFromClient ? 'text-muted-foreground' : 'text-primary-foreground/70'
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleString('es-DO', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || sending}
                    size="icon"
                    className="h-auto"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
