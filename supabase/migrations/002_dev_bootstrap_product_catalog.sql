-- Bootstrap de desarrollo para el primer usuario autorizado.
-- Reemplaza el correo de ejemplo por el correo con el que inicias sesión.
-- Ejecutar solo en un proyecto de desarrollo aprobado por TI.

do $$
declare
  v_user_id uuid;
  v_email text := 'REEMPLAZAR_POR_CORREO_DE_LOGIN';
begin
  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No existe un usuario de Auth con ese correo. Crea primero el usuario en Supabase Authentication.';
  end if;

  insert into public.user_profiles (user_id, email, active)
  values (v_user_id, v_email, true)
  on conflict (user_id) do update
    set email = excluded.email, active = true, updated_at = now();

  insert into public.module_permissions (
    user_id, module_key, can_view, can_create, can_edit, can_delete,
    can_approve, can_import, can_export
  )
  values (
    v_user_id, 'productos', true, true, true, false, false, true, true
  )
  on conflict (user_id, module_key) do update set
    can_view = excluded.can_view,
    can_create = excluded.can_create,
    can_edit = excluded.can_edit,
    can_delete = excluded.can_delete,
    can_approve = excluded.can_approve,
    can_import = excluded.can_import,
    can_export = excluded.can_export,
    updated_at = now();
end $$;
