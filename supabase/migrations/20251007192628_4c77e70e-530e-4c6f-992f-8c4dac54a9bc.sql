-- Fix search_path security warnings for encryption functions

ALTER FUNCTION public.encrypt_cedula(text) SET search_path = public;
ALTER FUNCTION public.decrypt_cedula(text) SET search_path = public;
ALTER FUNCTION public.auto_encrypt_cedula() SET search_path = public;