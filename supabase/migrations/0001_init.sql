-- TripTailor · initial schema
--
-- Run via:  supabase db push   (or in the Supabase dashboard SQL editor)
--
-- One table: saved_trips. Auth is handled by Supabase Auth (auth.users).
-- Row-level security ensures users can only read/write their own rows.

create extension if not exists "uuid-ossp";

create table if not exists public.saved_trips (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  iso       text not null,                       -- ISO-2 country code, e.g. "PT"
  month     int  not null check (month between 0 and 11),
  added_at  timestamptz not null default now(),
  unique (user_id, iso)                          -- one save per country per user
);

create index if not exists saved_trips_user_id_idx on public.saved_trips(user_id);

-- Row-level security
alter table public.saved_trips enable row level security;

-- Read your own rows
create policy "saved_trips: select own"
  on public.saved_trips for select
  using (auth.uid() = user_id);

-- Insert rows with your own user_id
create policy "saved_trips: insert own"
  on public.saved_trips for insert
  with check (auth.uid() = user_id);

-- Delete your own rows
create policy "saved_trips: delete own"
  on public.saved_trips for delete
  using (auth.uid() = user_id);
