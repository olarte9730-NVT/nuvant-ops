-- NUVANT OPS - Permisos iniciales para módulos operativos
-- Ejecutar en Supabase SQL Editor en el proyecto de desarrollo.
-- Otorga permisos al usuario ya existente para que pueda probar los módulos.
-- No contiene datos de pedidos, clientes ni productos reales.

do $$
declare
  u record;
  m text;
begin
  for u in select id,email from auth.users loop
    insert into public.user_profiles(user_id,email,active)
    values(u.id,u.email,true)
    on conflict(user_id) do update set email=excluded.email,active=true,updated_at=now();

    foreach m in array array['pedidos','inventarios','planeacion','produccion','incumplimientos','reportes','notificaciones','administracion'] loop
      insert into public.module_permissions(
        user_id,module_key,can_view,can_create,can_edit,can_delete,can_approve,can_import,can_export
      ) values (u.id,m,true,true,true,false,true,true,true)
      on conflict(user_id,module_key) do update set
        can_view=true,can_create=true,can_edit=true,can_delete=false,
        can_approve=true,can_import=true,can_export=true,updated_at=now();
    end loop;
  end loop;
end $$;
