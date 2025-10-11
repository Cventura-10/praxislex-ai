
-- Fix v_act_fields_sane SECURITY DEFINER issue
-- This view filters act fields, should use SECURITY INVOKER

-- Drop the existing view
DROP VIEW IF EXISTS public.v_act_fields_sane CASCADE;

-- Recreate with SECURITY INVOKER
CREATE OR REPLACE VIEW public.v_act_fields_sane
WITH (security_invoker = true) AS
SELECT 
  f.id,
  f.act_slug,
  f.field_key,
  f.field_label,
  f.field_type,
  f.is_required,
  f.display_order,
  f.created_at
FROM public.act_fields f
JOIN public.act_types t ON t.slug = f.act_slug
WHERE NOT (
  t.act_template_kind LIKE 'extrajudicial%'
  AND split_part(f.field_key, '.', 1) = ANY(ARRAY[
    'demandante',
    'demandado',
    'tribunal',
    'numero_acto',
    'folios',
    'traslados_enumerados',
    'emplazamiento_texto',
    'octava_franca_fecha_limite',
    'costas_texto',
    'petitorio',
    'dispositivo'
  ])
);

-- Grant permissions
GRANT SELECT ON public.v_act_fields_sane TO authenticated;
GRANT SELECT ON public.v_act_fields_sane TO anon;
