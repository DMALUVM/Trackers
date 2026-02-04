-- Day snoozes / skips (Today page)
-- Stores per-day, per-item snooze-until timestamp so Today behavior syncs across devices.

create table if not exists public.day_snoozes (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  routine_item_id uuid not null references public.routine_items (id) on delete cascade,
  snoozed_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (user_id, date, routine_item_id)
);

create index if not exists day_snoozes_user_date_idx on public.day_snoozes(user_id, date);

alter table public.day_snoozes enable row level security;

create policy "day_snoozes_select_own"
  on public.day_snoozes for select
  using (auth.uid() = user_id);

create policy "day_snoozes_insert_own"
  on public.day_snoozes for insert
  with check (auth.uid() = user_id);

create policy "day_snoozes_update_own"
  on public.day_snoozes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "day_snoozes_delete_own"
  on public.day_snoozes for delete
  using (auth.uid() = user_id);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_day_snoozes_updated_at on public.day_snoozes;
create trigger trg_day_snoozes_updated_at
before update on public.day_snoozes
for each row execute function public.set_updated_at();
