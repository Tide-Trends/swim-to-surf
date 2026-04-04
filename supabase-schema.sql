-- Run this in your Supabase SQL editor to set up the database

create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  instructor text not null check (instructor in ('lukaah', 'estee')),
  swimmer_name text not null,
  swimmer_age integer not null,
  lesson_duration integer not null check (lesson_duration in (15, 30)),
  parent_name text not null,
  parent_email text not null,
  parent_phone text not null,
  notes text,
  day_of_week text[] not null,
  lesson_time time not null,
  second_day_time time,
  week_start date,
  month text,
  total_lessons integer not null,
  price integer not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  reminder_sent boolean not null default false,
  created_at timestamptz default now()
);

-- Index for fast availability lookups
create index if not exists idx_bookings_instructor_status on public.bookings (instructor, status);
create index if not exists idx_bookings_week_start on public.bookings (week_start) where week_start is not null;
create index if not exists idx_bookings_month on public.bookings (month) where month is not null;

-- RLS: anyone can insert (book), only authenticated users can read/update/delete
alter table public.bookings enable row level security;

create policy "Anyone can create bookings"
  on public.bookings for insert
  with check (true);

create policy "Authenticated users can view bookings"
  on public.bookings for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can update bookings"
  on public.bookings for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users can delete bookings"
  on public.bookings for delete
  using (auth.role() = 'authenticated');

-- Also allow public reads for availability checking (only needed columns)
create policy "Anyone can check slot availability"
  on public.bookings for select
  using (status = 'confirmed');
