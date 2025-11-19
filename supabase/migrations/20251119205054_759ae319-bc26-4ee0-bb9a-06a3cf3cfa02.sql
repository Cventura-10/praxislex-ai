-- ============================================================
-- FASE 1: MEMORIA CONVERSACIONAL PARA AI-OS
-- Tablas para chat multi-agente con contexto jurídico
-- ============================================================

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Contexto jurídico
  context_type TEXT CHECK (context_type IN ('general', 'case', 'client', 'document', 'hearing', 'invoice')),
  context_id UUID, -- ID del caso/cliente/documento si aplica
  
  -- Metadata
  title TEXT, -- Título generado automáticamente
  summary TEXT, -- Resumen de la conversación
  tags TEXT[] DEFAULT '{}',
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT fk_conversation_tenant FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Tabla de mensajes del chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  
  -- Roles
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  
  -- Contenido
  content TEXT NOT NULL,
  
  -- Metadata del agente
  agent_name TEXT, -- Qué agente especializado respondió
  intent_detected TEXT, -- Intención detectada por el orquestador
  confidence NUMERIC(3,2), -- Confianza de la clasificación (0.00-1.00)
  
  -- Tool calls ejecutados
  tool_calls JSONB DEFAULT '[]'::jsonb,
  tool_results JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) 
    REFERENCES public.chat_conversations(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_active 
  ON public.chat_conversations(user_id, is_active, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_context 
  ON public.chat_conversations(context_type, context_id) 
  WHERE context_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON public.chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_intent 
  ON public.chat_messages(intent_detected) 
  WHERE intent_detected IS NOT NULL;

-- Trigger para actualizar updated_at en conversaciones
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_chat_conversations_timestamp
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversation_timestamp();

-- Trigger para actualizar last_message_at cuando se agrega un mensaje
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_last_message_at
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Conversaciones: solo usuarios del mismo tenant
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON public.chat_conversations FOR SELECT
  USING (
    user_id = auth.uid() 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Users can create their own conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Users can update their own conversations"
  ON public.chat_conversations FOR UPDATE
  USING (
    user_id = auth.uid() 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

CREATE POLICY "Users can delete their own conversations"
  ON public.chat_conversations FOR DELETE
  USING (
    user_id = auth.uid() 
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- Mensajes: acceso basado en la conversación
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their conversations"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id
        AND user_id = auth.uid()
    )
  );

-- Los mensajes no se pueden actualizar ni eliminar (registro inmutable)

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- Crear o recuperar conversación activa
CREATE OR REPLACE FUNCTION get_or_create_active_conversation(
  p_user_id UUID,
  p_context_type TEXT DEFAULT 'general',
  p_context_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Obtener tenant del usuario
  v_tenant_id := get_user_tenant_id(p_user_id);
  
  -- Buscar conversación activa con el mismo contexto
  SELECT id INTO v_conversation_id
  FROM public.chat_conversations
  WHERE user_id = p_user_id
    AND tenant_id = v_tenant_id
    AND is_active = true
    AND context_type = p_context_type
    AND (
      (p_context_id IS NULL AND context_id IS NULL) OR
      (context_id = p_context_id)
    )
  ORDER BY last_message_at DESC
  LIMIT 1;
  
  -- Si no existe, crear nueva conversación
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.chat_conversations (
      user_id,
      tenant_id,
      context_type,
      context_id,
      title
    ) VALUES (
      p_user_id,
      v_tenant_id,
      p_context_type,
      p_context_id,
      CASE p_context_type
        WHEN 'case' THEN 'Chat sobre caso'
        WHEN 'client' THEN 'Chat sobre cliente'
        WHEN 'document' THEN 'Chat sobre documento'
        ELSE 'Nueva conversación'
      END
    )
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$;

COMMENT ON TABLE public.chat_conversations IS 'Conversaciones del chat AI-OS con contexto jurídico';
COMMENT ON TABLE public.chat_messages IS 'Mensajes del chat multi-agente con metadata de tools y agentes';
COMMENT ON FUNCTION get_or_create_active_conversation IS 'Obtener conversación activa o crear nueva según contexto';