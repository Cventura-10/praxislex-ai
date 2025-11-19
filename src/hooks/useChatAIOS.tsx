import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  agent_name?: string;
  intent_detected?: string;
  confidence?: number;
  created_at: string;
  metadata?: any;
}

export interface ChatConversation {
  id: string;
  context_type: string;
  context_id?: string;
  title?: string;
  last_message_at: string;
}

export function useChatAIOS(contextType: string = 'general', contextId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();

  // Cargar conversación activa al montar
  useEffect(() => {
    loadActiveConversation();
  }, [contextType, contextId]);

  // Suscribirse a nuevos mensajes en tiempo real
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Evitar duplicados
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const loadActiveConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsInitializing(false);
        return;
      }

      // Obtener o crear conversación
      const { data: convId, error: convError } = await supabase.rpc(
        'get_or_create_active_conversation',
        {
          p_user_id: user.id,
          p_context_type: contextType,
          p_context_id: contextId || null,
        }
      );

      if (convError) throw convError;

      setConversationId(convId);

      // Cargar mensajes existentes
      const { data: msgs, error: msgsError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;

      setMessages((msgs || []) as ChatMessage[]);
    } catch (error: any) {
      console.error('[useChatAIOS] Error loading conversation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la conversación',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);

    // Agregar mensaje del usuario optimistically
    const tempUserMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('orquestador-juridico', {
        body: {
          message: content,
          context_type: contextType,
          context_id: contextId,
          conversation_id: conversationId,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      // Actualizar conversation_id si es nueva
      if (data.conversation_id && data.conversation_id !== conversationId) {
        setConversationId(data.conversation_id);
      }

      // El mensaje del asistente llegará por realtime, 
      // pero por si acaso lo agregamos aquí también
      if (!messages.some(m => m.content === data.response)) {
        const assistantMessage: ChatMessage = {
          id: `temp_assistant_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          agent_name: data.agent,
          intent_detected: data.intent,
          confidence: data.confidence,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

    } catch (error: any) {
      console.error('[useChatAIOS] Error sending message:', error);
      
      // Remover mensaje temporal del usuario
      setMessages((prev) => prev.filter(m => m.id !== tempUserMessage.id));

      toast({
        title: 'Error al enviar mensaje',
        description: error.message || 'Intenta de nuevo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = async () => {
    if (!conversationId) return;

    try {
      // Marcar conversación como inactiva
      await supabase
        .from('chat_conversations')
        .update({ is_active: false })
        .eq('id', conversationId);

      // Crear nueva conversación
      setConversationId(null);
      setMessages([]);
      await loadActiveConversation();

      toast({
        title: 'Conversación reiniciada',
        description: 'Puedes empezar una nueva conversación',
      });
    } catch (error: any) {
      console.error('[useChatAIOS] Error clearing conversation:', error);
      toast({
        title: 'Error',
        description: 'No se pudo reiniciar la conversación',
        variant: 'destructive',
      });
    }
  };

  return {
    messages,
    conversationId,
    isLoading,
    isInitializing,
    sendMessage,
    clearConversation,
  };
}