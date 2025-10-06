-- Drop duplicate triggers on user_roles table
-- Keep only one trigger per function to avoid redundant execution

-- Drop duplicate triggers for prevent_self_admin_promotion
DROP TRIGGER IF EXISTS enforce_self_admin_promotion ON public.user_roles;
DROP TRIGGER IF EXISTS trg_prevent_self_admin_promotion ON public.user_roles;

-- Drop duplicate triggers for limit_role_changes_per_hour  
DROP TRIGGER IF EXISTS enforce_role_change_limit ON public.user_roles;
DROP TRIGGER IF EXISTS trg_limit_role_changes ON public.user_roles;

-- Drop duplicate triggers for log_role_change
DROP TRIGGER IF EXISTS enforce_role_audit ON public.user_roles;
DROP TRIGGER IF EXISTS trg_log_role_change ON public.user_roles;

-- Keeping these original triggers:
-- 1. prevent_self_admin_promotion_trigger (prevents users from self-promoting to admin)
-- 2. limit_role_changes_trigger (rate limits role changes to 50 per hour)
-- 3. log_role_change_trigger (logs all role changes for audit trail)

COMMENT ON TRIGGER prevent_self_admin_promotion_trigger ON public.user_roles IS 
  'Prevents users from assigning themselves the admin role';

COMMENT ON TRIGGER limit_role_changes_trigger ON public.user_roles IS 
  'Rate limits role changes to 50 per hour per user to prevent abuse';

COMMENT ON TRIGGER log_role_change_trigger ON public.user_roles IS 
  'Logs all role changes to role_audit_log for security audit trail';