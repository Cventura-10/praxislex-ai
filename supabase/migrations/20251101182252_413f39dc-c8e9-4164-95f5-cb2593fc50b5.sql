-- Fix security definer view issue
DROP VIEW IF EXISTS public.v_notarios_complete;

CREATE VIEW public.v_notarios_complete 
WITH (security_invoker = true) AS
SELECT
  n.id,
  n.nombre,
  n.matricula_cdn as exequatur,
  n.telefono,
  n.email,
  n.oficina_direccion as oficina,
  n.jurisdiccion,
  n.tenant_id,
  n.user_id,
  CASE 
    WHEN n.cedula_encrypted IS NOT NULL AND LENGTH(n.cedula_encrypted) >= 11 THEN
      SUBSTRING(n.cedula_encrypted, 1, 3) || '-****-****'
    ELSE '***-****-****'
  END as cedula_mask
FROM public.notarios n
WHERE n.estado = 'activo';