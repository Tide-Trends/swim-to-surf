-- Contact form submissions for admin dashboard (run in Supabase SQL editor)

create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_created_at on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
-- Inserts/reads use SUPABASE_SERVICE_ROLE_KEY from API routes only (RLS bypassed for service role).
