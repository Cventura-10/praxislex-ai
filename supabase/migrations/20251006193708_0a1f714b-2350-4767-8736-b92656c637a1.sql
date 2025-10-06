-- Strengthen RLS for public.clients with relationship checks via user_clients
-- and allow self-access via auth_user_id. Keep write operations owner-only to avoid breaking behavior.

-- 1) Helper function: can_access_client
create or replace function public.can_access_client(_user_id uuid, _client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_clients uc
    where uc.user_id = _user_id
      and uc.client_id = _client_id
  );
$$;

-- 2) Ensure RLS is enabled on clients
alter table public.clients enable row level security;

-- 3) Drop existing policies on clients (if they exist)
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='clients' and policyname='Los usuarios pueden ver sus propios clientes'
  ) then
    drop policy "Los usuarios pueden ver sus propios clientes" on public.clients;
  end if;
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='clients' and policyname='Los usuarios pueden crear sus propios clientes'
  ) then
    drop policy "Los usuarios pueden crear sus propios clientes" on public.clients;
  end if;
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='clients' and policyname='Los usuarios pueden actualizar sus propios clientes'
  ) then
    drop policy "Los usuarios pueden actualizar sus propios clientes" on public.clients;
  end if;
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='clients' and policyname='Los usuarios pueden eliminar sus propios clientes'
  ) then
    drop policy "Los usuarios pueden eliminar sus propios clientes" on public.clients;
  end if;
end $$;

-- 4) Create hardened policies
-- SELECT: allow owner, the client themselves, or any user with an explicit relationship in user_clients
create policy "Clients: select owner, self or shared relationship"
  on public.clients
  for select
  using (
    auth.uid() = user_id
    or auth.uid() = auth_user_id
    or public.can_access_client(auth.uid(), id)
  );

-- INSERT: owner-only (must insert with their own user_id)
create policy "Clients: insert owner only"
  on public.clients
  for insert
  with check (
    auth.uid() = user_id
  );

-- UPDATE: owner-only for writes (to avoid unintended privilege escalation)
create policy "Clients: update owner only"
  on public.clients
  for update
  using (
    auth.uid() = user_id
  )
  with check (
    auth.uid() = user_id
  );

-- DELETE: owner-only
create policy "Clients: delete owner only"
  on public.clients
  for delete
  using (
    auth.uid() = user_id
  );

-- 5) (Optional but recommended) Add helpful index for relationship checks
-- This is safe and improves performance for can_access_client()
create index if not exists idx_user_clients_user_client on public.user_clients(user_id, client_id);
