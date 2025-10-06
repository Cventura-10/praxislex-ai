-- Crear tabla de relación muchos-a-muchos entre usuarios y clientes
CREATE TABLE IF NOT EXISTS public.user_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  rol TEXT DEFAULT 'colaborador', -- 'principal', 'colaborador', 'consultor'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Habilitar RLS
ALTER TABLE public.user_clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Los usuarios pueden ver sus propias relaciones
CREATE POLICY "Users can view their client associations"
ON public.user_clients
FOR SELECT
USING (auth.uid() = user_id);

-- Los usuarios pueden crear sus propias relaciones
CREATE POLICY "Users can create their client associations"
ON public.user_clients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias relaciones
CREATE POLICY "Users can delete their client associations"
ON public.user_clients
FOR DELETE
USING (auth.uid() = user_id);

-- Índice para mejorar rendimiento de consultas
CREATE INDEX idx_user_clients_user_id ON public.user_clients(user_id);
CREATE INDEX idx_user_clients_client_id ON public.user_clients(client_id);

COMMENT ON TABLE public.user_clients IS 'Relación muchos-a-muchos entre usuarios y clientes para permitir múltiples usuarios por cliente';
COMMENT ON COLUMN public.user_clients.rol IS 'Rol del usuario en relación al cliente: principal, colaborador, consultor';