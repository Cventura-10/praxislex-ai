-- ============================================================================
-- CORRECCIÓN URGENTE: SISTEMA DE CRÉDITOS IA Y RATE LIMITING (v2)
-- ============================================================================

-- 1. Eliminar TODAS las versiones de la función de rate limiting
DROP FUNCTION IF EXISTS public.check_api_rate_limit(UUID, TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.check_api_rate_limit CASCADE;

-- 2. Crear nueva función de rate limiting MUY PERMISIVA
CREATE OR REPLACE FUNCTION public.check_api_rate_limit(
  p_identifier UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 1000,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Calcular inicio de ventana de tiempo
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Contar solicitudes en la ventana de tiempo
  SELECT COALESCE(COUNT(*), 0)
  INTO v_request_count
  FROM public.api_rate_limits
  WHERE user_id = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  -- Verificar si está bajo el límite (MUY PERMISIVO)
  IF v_request_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Registrar la solicitud actual
  INSERT INTO public.api_rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_identifier, p_endpoint, NOW(), 1);
  
  -- Limpiar registros antiguos (más de 24 horas)
  DELETE FROM public.api_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  RETURN true;
END;
$$;

-- 3. Actualizar límites de créditos IA a valores GENEROSOS
UPDATE public.memberships
SET 
  ai_credits_monthly = CASE 
    WHEN plan = 'free' THEN 1000
    WHEN plan = 'pro' THEN 10000
    WHEN plan = 'enterprise' THEN 999999
    ELSE 1000
  END,
  ai_credits_used = 0,
  ai_credits_reset_date = CURRENT_DATE + INTERVAL '1 month';

-- 4. Crear membresías para usuarios sin membresía
INSERT INTO public.memberships (user_id, plan, ai_credits_monthly, ai_credits_used, ai_credits_reset_date)
SELECT 
  up.id,
  'free' as plan,
  1000 as ai_credits_monthly,
  0 as ai_credits_used,
  CURRENT_DATE + INTERVAL '1 month' as ai_credits_reset_date
FROM public.user_profiles up
LEFT JOIN public.memberships m ON m.user_id = up.id
WHERE m.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 5. Modificar función check_ai_credits para ser más permisiva
CREATE OR REPLACE FUNCTION public.check_ai_credits(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership RECORD;
BEGIN
  SELECT * INTO v_membership
  FROM public.memberships
  WHERE user_id = p_user_id;
  
  -- Si no existe membresía, crearla con plan free GENEROSO
  IF NOT FOUND THEN
    INSERT INTO public.memberships (user_id, plan, ai_credits_monthly, ai_credits_used)
    VALUES (p_user_id, 'free', 1000, 0)
    RETURNING * INTO v_membership;
  END IF;
  
  -- Resetear créditos si pasó el mes
  IF v_membership.ai_credits_reset_date < CURRENT_DATE THEN
    UPDATE public.memberships
    SET ai_credits_used = 0,
        ai_credits_reset_date = CURRENT_DATE + INTERVAL '1 month'
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;
  
  -- Si es plan enterprise (999999 créditos), siempre retornar true
  IF v_membership.ai_credits_monthly >= 999999 THEN
    RETURN true;
  END IF;
  
  RETURN v_membership.ai_credits_used < v_membership.ai_credits_monthly;
END;
$$;

-- 6. Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup 
ON public.api_rate_limits(user_id, endpoint, window_start);

-- 7. Comentarios
COMMENT ON FUNCTION public.check_api_rate_limit IS 
'Rate limiting GENEROSO: 1000 solicitudes/hora por defecto para permitir uso libre durante beta';

COMMENT ON FUNCTION public.check_ai_credits IS 
'Créditos IA GENEROSOS: FREE=1000/mes, PRO=10000/mes, ENTERPRISE=ilimitado';