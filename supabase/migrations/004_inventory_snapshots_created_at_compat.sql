-- Compatibility fix for inventory_snapshots.
-- Some deployed clients may still request created_at. Preserve the original
-- upload timestamp by backfilling it from uploaded_at.
alter table public.inventory_snapshots
  add column if not exists created_at timestamptz;

update public.inventory_snapshots
set created_at = uploaded_at
where created_at is null;

alter table public.inventory_snapshots
  alter column created_at set default now();
