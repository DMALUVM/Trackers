-- Activity logs (for metrics like meters rowed, miles walked/run)

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,

  activity_key text not null, -- e.g. rowing, walking, running
  value numeric not null,
  unit text not null, -- e.g. meters, miles
  notes text
);

create index if not exists activity_logs_user_date_idx on public.activity_logs(user_id, date);
create index if not exists activity_logs_user_key_date_idx on public.activity_logs(user_id, activity_key, date);

alter table public.activity_logs enable row level security;

create policy "activity_logs_select_own"
  on public.activity_logs for select
  using (auth.uid() = user_id);

create policy "activity_logs_insert_own"
  on public.activity_logs for insert
  with check (auth.uid() = user_id);

create policy "activity_logs_update_own"
  on public.activity_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "activity_logs_delete_own"
  on public.activity_logs for delete
  using (auth.uid() = user_id);
