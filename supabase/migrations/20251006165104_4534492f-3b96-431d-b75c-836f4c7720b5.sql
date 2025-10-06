-- Phase 3: Add triggers to enforce role safety functions
CREATE TRIGGER enforce_prevent_self_admin_promotion
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_admin_promotion();

CREATE TRIGGER enforce_limit_role_changes
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.limit_role_changes_per_hour();

CREATE TRIGGER enforce_log_role_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- Phase 4: Create data access audit table for PII tracking
CREATE TABLE public.data_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('read', 'write', 'delete', 'unmask', 'download')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.data_access_audit ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.data_access_audit
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.data_access_audit
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.data_access_audit
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_data_access_audit_user_id ON public.data_access_audit(user_id);
CREATE INDEX idx_data_access_audit_created_at ON public.data_access_audit(created_at);

-- Phase 5: Fix search_path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Phase 5: Add explicit DELETE policy for profiles
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);