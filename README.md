# Nuvant Ops — proyecto inicial

Starter de Next.js con inicio de sesión Supabase y restricción de correo `@nuvantglobal.com`.

## Antes de empezar
Este repositorio contiene una base técnica inicial, no una aplicación empresarial lista para producción. Los módulos del panel son marcadores visuales. No cargar información real, personal, confidencial ni operativa de Nuvant hasta contar con autorización de TI/Seguridad y revisión de arquitectura, privacidad, contratos, backups, control de acceso y políticas RLS.

## Requisitos
- Node.js 20+
- Proyecto Supabase
- Proyecto GitHub y cuenta Vercel

## Configuración local
1. Copiar `.env.example` a `.env.local`.
2. Configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` desde Supabase.
3. Ejecutar `npm install` y `npm run dev`.

## Supabase
1. Ejecutar `supabase/schema.sql` en SQL Editor.
2. En Authentication, desactivar el registro público si no se requiere.
3. Crear usuarios manualmente desde Authentication > Users.
4. Definir un procedimiento seguro para crear perfiles y asignar roles. El esquema actual no implementa aún una consola de administración ni autorización granular por rol.

## Vercel
Importar el repositorio GitHub, configurar las dos variables `NEXT_PUBLIC_SUPABASE_*` y desplegar. Configurar también las URL de redirección/autenticación en Supabase para el dominio publicado.

## Pendientes antes de producción
- Alta y administración segura de usuarios/roles.
- Políticas RLS por módulo y rol.
- Recuperación de contraseña, cierre de sesión y manejo completo de sesión.
- Auditoría, monitoreo, backups, pruebas y revisión de seguridad.
- Aprobación de TI/Seguridad de Nuvant.
