-- ====================================================================
-- FASE 1: MIGRACIONES BD + SEEDS GEO RD
-- Geografía RD, Domicilio en clients, Notarios completos, act_parties
-- ====================================================================

-- 1.1 Geografía RD (idempotente)
create table if not exists public.provincias (
  id serial primary key,
  nombre text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.municipios (
  id serial primary key,
  provincia_id int not null references public.provincias(id) on delete cascade,
  nombre text not null,
  created_at timestamptz default now(),
  unique(provincia_id, nombre)
);
create index if not exists idx_municipios_prov on public.municipios(provincia_id);

create table if not exists public.sectores (
  id serial primary key,
  municipio_id int not null references public.municipios(id) on delete cascade,
  nombre text not null,
  created_at timestamptz default now(),
  unique(municipio_id, nombre)
);
create index if not exists idx_sectores_mun on public.sectores(municipio_id);

-- 1.2 Domicilio en clients (agregar columnas faltantes si no existen)
alter table public.clients
  add column if not exists provincia_id int references public.provincias(id),
  add column if not exists municipio_id int references public.municipios(id),
  add column if not exists sector_id int references public.sectores(id);

-- Las demás columnas ya existen según el schema actual

-- 1.3 Notarios (agregar columnas faltantes)
alter table public.notarios
  add column if not exists exequatur text,
  add column if not exists municipio_id int references public.municipios(id);

-- 1.4 Vista notarios para autollenado
create or replace view public.v_notarios as
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

-- 1.5 Contraparte/Demandado + Abogados contrarios
create table if not exists public.act_parties (
  id uuid primary key default gen_random_uuid(),
  expediente_id text,
  acto_slug text,
  persona_id uuid references public.clients(id) on delete restrict,
  professional_id uuid, -- no FK porque puede ser lawyer/notario/etc
  side text not null check (side in ('actor','demandado','tercero')),
  rol text not null,
  snapshot jsonb default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  tenant_id uuid,
  user_id uuid not null
);

create index if not exists idx_act_parties_exp on public.act_parties(expediente_id);
create index if not exists idx_act_parties_side on public.act_parties(side);
create index if not exists idx_act_parties_user on public.act_parties(user_id);

-- RLS para act_parties
alter table public.act_parties enable row level security;

drop policy if exists "Users can read own act_parties" on public.act_parties;
create policy "Users can read own act_parties" on public.act_parties
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own act_parties" on public.act_parties;
create policy "Users can insert own act_parties" on public.act_parties
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own act_parties" on public.act_parties;
create policy "Users can update own act_parties" on public.act_parties
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own act_parties" on public.act_parties;
create policy "Users can delete own act_parties" on public.act_parties
  for delete using (auth.uid() = user_id);

-- 1.6 SEEDS Geografía RD (catálogo oficial completo)
-- Provincias principales
insert into public.provincias (nombre) values
  ('Distrito Nacional'),
  ('Santo Domingo'),
  ('Santiago'),
  ('La Altagracia'),
  ('Puerto Plata'),
  ('La Vega'),
  ('San Cristóbal'),
  ('Duarte'),
  ('La Romana'),
  ('San Pedro de Macorís'),
  ('Espaillat'),
  ('Barahona'),
  ('Azua'),
  ('Peravia'),
  ('Monte Plata'),
  ('Sánchez Ramírez'),
  ('María Trinidad Sánchez'),
  ('Samaná'),
  ('Monseñor Nouel'),
  ('Monte Cristi'),
  ('Dajabón'),
  ('Valverde'),
  ('Santiago Rodríguez'),
  ('Baoruco'),
  ('Independencia'),
  ('El Seibo'),
  ('Hato Mayor'),
  ('San José de Ocoa'),
  ('Hermanas Mirabal'),
  ('San Juan'),
  ('Elías Piña'),
  ('Pedernales')
on conflict (nombre) do nothing;

-- Municipios principales (selección representativa)
insert into public.municipios (provincia_id, nombre) 
select p.id, m.nombre from public.provincias p
cross join lateral (values
  (1, 'Santo Domingo de Guzmán'),
  (2, 'Santo Domingo Este'),
  (2, 'Santo Domingo Norte'),
  (2, 'Santo Domingo Oeste'),
  (2, 'Boca Chica'),
  (2, 'San Antonio de Guerra'),
  (2, 'Los Alcarrizos'),
  (2, 'Pedro Brand'),
  (3, 'Santiago de los Caballeros'),
  (3, 'Licey al Medio'),
  (3, 'Tamboril'),
  (3, 'Villa Bisonó'),
  (4, 'Higüey'),
  (4, 'San Rafael del Yuma'),
  (5, 'Puerto Plata'),
  (5, 'Sosúa'),
  (5, 'Cabarete'),
  (6, 'La Vega'),
  (6, 'Constanza'),
  (6, 'Jarabacoa'),
  (7, 'San Cristóbal'),
  (7, 'Villa Altagracia'),
  (7, 'Bajos de Haina'),
  (9, 'La Romana'),
  (10, 'San Pedro de Macorís'),
  (11, 'Moca'),
  (12, 'Barahona'),
  (13, 'Azua'),
  (19, 'Bonao')
) as m(prov_id, nombre)
where p.id = m.prov_id
on conflict (provincia_id, nombre) do nothing;

-- Sectores principales (ejemplos representativos)
insert into public.sectores (municipio_id, nombre)
select m.id, s.nombre from public.municipios m
cross join lateral (values
  ('Santo Domingo de Guzmán', 'Zona Colonial'),
  ('Santo Domingo de Guzmán', 'Gazcue'),
  ('Santo Domingo de Guzmán', 'Naco'),
  ('Santo Domingo de Guzmán', 'Piantini'),
  ('Santo Domingo Este', 'Los Mina'),
  ('Santo Domingo Este', 'San Isidro'),
  ('Santo Domingo Norte', 'Villa Mella'),
  ('Santiago de los Caballeros', 'Centro'),
  ('Santiago de los Caballeros', 'Gurabo'),
  ('Puerto Plata', 'Centro'),
  ('La Vega', 'Centro'),
  ('San Cristóbal', 'Centro')
) as s(mun_nombre, nombre)
where m.nombre = s.mun_nombre
on conflict (municipio_id, nombre) do nothing;