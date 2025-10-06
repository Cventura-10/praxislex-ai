-- Crear tabla de créditos para clientes
CREATE TABLE public.client_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL,
  concepto TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  referencia TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de pagos
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  monto NUMERIC NOT NULL,
  metodo_pago TEXT NOT NULL,
  concepto TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  referencia TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.client_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_credits
CREATE POLICY "Los usuarios pueden ver sus propios créditos"
ON public.client_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios créditos"
ON public.client_credits FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios créditos"
ON public.client_credits FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios créditos"
ON public.client_credits FOR DELETE
USING (auth.uid() = user_id);

-- Políticas RLS para payments
CREATE POLICY "Los usuarios pueden ver sus propios pagos"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios pagos"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios pagos"
ON public.payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios pagos"
ON public.payments FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at en client_credits
CREATE TRIGGER update_client_credits_updated_at
BEFORE UPDATE ON public.client_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at en payments
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();