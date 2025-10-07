-- Create security definer helper functions to validate ownership
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

-- Update cases table RLS policies
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propios casos" ON public.cases;
CREATE POLICY "Los usuarios pueden crear sus propios casos"
ON public.cases FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios casos" ON public.cases;
CREATE POLICY "Los usuarios pueden actualizar sus propios casos"
ON public.cases FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
);

-- Update invoices table RLS policies
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias facturas" ON public.invoices;
CREATE POLICY "Los usuarios pueden crear sus propias facturas"
ON public.invoices FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias facturas" ON public.invoices;
CREATE POLICY "Los usuarios pueden actualizar sus propias facturas"
ON public.invoices FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
);

-- Update payments table RLS policies
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propios pagos" ON public.payments;
CREATE POLICY "Los usuarios pueden crear sus propios pagos"
ON public.payments FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
  AND (invoice_id IS NULL OR public.user_owns_invoice(auth.uid(), invoice_id))
);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios pagos" ON public.payments;
CREATE POLICY "Los usuarios pueden actualizar sus propios pagos"
ON public.payments FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
  AND (invoice_id IS NULL OR public.user_owns_invoice(auth.uid(), invoice_id))
);

-- Update expenses table RLS policies
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propios gastos" ON public.expenses;
CREATE POLICY "Los usuarios pueden crear sus propios gastos"
ON public.expenses FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
  AND (case_id IS NULL OR public.user_owns_case(auth.uid(), case_id))
);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios gastos" ON public.expenses;
CREATE POLICY "Los usuarios pueden actualizar sus propios gastos"
ON public.expenses FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
  AND (case_id IS NULL OR public.user_owns_case(auth.uid(), case_id))
);

-- Update hearings table RLS policies
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias audiencias" ON public.hearings;
CREATE POLICY "Los usuarios pueden crear sus propias audiencias"
ON public.hearings FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (case_id IS NULL OR public.user_owns_case(auth.uid(), case_id))
);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias audiencias" ON public.hearings;
CREATE POLICY "Los usuarios pueden actualizar sus propias audiencias"
ON public.hearings FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (case_id IS NULL OR public.user_owns_case(auth.uid(), case_id))
);

-- Update deadlines table RLS policies
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propios plazos" ON public.deadlines;
CREATE POLICY "Los usuarios pueden crear sus propios plazos"
ON public.deadlines FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (case_id IS NULL OR public.user_owns_case(auth.uid(), case_id))
);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios plazos" ON public.deadlines;
CREATE POLICY "Los usuarios pueden actualizar sus propios plazos"
ON public.deadlines FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (case_id IS NULL OR public.user_owns_case(auth.uid(), case_id))
);

-- Update client_credits table RLS policies
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propios créditos" ON public.client_credits;
CREATE POLICY "Los usuarios pueden crear sus propios créditos"
ON public.client_credits FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios créditos" ON public.client_credits;
CREATE POLICY "Los usuarios pueden actualizar sus propios créditos"
ON public.client_credits FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (client_id IS NULL OR public.user_owns_client(auth.uid(), client_id))
);

-- Add rate limiting for client invitations
CREATE OR REPLACE FUNCTION public.limit_invitation_creations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Allow system actions without session
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count invitations created in the last hour
  SELECT COUNT(*) INTO v_count
  FROM public.client_invitations
  WHERE created_by = auth.uid()
    AND created_at > now() - interval '1 hour';

  IF v_count >= 10 THEN
    RAISE EXCEPTION 'Too many invitations created in the last hour. Maximum 10 per hour.';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for invitation rate limiting
DROP TRIGGER IF EXISTS limit_invitation_creations_trigger ON public.client_invitations;
CREATE TRIGGER limit_invitation_creations_trigger
  BEFORE INSERT ON public.client_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.limit_invitation_creations();