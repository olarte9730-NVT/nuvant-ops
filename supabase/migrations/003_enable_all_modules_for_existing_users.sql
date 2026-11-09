-- NUVANT OPS - Permisos iniciales para usuarios existentes
-- Ejecutar en Supabase SQL Editor después de revisar/aprobar con TI.
-- No contiene datos reales ni credenciales.

insert into public.user_profiles (user_id, email, active)
select id, email, true
from auth.users
on conflict (user_id) do update
set email = excluded.email,
    active = true,
    updated_at = now();

insert into public.module_permissions
  (user_id, module_key, can_view, can_create, can_edit, can_delete, can_approve, can_import, can_export)
select
  u.id,
  m.module_key,
  true,
  true,
  true,
  false,
  true,
  true,
  true
from auth.users u
cross join (
  values
    ('productos'),
    ('pedidos'),
    ('inventarios'),
    ('planeacion'),
    ('produccion'),
    ('incumplimientos'),
    ('reportes'),
    ('notificaciones'),
    ('administracion')
) as m(module_key)
on conflict (user_id, module_key) do update
set can_view = excluded.can_view,
    can_create = excluded.can_create,
    can_edit = excluded.can_edit,
    can_delete = false,
    can_approve = excluded.can_approve,
    can_import = excluded.can_import,
    can_export = excluded.can_export,
    updated_at = now();
