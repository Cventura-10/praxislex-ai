-- Fix attempt 2: remove unsupported IF NOT EXISTS in CREATE POLICY

-- Create admin_verifications table (second factor for admin privileges)
create table if not exists public.admin_verifications (
  user_id uuid primary key,
  verified_by uuid,
  method text default 'backfill',
  created_at timestamptz not null default now()
);

alter table public.admin_verifications enable row level security;

-- Policies for admin_verifications
drop policy if exists "Admins can view admin_verifications" on public.admin_verifications;
create policy "Admins can view admin_verifications"
  on public.admin_verifications
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "Admins can insert admin_verifications" on public.admin_verifications;
create policy "Admins can insert admin_verifications"
  on public.admin_verifications
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'::app_role));

-- Helper function: second verification source
create or replace function public.has_admin_verification(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_verifications av
    where av.user_id = _user_id
  );
$$;

-- Backfill current admins
insert into public.admin_verifications (user_id, verified_by, method)
select ur.user_id, null::uuid, 'backfill'
from public.user_roles ur
where ur.role = 'admin'::app_role
on conflict (user_id) do nothing;

-- Strengthen user_roles admin policy to require both role and verification
drop policy if exists "Admins can manage all roles" on public.user_roles;
create policy "Admins can manage all roles"
  on public.user_roles
  for all
  to authenticated
  using (
    public.has_role(auth.uid(), 'admin'::app_role)
    and public.has_admin_verification(auth.uid())
  )
  with check (
    public.has_role(auth.uid(), 'admin'::app_role)
    and public.has_admin_verification(auth.uid())
  );

-- Add uniqueness to avoid duplicate role rows per user
create unique index if not exists ux_user_roles_user_id_role
  on public.user_roles(user_id, role);

-- Audit log for all role changes
create table if not exists public.role_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  changed_by uuid,
  old_role app_role,
  new_role app_role,
  action text not null, -- insert | update | delete
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.role_audit_log enable row level security;

-- Only admins can read audit logs; no client-side writes allowed
drop policy if exists "Admins can view role audit logs" on public.role_audit_log;
create policy "Admins can view role audit logs"
  on public.role_audit_log
  for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'admin'::app_role)
    and public.has_admin_verification(auth.uid())
  );

-- Trigger to log any change to user_roles
create or replace function public.log_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_old_role app_role;
  v_new_role app_role;
begin
  if (tg_op = 'INSERT') then
    v_action := 'insert';
    v_new_role := new.role;
    insert into public.role_audit_log(user_id, changed_by, old_role, new_role, action)
    values (new.user_id, auth.uid(), null, v_new_role, v_action);
    return new;
  elsif (tg_op = 'UPDATE') then
    v_action := 'update';
    v_old_role := old.role;
    v_new_role := new.role;
    insert into public.role_audit_log(user_id, changed_by, old_role, new_role, action)
    values (new.user_id, auth.uid(), v_old_role, v_new_role, v_action);
    return new;
  elsif (tg_op = 'DELETE') then
    v_action := 'delete';
    v_old_role := old.role;
    insert into public.role_audit_log(user_id, changed_by, old_role, new_role, action)
    values (old.user_id, auth.uid(), v_old_role, null, v_action);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_log_role_change on public.user_roles;
create trigger trg_log_role_change
  after insert or update or delete on public.user_roles
  for each row execute function public.log_role_change();

-- Guardrail: prevent self-promotion to admin
create or replace function public.prevent_self_admin_promotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op in ('INSERT','UPDATE')) then
    if new.role = 'admin'::app_role and new.user_id = auth.uid() then
      raise exception 'Users cannot assign themselves the admin role';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_prevent_self_admin_promotion on public.user_roles;
create trigger trg_prevent_self_admin_promotion
  before insert or update on public.user_roles
  for each row execute function public.prevent_self_admin_promotion();

-- Guardrail: basic rate limiting for role changes per actor (50/hour)
create or replace function public.limit_role_changes_per_hour()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_changes int;
begin
  -- allow system actions without session
  if auth.uid() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  select count(*) into v_changes
  from public.role_audit_log
  where changed_by = auth.uid()
    and created_at > now() - interval '1 hour';

  if v_changes >= 50 then
    raise exception 'Too many role changes in the last hour';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_limit_role_changes_per_hour on public.user_roles;
create trigger trg_limit_role_changes_per_hour
  before insert or update or delete on public.user_roles
  for each row execute function public.limit_role_changes_per_hour();

-- Helpful indexes for audit queries
create index if not exists idx_role_audit_log_user_id on public.role_audit_log(user_id);
create index if not exists idx_role_audit_log_changed_by on public.role_audit_log(changed_by);
create index if not exists idx_role_audit_log_created_at on public.role_audit_log(created_at);
