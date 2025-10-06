-- Phase 4: Add triggers to user_roles table for role auditing

-- Trigger: Prevent self admin promotion
CREATE TRIGGER prevent_self_admin_promotion_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_admin_promotion();

-- Trigger: Limit role changes per hour (rate limiting)
CREATE TRIGGER limit_role_changes_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.limit_role_changes_per_hour();

-- Trigger: Log all role changes
CREATE TRIGGER log_role_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();