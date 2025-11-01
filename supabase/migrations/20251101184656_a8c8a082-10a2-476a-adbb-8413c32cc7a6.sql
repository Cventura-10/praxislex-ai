-- ====================================================================
-- CORRECCIÓN: Vista v_notarios sin SECURITY DEFINER
-- ====================================================================

-- Recrear vista sin SECURITY DEFINER (invoker rights)
create or replace view public.v_notarios 
with (security_invoker=true)
as
select
  n.id,
  n.user_id,
  n.tenant_id,
  n.nombre,
  coalesce(n.exequatur, '') as exequatur,
  coalesce(n.telefono, '') as telefono,
  coalesce(n.email, '') as email,
  coalesce(n.oficina_direccion, '') as oficina,
  n.municipio_id,
  m.nombre as municipio_nombre,
  m.provincia_id,
  p.nombre as provincia_nombre,
  n.jurisdiccion,
  case 
    when n.cedula_encrypted is not null then 
      left(n.cedula_encrypted, 3) || '-****-****'
    else ''
  end as cedula_mask
from public.notarios n
left join public.municipios m on m.id = n.municipio_id
left join public.provincias p on p.id = m.provincia_id;