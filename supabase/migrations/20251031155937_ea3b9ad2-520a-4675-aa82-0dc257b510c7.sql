-- Actualizar la función check_and_log_pii_access para aumentar el límite de rate
-- De 10 accesos por 15 minutos a 100 accesos por 15 minutos (uso normal de edición)

CREATE OR REPLACE FUNCTION public.check_and_log_pii_access(p_user_id uuid, p_client_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_recent_count integer;
  v_violation_record record;
  v_blocked_until timestamptz;
BEGIN
  -- Check if user is currently blocked
  SELECT blocked_until INTO v_blocked_until
  FROM public.pii_access_violations
  WHERE user_id = p_user_id
    AND blocked_until > now()
  ORDER BY last_violation_at DESC
  LIMIT 1;

  IF v_blocked_until IS NOT NULL THEN
    RAISE NOTICE 'User % blocked until %', p_user_id, v_blocked_until;
    RETURN false;
  END IF;

  -- Count recent access attempts (last 15 minutes)
  SELECT COUNT(*) INTO v_recent_count
  FROM public.data_access_audit
  WHERE user_id = p_user_id
    AND action = 'reveal_pii'
    AND created_at > now() - interval '15 minutes';

  -- Rate limit aumentado: max 100 PII reveals por 15 minutos (permitir uso normal)
  IF v_recent_count >= 100 THEN
    -- Record violation
    SELECT * INTO v_violation_record
    FROM public.pii_access_violations
    WHERE user_id = p_user_id
    ORDER BY last_violation_at DESC
    LIMIT 1;

    IF FOUND THEN
      -- Increment violation count and apply exponential backoff
      UPDATE public.pii_access_violations
      SET violation_count = violation_count + 1,
          last_violation_at = now(),
          blocked_until = now() + (power(2, violation_count + 1) || ' minutes')::interval
      WHERE user_id = p_user_id
        AND id = v_violation_record.id;
    ELSE
      -- First violation - 2 minute block
      INSERT INTO public.pii_access_violations (user_id, blocked_until)
      VALUES (p_user_id, now() + interval '2 minutes');
    END IF;

    RETURN false;
  END IF;

  -- Log successful access
  INSERT INTO public.data_access_audit (user_id, record_id, table_name, action)
  VALUES (p_user_id, p_client_id, 'clients', 'pii_check_passed');

  RETURN true;
END;
$function$;