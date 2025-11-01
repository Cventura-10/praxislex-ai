-- ====================================================================
-- CORRECCIÓN SEGURIDAD: RLS en tablas de geografía
-- ====================================================================

-- Habilitar RLS en tablas geográficas (son catálogos públicos de solo lectura)
alter table public.provincias enable row level security;
alter table public.municipios enable row level security;
alter table public.sectores enable row level security;

-- Políticas: todos los usuarios autenticados pueden leer geografía
drop policy if exists "Anyone can read provincias" on public.provincias;
create policy "Anyone can read provincias" on public.provincias
  for select using (true);

drop policy if exists "Anyone can read municipios" on public.municipios;
create policy "Anyone can read municipios" on public.municipios
  for select using (true);

drop policy if exists "Anyone can read sectores" on public.sectores;
create policy "Anyone can read sectores" on public.sectores
  for select using (true);

-- Solo admins pueden modificar geografía (futuro)
drop policy if exists "Admins can manage provincias" on public.provincias;
create policy "Admins can manage provincias" on public.provincias
  for all using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'::app_role
    )
  );

drop policy if exists "Admins can manage municipios" on public.municipios;
create policy "Admins can manage municipios" on public.municipios
  for all using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'::app_role
    )
  );

drop policy if exists "Admins can manage sectores" on public.sectores;
create policy "Admins can manage sectores" on public.sectores
  for all using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'::app_role
    )
  );