-- Fix client_messages table to have proper relationships
-- The error shows no FK relationship between client_messages and sender_id

-- First, let's ensure sender_id and recipient_id are properly set up
-- These should reference auth.users table

ALTER TABLE public.client_messages
DROP CONSTRAINT IF EXISTS client_messages_sender_id_fkey;

ALTER TABLE public.client_messages  
DROP CONSTRAINT IF EXISTS client_messages_recipient_id_fkey;

-- Add proper foreign key constraints
-- Note: We reference auth.users which is managed by Supabase
-- Using ON DELETE CASCADE to clean up messages when users are deleted
ALTER TABLE public.client_messages
ADD CONSTRAINT client_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.client_messages
ADD CONSTRAINT client_messages_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.client_messages.sender_id IS 'Usuario que envía el mensaje (FK a auth.users)';
COMMENT ON COLUMN public.client_messages.recipient_id IS 'Usuario que recibe el mensaje (FK a auth.users)';