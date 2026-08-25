-- Site-wide availability settings (admin opens months / hours / season).
-- Run in Supabase SQL editor once.

create table if not exists public.availability_settings (
  id text primary key default 'default',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.availability_settings enable row level security;

-- Public read so the booking wizard can load open months for everyone.
drop policy if exists "Anyone can read availability settings" on public.availability_settings;
create policy "Anyone can read availability settings"
  on public.availability_settings for select
  using (true);

-- Writes go through SUPABASE_SERVICE_ROLE_KEY from admin API only.

insert into public.availability_settings (id, settings)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;
