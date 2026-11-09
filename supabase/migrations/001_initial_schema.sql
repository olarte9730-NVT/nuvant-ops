-- NUVANT OPS - Esquema inicial de datos
-- Ejecutar en Supabase SQL Editor únicamente después de revisión/aprobación de TI.
-- No contiene datos reales ni credenciales.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_approve boolean not null default false,
  can_import boolean not null default false,
  can_export boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, module_key)
);

create or replace function public.has_module_permission(p_module text, p_action text default 'view')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    join public.module_permissions mp on mp.user_id = up.user_id
    where up.user_id = auth.uid()
      and up.active = true
      and mp.module_key = p_module
      and case p_action
        when 'view' then mp.can_view
        when 'create' then mp.can_create
        when 'edit' then mp.can_edit
        when 'delete' then mp.can_delete
        when 'approve' then mp.can_approve
        when 'import' then mp.can_import
        when 'export' then mp.can_export
        else false
      end
  );
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  description text not null,
  family text,
  unit text not null default 'UND',
  production_line text,
  active boolean not null default true,
  observations text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  source_file_name text not null,
  source_type text not null check (source_type in ('excel','pdf','csv','manual')),
  status text not null default 'pending' check (status in ('pending','validated','applied','rejected','partial')),
  total_rows integer not null default 0,
  accepted_rows integer not null default 0,
  rejected_rows integer not null default 0,
  validation_summary jsonb not null default '{}'::jsonb,
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now(),
  applied_at timestamptz
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  source_customer_code text,
  source_customer_name text not null,
  created_on date,
  source_version integer not null default 1,
  import_batch_id uuid references public.import_batches(id),
  source_row jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','partially_planned','planned','fulfilled','cancelled')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  line_number integer not null default 1,
  product_id uuid references public.products(id),
  source_product_code text not null,
  source_product_description text,
  required_date date not null,
  requested_quantity numeric(18,3) not null check (requested_quantity >= 0),
  unit text not null default 'UND',
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  priority_reason text,
  priority_set_by uuid references auth.users(id),
  priority_set_at timestamptz,
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id, line_number)
);

create table if not exists public.inventory_snapshots (
  id uuid primary key default gen_random_uuid(),
  cutoff_date date not null,
  source_file_name text,
  import_batch_id uuid references public.import_batches(id),
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz not null default now(),
  observations text
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.inventory_snapshots(id) on delete cascade,
  product_id uuid references public.products(id),
  source_product_code text not null,
  source_product_description text,
  available_quantity numeric(18,3) not null default 0,
  unit text not null default 'UND',
  warehouse_location text,
  lot text,
  observations text,
  unique(snapshot_id, source_product_code, warehouse_location, lot)
);

create table if not exists public.production_schedules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id),
  product_code text not null,
  product_description text,
  planned_date date not null,
  planned_quantity numeric(18,3) not null check (planned_quantity >= 0),
  unit text not null default 'UND',
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','fully_produced','partially_produced','unfulfilled','rescheduled','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  observations text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedule_order_allocations (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.production_schedules(id) on delete cascade,
  order_line_id uuid not null references public.order_lines(id),
  allocated_quantity numeric(18,3) not null check (allocated_quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.production_actuals (
  id uuid primary key default gen_random_uuid(),
  production_date date not null,
  product_id uuid references public.products(id),
  product_code text not null,
  product_description text,
  produced_quantity numeric(18,3) not null default 0 check (produced_quantity >= 0),
  rejected_quantity numeric(18,3) not null default 0 check (rejected_quantity >= 0),
  unit text not null default 'UND',
  import_batch_id uuid references public.import_batches(id),
  observations text,
  responsible_name text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.noncompliance_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id),
  product_code text not null,
  affected_date date not null,
  affected_quantity numeric(18,3) not null check (affected_quantity >= 0),
  cause text not null check (cause in ('material_shortage','capacity_shortage','equipment_failure','quality_issue','other','commercial_priority_change')),
  description text,
  schedule_id uuid references public.production_schedules(id),
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.rescheduling_events (
  id uuid primary key default gen_random_uuid(),
  original_schedule_id uuid references public.production_schedules(id),
  new_schedule_id uuid references public.production_schedules(id),
  product_code text not null,
  quantity numeric(18,3) not null check (quantity >= 0),
  original_date date,
  new_date date not null,
  reason text,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create table if not exists public.daily_closures (
  id uuid primary key default gen_random_uuid(),
  closure_date date not null,
  status text not null default 'closed' check (status in ('closed','reopened')),
  closed_by uuid not null references auth.users(id),
  closed_at timestamptz not null default now(),
  reopened_by uuid references auth.users(id),
  reopened_at timestamptz,
  reopen_reason text,
  observations text
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  message text not null,
  related_module text,
  related_record_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('insert','update','delete','approve','reopen','close','import')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  reason text
);

create index if not exists idx_order_lines_product_date on public.order_lines(source_product_code, required_date);
create index if not exists idx_orders_number on public.orders(order_number);
create index if not exists idx_inventory_cutoff on public.inventory_snapshots(cutoff_date desc);
create index if not exists idx_inventory_product on public.inventory_items(source_product_code);
create index if not exists idx_schedule_date_product on public.production_schedules(planned_date, product_code);
create index if not exists idx_actual_date_product on public.production_actuals(production_date, product_code);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, created_at desc) where read_at is null;
create index if not exists idx_audit_table_record on public.audit_log(table_name, record_id, changed_at desc);

-- RLS: sin permisos explícitos, no hay acceso a datos operativos.
alter table public.user_profiles enable row level security;
alter table public.module_permissions enable row level security;
alter table public.products enable row level security;
alter table public.import_batches enable row level security;
alter table public.orders enable row level security;
alter table public.order_lines enable row level security;
alter table public.inventory_snapshots enable row level security;
alter table public.inventory_items enable row level security;
alter table public.production_schedules enable row level security;
alter table public.schedule_order_allocations enable row level security;
alter table public.production_actuals enable row level security;
alter table public.noncompliance_events enable row level security;
alter table public.rescheduling_events enable row level security;
alter table public.daily_closures enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "profile_self_read" on public.user_profiles;
create policy "profile_self_read" on public.user_profiles for select to authenticated using (user_id = auth.uid());

drop policy if exists "permissions_self_read" on public.module_permissions;
create policy "permissions_self_read" on public.module_permissions for select to authenticated using (user_id = auth.uid());

-- Perfil y permisos solo se administran desde entorno administrativo autorizado.
drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products for select to authenticated using (public.has_module_permission('productos','view'));
drop policy if exists "products_insert" on public.products;
create policy "products_insert" on public.products for insert to authenticated with check (public.has_module_permission('productos','create'));
drop policy if exists "products_update" on public.products;
create policy "products_update" on public.products for update to authenticated using (public.has_module_permission('productos','edit')) with check (public.has_module_permission('productos','edit'));
drop policy if exists "products_delete" on public.products;
create policy "products_delete" on public.products for delete to authenticated using (public.has_module_permission('productos','delete'));

-- Políticas por módulo para las demás tablas.
do $$
declare t text; m text;
begin
  for t,m in select * from (values
    ('import_batches','pedidos'),
    ('orders','pedidos'),('order_lines','pedidos'),
    ('inventory_snapshots','inventarios'),('inventory_items','inventarios'),
    ('production_schedules','planeacion'),('schedule_order_allocations','planeacion'),
    ('production_actuals','produccion'),
    ('noncompliance_events','incumplimientos'),('rescheduling_events','incumplimientos'),
    ('daily_closures','produccion')
  ) as x(table_name,module_key)
  loop
    execute format('drop policy if exists %I on public.%I', t||'_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.has_module_permission(%L,''view''))', t||'_read', t, m);
    execute format('drop policy if exists %I on public.%I', t||'_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_module_permission(%L,''create''))', t||'_insert', t, m);
    execute format('drop policy if exists %I on public.%I', t||'_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_module_permission(%L,''edit'')) with check (public.has_module_permission(%L,''edit''))', t||'_update', t, m, m);
    execute format('drop policy if exists %I on public.%I', t||'_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_module_permission(%L,''delete''))', t||'_delete', t, m);
  end loop;
end $$;

drop policy if exists "notifications_own_read" on public.notifications;
create policy "notifications_own_read" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- El registro de auditoría no permite modificaciones desde clientes.
drop policy if exists "audit_view" on public.audit_log;
create policy "audit_view" on public.audit_log for select to authenticated using (public.has_module_permission('administracion','view'));
