-- Daily Routines v1 schema (Supabase)
-- Safe-by-default: user-scoped tables + RLS.

-- Extensions
create extension if not exists "pgcrypto";

-- 1) Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  display_name text
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2) Routine items (user-defined)
create table if not exists public.routine_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  label text not null,
  emoji text,
  section text not null default 'anytime', -- morning|anytime|night (soft)

  is_active boolean not null default true,
  is_non_negotiable boolean not null default false,

  -- schedule constraints (v1: simple)
  -- days_of_week uses ISO 1=Mon..7=Sun, empty/null means every day
  days_of_week smallint[]
);

create index if not exists routine_items_user_id_idx on public.routine_items(user_id);

alter table public.routine_items enable row level security;

create policy "routine_items_select_own"
  on public.routine_items for select
  using (auth.uid() = user_id);

create policy "routine_items_insert_own"
  on public.routine_items for insert
  with check (auth.uid() = user_id);

create policy "routine_items_update_own"
  on public.routine_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "routine_items_delete_own"
  on public.routine_items for delete
  using (auth.uid() = user_id);

-- 3) Daily logs (one row per user per date)
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  day_mode text not null default 'normal', -- normal|travel|sick
  sex boolean,

  -- workout flags (workout can be satisfied by rowing or weights per Dave's rule)
  did_weights boolean,
  did_rowing boolean,

  unique (user_id, date)
);

create index if not exists daily_logs_user_date_idx on public.daily_logs(user_id, date);

alter table public.daily_logs enable row level security;

create policy "daily_logs_select_own"
  on public.daily_logs for select
  using (auth.uid() = user_id);

create policy "daily_logs_insert_own"
  on public.daily_logs for insert
  with check (auth.uid() = user_id);

create policy "daily_logs_update_own"
  on public.daily_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_logs_delete_own"
  on public.daily_logs for delete
  using (auth.uid() = user_id);

-- 4) Checks (which routine items were completed for a date)
create table if not exists public.daily_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  routine_item_id uuid not null references public.routine_items (id) on delete cascade,
  created_at timestamptz not null default now(),

  done boolean not null default true,

  unique (user_id, date, routine_item_id)
);

create index if not exists daily_checks_user_date_idx on public.daily_checks(user_id, date);

alter table public.daily_checks enable row level security;

create policy "daily_checks_select_own"
  on public.daily_checks for select
  using (auth.uid() = user_id);

create policy "daily_checks_insert_own"
  on public.daily_checks for insert
  with check (auth.uid() = user_id);

create policy "daily_checks_update_own"
  on public.daily_checks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_checks_delete_own"
  on public.daily_checks for delete
  using (auth.uid() = user_id);

-- 5) Weekly goals (Mon–Sun)
create table if not exists public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  key text not null, -- e.g. rowing
  target_per_week integer not null,
  is_active boolean not null default true,

  unique (user_id, key)
);

create index if not exists weekly_goals_user_idx on public.weekly_goals(user_id);

alter table public.weekly_goals enable row level security;

create policy "weekly_goals_select_own"
  on public.weekly_goals for select
  using (auth.uid() = user_id);

create policy "weekly_goals_insert_own"
  on public.weekly_goals for insert
  with check (auth.uid() = user_id);

create policy "weekly_goals_update_own"
  on public.weekly_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "weekly_goals_delete_own"
  on public.weekly_goals for delete
  using (auth.uid() = user_id);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_daily_logs_updated_at on public.daily_logs;
create trigger set_daily_logs_updated_at
before update on public.daily_logs
for each row execute procedure public.set_updated_at();
