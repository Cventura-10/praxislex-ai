-- Fix data_access_audit action check constraint to allow audit log actions
ALTER TABLE public.data_access_audit
DROP CONSTRAINT IF EXISTS data_access_audit_action_check;

ALTER TABLE public.data_access_audit
ADD CONSTRAINT data_access_audit_action_check 
CHECK (action IN ('insert', 'update', 'delete', 'reveal_pii'));