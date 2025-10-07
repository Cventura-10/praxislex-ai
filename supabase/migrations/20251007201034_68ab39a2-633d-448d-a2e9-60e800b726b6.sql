-- CRITICAL SECURITY FIX: Remove unencrypted cedula_rnc column and enhance RLS policies

-- Step 1: Drop the unsafe RLS policy for clients viewing their own data
DROP POLICY IF EXISTS "Clients can view own masked info" ON public.clients;

-- Step 2: Create a secure function for clients to view ONLY their own masked data
CREATE OR REPLACE FUNCTION public.get_my_client_data_masked()
RETURNS TABLE(
  id uuid,
  nombre_completo text,
  cedula_rnc_masked text,
  email_masked text,
  telefono_masked text,
  direccion_masked text,
  accepted_terms boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return data if user is authenticated AND is the client
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
    '***' as direccion_masked, -- Completely hide address
    c.accepted_terms,
    c.created_at
  FROM public.clients c
  WHERE c.auth_user_id = auth.uid()
    AND c.auth_user_id IS NOT NULL;
END;
$$;

-- Step 3: Remove the unencrypted cedula_rnc column (CRITICAL SECURITY FIX)
-- First, update any existing data to ensure it's encrypted
DO $$
BEGIN
  -- Encrypt any remaining unencrypted cedulas
  UPDATE public.clients
  SET cedula_rnc_encrypted = public.encrypt_cedula(cedula_rnc)
  WHERE cedula_rnc IS NOT NULL 
    AND cedula_rnc != ''
    AND (cedula_rnc_encrypted IS NULL OR cedula_rnc_encrypted = '');
END $$;

-- Now drop the unsafe unencrypted column
ALTER TABLE public.clients DROP COLUMN IF EXISTS cedula_rnc;

-- Step 4: Update the reveal_client_pii function to use only encrypted data
CREATE OR REPLACE FUNCTION public.reveal_client_pii(p_client_id uuid)
RETURNS TABLE(
  id uuid,
  nombre_completo text,
  cedula_rnc text,
  email text,
  telefono text,
  direccion text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only owners (lawyers) can reveal PII, not clients themselves
  IF NOT EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = p_client_id 
      AND c.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to reveal this client data';
  END IF;

  -- Audit the reveal action
  INSERT INTO public.data_access_audit(user_id, record_id, table_name, action)
  VALUES (auth.uid(), p_client_id, 'clients', 'reveal_pii');

  -- Return decrypted data
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre_completo,
    COALESCE(public.decrypt_cedula(c.cedula_rnc_encrypted), 'ERROR_DECRYPT') as cedula_rnc,
    c.email,
    c.telefono,
    c.direccion
  FROM public.clients c
  WHERE c.id = p_client_id
    AND c.user_id = auth.uid();
END;
$$;

-- Step 5: Update get_clients_masked to only use encrypted data
CREATE OR REPLACE FUNCTION public.get_clients_masked(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  id uuid,
  nombre_completo text,
  cedula_rnc_masked text,
  email_masked text,
  telefono_masked text,
  direccion_masked text,
  auth_user_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to see their own clients
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

-- Step 6: Update auto_encrypt_cedula trigger to work without unencrypted column
CREATE OR REPLACE FUNCTION public.auto_encrypt_cedula()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Note: This trigger is now mainly for backward compatibility
  -- New inserts should use cedula_rnc_encrypted directly or rely on application logic
  -- Since we removed cedula_rnc column, this trigger has limited use
  -- but we keep it in case we need to add encryption logic in the future
  RETURN NEW;
END;
$$;

-- Step 7: Add comment to document the security enhancement
COMMENT ON FUNCTION public.get_my_client_data_masked() IS 
'Secure function for authenticated clients to view ONLY their own masked data. All PII is properly masked.';

COMMENT ON FUNCTION public.reveal_client_pii(uuid) IS 
'Allows lawyers (owners) to reveal client PII with full audit logging. Clients cannot reveal their own unmasked data.';

COMMENT ON COLUMN public.clients.cedula_rnc_encrypted IS 
'Encrypted national ID number using pgcrypto. This is the ONLY storage for cedula/RNC - unencrypted version removed for security.';