-- Security Fix: Add SET search_path to all SECURITY DEFINER functions
-- This prevents schema injection attacks where malicious users could create
-- conflicting function names in their own schemas to execute arbitrary code

-- Fix all authorization helper functions
CREATE OR REPLACE FUNCTION public.user_owns_client(p_user_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = p_client_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_case(p_user_id uuid, p_case_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cases 
    WHERE id = p_case_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_invoice(p_user_id uuid, p_invoice_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE id = p_invoice_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_client(p_user_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = p_client_id 
    AND (
      user_id = p_user_id  -- Owner (lawyer)
      OR (auth_user_id = p_user_id AND auth_user_id IS NOT NULL)  -- Authenticated client
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_client(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_clients uc
    WHERE uc.user_id = _user_id
      AND uc.client_id = _client_id
  );
$$;

-- Fix data retrieval functions
CREATE OR REPLACE FUNCTION public.get_accessible_clients_safe()
RETURNS TABLE(id uuid, nombre_completo text, user_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre_completo,
    c.user_id,
    c.created_at,
    c.updated_at
  FROM public.clients c
  INNER JOIN public.user_clients uc ON uc.client_id = c.id
  WHERE uc.user_id = auth.uid()
    AND c.user_id != auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_clients_masked(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(id uuid, nombre_completo text, cedula_rnc_masked text, email_masked text, telefono_masked text, direccion_masked text, auth_user_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only view own clients';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.nombre_completo,
    CASE 
      WHEN c.cedula_rnc_encrypted IS NOT NULL THEN '***-' || right(COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), '****'), 4)
      ELSE NULL
    END as cedula_rnc_masked,
    CASE 
      WHEN c.email IS NOT NULL THEN substring(c.email from 1 for 2) || '***@' || split_part(c.email, '@', 2)
      ELSE NULL
    END as email_masked,
    CASE 
      WHEN c.telefono IS NOT NULL THEN '***-' || right(c.telefono, 4)
      ELSE NULL
    END as telefono_masked,
    CASE 
      WHEN c.direccion IS NOT NULL THEN '***' || right(c.direccion, 10)
      ELSE NULL
    END as direccion_masked,
    c.auth_user_id,
    c.created_at,
    c.updated_at
  FROM public.clients c
  WHERE c.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_client_data_masked()
RETURNS TABLE(id uuid, nombre_completo text, cedula_rnc_masked text, email_masked text, telefono_masked text, direccion_masked text, accepted_terms boolean, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.nombre_completo,
    CASE 
      WHEN c.cedula_rnc_encrypted IS NOT NULL THEN '***-' || right(COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), '****'), 4)
      WHEN c.cedula_rnc IS NOT NULL THEN '***-' || right(c.cedula_rnc, 4)
      ELSE NULL 
    END as cedula_rnc_masked,
    CASE 
      WHEN c.email IS NOT NULL THEN substring(c.email from 1 for 2) || '***@' || split_part(c.email, '@', 2)
      ELSE NULL
    END as email_masked,
    CASE 
      WHEN c.telefono IS NOT NULL THEN '***-' || right(c.telefono, 4)
      ELSE NULL
    END as telefono_masked,
    '***' as direccion_masked,
    c.accepted_terms,
    c.created_at
  FROM public.clients c
  WHERE c.auth_user_id = auth.uid()
    AND c.auth_user_id IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_client_summary(p_client_id uuid)
RETURNS TABLE(casos_activos bigint, proximas_audiencias bigint, total_facturado numeric, total_pagado numeric, saldo_pendiente numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = p_client_id
      AND (auth_user_id = auth.uid() OR user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to client data';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(DISTINCT cs.id) FILTER (WHERE cs.estado = 'activo')::bigint as casos_activos,
    COUNT(DISTINCT h.id) FILTER (WHERE h.fecha >= CURRENT_DATE AND h.estado != 'cancelada')::bigint as proximas_audiencias,
    COALESCE(SUM(inv.monto), 0)::numeric as total_facturado,
    COALESCE(SUM(p.monto), 0)::numeric as total_pagado,
    (COALESCE(SUM(inv.monto), 0) - COALESCE(SUM(p.monto), 0))::numeric as saldo_pendiente
  FROM public.clients c
  LEFT JOIN public.cases cs ON cs.client_id = c.id
  LEFT JOIN public.hearings h ON h.case_id = cs.id
  LEFT JOIN public.invoices inv ON inv.client_id = c.id
  LEFT JOIN public.payments p ON p.client_id = c.id
  WHERE c.id = p_client_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_firm_accounting_summary(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(user_id uuid, total_ingresos_facturas numeric, total_ingresos_pagos numeric, total_gastos numeric, total_itbis_ingresos numeric, total_itbis_gastos numeric, total_intereses_cobrados numeric, total_intereses_creditos numeric, balance_neto numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ingresos_facturas numeric;
  v_ingresos_pagos numeric;
  v_gastos numeric;
  v_itbis_ingresos numeric;
  v_itbis_gastos numeric;
  v_intereses_cobrados numeric;
  v_intereses_creditos numeric;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: can only view own accounting data';
  END IF;

  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (auth.uid(), p_user_id, 'firm_accounting_summary', 'view_summary')
  ON CONFLICT DO NOTHING;

  SELECT COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END), 0)
  INTO v_ingresos_facturas
  FROM public.invoices
  WHERE invoices.user_id = p_user_id;

  SELECT COALESCE(SUM(monto), 0)
  INTO v_ingresos_pagos
  FROM public.payments
  WHERE payments.user_id = p_user_id;

  SELECT COALESCE(SUM(monto), 0)
  INTO v_gastos
  FROM public.expenses
  WHERE expenses.user_id = p_user_id;

  SELECT COALESCE(SUM(itbis), 0)
  INTO v_itbis_ingresos
  FROM public.invoices
  WHERE invoices.user_id = p_user_id;

  SELECT COALESCE(SUM(itbis), 0)
  INTO v_itbis_gastos
  FROM public.expenses
  WHERE expenses.user_id = p_user_id;

  SELECT COALESCE(SUM(interes), 0)
  INTO v_intereses_cobrados
  FROM public.invoices
  WHERE invoices.user_id = p_user_id;

  SELECT COALESCE(SUM(interes), 0)
  INTO v_intereses_creditos
  FROM public.client_credits
  WHERE client_credits.user_id = p_user_id;

  RETURN QUERY
  SELECT 
    p_user_id,
    v_ingresos_facturas,
    v_ingresos_pagos,
    v_gastos,
    v_itbis_ingresos,
    v_itbis_gastos,
    v_intereses_cobrados,
    v_intereses_creditos,
    (v_ingresos_facturas + v_ingresos_pagos - v_gastos) as balance_neto;
END;
$$;

-- Fix PII access control functions
CREATE OR REPLACE FUNCTION public.check_and_log_pii_access(p_user_id uuid, p_client_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_count int;
  v_max_accesses_per_hour int := 50;
BEGIN
  SELECT COALESCE(COUNT(*), 0) INTO v_access_count
  FROM public.pii_access_rate_limit
  WHERE user_id = p_user_id
    AND window_start > now() - interval '1 hour';
  
  IF v_access_count >= v_max_accesses_per_hour THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum % PII accesses per hour', v_max_accesses_per_hour;
  END IF;
  
  INSERT INTO public.pii_access_rate_limit (user_id, window_start, access_count)
  VALUES (p_user_id, now(), 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET access_count = pii_access_rate_limit.access_count + 1;
  
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (p_user_id, p_client_id, 'clients', 'reveal_pii');
  
  RETURN true;
END;
$$;

-- Fix invitation and token functions
CREATE OR REPLACE FUNCTION public.validate_invitation_token(p_token text)
RETURNS TABLE(client_id uuid, client_email text, is_valid boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_client record;
BEGIN
  SELECT * INTO v_invitation
  FROM public.client_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'Invalid invitation token'::text;
    RETURN;
  END IF;

  IF v_invitation.used_at IS NOT NULL THEN
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Invitation already used'::text;
    RETURN;
  END IF;

  IF v_invitation.expires_at < now() THEN
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Invitation expired'::text;
    RETURN;
  END IF;

  SELECT * INTO v_client
  FROM public.clients
  WHERE id = v_invitation.client_id;

  UPDATE public.client_invitations
  SET used_at = now(),
      used_by = auth.uid()
  WHERE id = v_invitation.id;

  UPDATE public.clients
  SET auth_user_id = auth.uid(),
      accepted_terms = false
  WHERE id = v_invitation.client_id;

  RETURN QUERY SELECT v_invitation.client_id, v_client.email, true, 'Success'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.link_client_to_auth_user(p_client_id uuid, p_auth_user_id uuid, p_invitation_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_client record;
BEGIN
  SELECT * INTO v_invitation
  FROM public.client_invitations
  WHERE token = p_invitation_token
    AND client_id = p_client_id
    AND used_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  SELECT * INTO v_client
  FROM public.clients
  WHERE id = p_client_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  IF v_client.auth_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Client already linked to a user account';
  END IF;

  IF auth.uid() != p_auth_user_id THEN
    RAISE EXCEPTION 'Auth user ID mismatch';
  END IF;

  UPDATE public.client_invitations
  SET used_at = now(),
      used_by = p_auth_user_id
  WHERE id = v_invitation.id;

  UPDATE public.clients
  SET auth_user_id = p_auth_user_id,
      accepted_terms = false
  WHERE id = p_client_id;

  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (p_auth_user_id, p_client_id, 'clients', 'link_auth_user');

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_invitation_token_validity(p_token text)
RETURNS TABLE(client_id uuid, client_email text, is_valid boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_client record;
BEGIN
  SELECT * INTO v_invitation
  FROM public.client_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, false, 'Invalid invitation token'::text;
    RETURN;
  END IF;

  IF v_invitation.used_at IS NOT NULL THEN
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Invitation already used'::text;
    RETURN;
  END IF;

  IF v_invitation.expires_at < now() THEN
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Invitation expired'::text;
    RETURN;
  END IF;

  SELECT * INTO v_client
  FROM public.clients
  WHERE id = v_invitation.client_id;

  IF v_client.auth_user_id IS NOT NULL THEN
    RETURN QUERY SELECT v_invitation.client_id, NULL::text, false, 'Client already linked to an account'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_invitation.client_id, v_client.email, true, 'Valid'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_invitation_token(p_token text, p_hash text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  RETURN p_hash = extensions.crypt(p_token, p_hash);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_token_rate_limit(p_token_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts int;
BEGIN
  SELECT COUNT(*) INTO v_attempts
  FROM public.token_validation_attempts
  WHERE token_hash = p_token_hash
    AND attempted_at > now() - interval '1 hour'
    AND success = false;
  
  RETURN v_attempts < 5;
END;
$$;

CREATE OR REPLACE FUNCTION public.hash_invitation_token(p_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  RETURN extensions.crypt(p_token, extensions.gen_salt('bf'::text));
END;
$$;

CREATE OR REPLACE FUNCTION public.log_token_validation(p_token_hash text, p_success boolean, p_ip_address text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.token_validation_attempts(token_hash, success, ip_address)
  VALUES (p_token_hash, p_success, p_ip_address);
  
  DELETE FROM public.token_validation_attempts
  WHERE attempted_at < now() - interval '24 hours';
END;
$$;

-- Fix notification functions
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text DEFAULT 'info'::text,
  p_priority text DEFAULT 'medium'::text,
  p_category text DEFAULT 'system'::text,
  p_related_id uuid DEFAULT NULL::uuid,
  p_related_table text DEFAULT NULL::text,
  p_action_url text DEFAULT NULL::text,
  p_action_label text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, message, type, priority, category,
    related_id, related_table, action_url, action_label, metadata
  )
  VALUES (
    p_user_id, p_title, p_message, p_type, p_priority, p_category,
    p_related_id, p_related_table, p_action_url, p_action_label, p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE is_read = true AND read_at < now() - interval '30 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  DELETE FROM public.notifications
  WHERE expires_at IS NOT NULL AND expires_at < now();

  RETURN v_count;
END;
$$;

-- Fix AI usage tracking
CREATE OR REPLACE FUNCTION public.get_monthly_ai_usage(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(total_tokens bigint, total_cost numeric, operations_count bigint, by_operation jsonb)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(tokens_used), 0)::BIGINT AS total_tokens,
    COALESCE(SUM(cost_usd), 0) AS total_cost,
    COUNT(*)::BIGINT AS operations_count,
    jsonb_object_agg(
      operation_type,
      jsonb_build_object(
        'count', COUNT(*),
        'tokens', COALESCE(SUM(tokens_used), 0),
        'cost', COALESCE(SUM(cost_usd), 0)
      )
    ) AS by_operation
  FROM public.ai_usage
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', now())
    AND created_at < date_trunc('month', now()) + interval '1 month';
END;
$$;

-- Fix search and admin verification functions
CREATE OR REPLACE FUNCTION public.can_refresh_search_index()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_verification(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_verifications av
    WHERE av.user_id = _user_id
  );
$$;

COMMENT ON SCHEMA public IS 'Security hardening: All SECURITY DEFINER functions now use SET search_path = public to prevent schema injection attacks';