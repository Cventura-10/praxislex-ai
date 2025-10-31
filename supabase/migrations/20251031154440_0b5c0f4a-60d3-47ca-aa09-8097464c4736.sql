-- Corregir constraint de data_access_audit para incluir todas las acciones necesarias
ALTER TABLE public.data_access_audit
DROP CONSTRAINT IF EXISTS data_access_audit_action_check;

ALTER TABLE public.data_access_audit
ADD CONSTRAINT data_access_audit_action_check 
CHECK (action IN (
  'insert', 
  'update', 
  'delete', 
  'reveal_pii', 
  'pii_check_passed',
  'check_membership',
  'list_tenants'
));