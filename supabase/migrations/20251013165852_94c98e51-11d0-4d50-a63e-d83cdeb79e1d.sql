-- Create client messaging system
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'lawyer')),
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

-- Policies for client messages
CREATE POLICY "Users can view messages they sent or received"
  ON public.client_messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
  );

CREATE POLICY "Users can send messages"
  ON public.client_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON public.client_messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- Trigger for updated_at
CREATE TRIGGER update_client_messages_updated_at
  BEFORE UPDATE ON public.client_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_client_messages_sender ON public.client_messages(sender_id);
CREATE INDEX idx_client_messages_recipient ON public.client_messages(recipient_id);
CREATE INDEX idx_client_messages_created ON public.client_messages(created_at DESC);