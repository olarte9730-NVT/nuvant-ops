-- Esquema inicial. Ejecutar en el SQL Editor de Supabase.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'employee' check (role in ('admin','planner','employee')),
  created_at timestamptz not null default now(),
  constraint profiles_nuvant_email check (lower(email) like '%@nuvantglobal.com')
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles
 for select to authenticated using (auth.uid() = id);
-- Las cuentas se crean manualmente desde Authentication > Users.
-- Antes de usar en producción, definir proceso seguro para crear perfiles,
-- políticas por rol, auditoría, copias de seguridad y revisión de TI.
