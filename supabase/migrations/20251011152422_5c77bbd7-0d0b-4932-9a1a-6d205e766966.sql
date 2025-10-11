-- Fix signup issue: Modify data_access_audit to allow NULL user_id during signup
-- and make the foreign key constraint DEFERRABLE

-- First, make the foreign key constraint deferrable so it's checked at transaction end
ALTER TABLE public.data_access_audit 
DROP CONSTRAINT IF EXISTS data_access_audit_user_id_fkey;

-- Make user_id nullable to allow system operations without a user context
ALTER TABLE public.data_access_audit 
ALTER COLUMN user_id DROP NOT NULL;

-- Re-add the constraint as deferrable initially deferred
ALTER TABLE public.data_access_audit
ADD CONSTRAINT data_access_audit_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Update the audit_profile_changes function to handle NULL auth.uid() gracefully
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if there's an authenticated user context
  -- Skip logging during initial user creation
  IF auth.uid() IS NOT NULL THEN
    IF TG_OP = 'UPDATE' THEN
      INSERT INTO public.data_access_audit(
        user_id,
        record_id,
        table_name,
        action
      )
      VALUES (
        auth.uid(),
        NEW.id,
        'user_profiles',
        'update'
      );
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO public.data_access_audit(
        user_id,
        record_id,
        table_name,
        action
      )
      VALUES (
        auth.uid(),
        OLD.id,
        'user_profiles',
        'delete'
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update audit_clients_access to handle NULL user gracefully
CREATE OR REPLACE FUNCTION public.audit_clients_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if there's a user context
  IF auth.uid() IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
      VALUES (auth.uid(), NEW.id, 'clients', 'insert');
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
      VALUES (auth.uid(), NEW.id, 'clients', 'update');
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
      VALUES (auth.uid(), OLD.id, 'clients', 'delete');
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;