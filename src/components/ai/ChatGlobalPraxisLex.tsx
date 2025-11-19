import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles, 
  RotateCcw,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { useChatAIOS, type ChatMessage } from '@/hooks/useChatAIOS';
import { cn } from '@/lib/utils';

interface ChatGlobalPraxisLexProps {
  contextType?: string;
  contextId?: string;
  className?: string;
}

export function ChatGlobalPraxisLex({ 
  contextType = 'general', 
  contextId,
  className 
}: ChatGlobalPraxisLexProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { 
    messages, 
    isLoading, 
    isInitializing,
    sendMessage, 
    clearConversation 
  } = useChatAIOS(contextType, contextId);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageToSend = input.trim();
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  if (isInitializing) {
    return (
      <Card className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Iniciando chat inteligente...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <BrainCircuit className="h-6 w-6 text-primary" />
              <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">PraxisLex AI-OS</h3>
              <p className="text-xs text-muted-foreground">
                Asistente jurídico inteligente
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearConversation}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="relative">
              <Bot className="h-16 w-16 text-muted-foreground/50" />
              <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">¡Hola! Soy tu asistente jurídico</h4>
              <p className="text-sm text-muted-foreground max-w-md">
                Puedo ayudarte con casos, clientes, documentos, jurisprudencia y más.
                ¿En qué puedo asistirte hoy?
              </p>
            </div>
            
            {/* Sugerencias rápidas */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Muéstrame mis casos activos')}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Ver casos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Lista mis clientes')}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Ver clientes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Ayúdame a crear un caso')}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Crear caso
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageBubble key={message.id || index} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Pensando...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <Separator />
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {contextType !== 'general' && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Chat en contexto: <strong>{contextType}</strong>
          </p>
        )}
      </form>
    </Card>
  );
}

// ============================================================
// Message Bubble Component
// ============================================================
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "flex items-start gap-3",
      isUser && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-primary/10"
      )}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 space-y-2 max-w-[80%]",
        isUser && "items-end"
      )}>
        <div className={cn(
          "rounded-lg p-3 prose prose-sm max-w-none",
          isUser 
            ? "bg-primary text-primary-foreground ml-auto" 
            : "bg-muted"
        )}>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Metadata (solo para asistente) */}
        {!isUser && message.agent_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {message.agent_name}
            </Badge>
            {message.intent_detected && (
              <span className="opacity-70">
                • {message.intent_detected}
              </span>
            )}
            {message.confidence && (
              <span className="opacity-70">
                • {Math.round(message.confidence * 100)}% confianza
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}