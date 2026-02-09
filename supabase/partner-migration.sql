-- ═══════════════════════════════════════════════════
-- ACCOUNTABILITY PARTNER — Supabase Migration
-- ═══════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to create the
-- tables needed for the partner feature.
-- ═══════════════════════════════════════════════════

-- Partner stats (public profile visible to partner)
create table if not exists partner_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Anonymous',
  current_streak int not null default 0,
  best_streak int not null default 0,
  today_done int not null default 0,
  today_total int not null default 0,
  last_active date not null default current_date,
  updated_at timestamptz not null default now()
);

-- Partnerships (1:1 accountability)
create table if not exists partnerships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id) on delete set null,
  invite_code text unique not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'ended')),
  created_at timestamptz not null default now()
);

-- Cheers (lightweight nudge/motivation)
create table if not exists partner_cheers (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_partnerships_user on partnerships(user_id);
create index if not exists idx_partnerships_partner on partnerships(partner_id);
create index if not exists idx_partnerships_code on partnerships(invite_code);
create index if not exists idx_cheers_to on partner_cheers(to_user_id, created_at desc);

-- ═══════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════

alter table partner_stats enable row level security;
alter table partnerships enable row level security;
alter table partner_cheers enable row level security;

-- partner_stats: Users can read/write their own, and read their partner's
create policy "Users can manage own stats"
  on partner_stats for all
  using (auth.uid() = user_id);

create policy "Partners can read each other's stats"
  on partner_stats for select
  using (
    user_id in (
      select case
        when user_id = auth.uid() then partner_id
        when partner_id = auth.uid() then user_id
      end
      from partnerships
      where status = 'active'
        and (user_id = auth.uid() or partner_id = auth.uid())
    )
  );

-- partnerships: Users can see their own partnerships
create policy "Users can see own partnerships"
  on partnerships for select
  using (user_id = auth.uid() or partner_id = auth.uid());

create policy "Users can create partnerships"
  on partnerships for insert
  with check (user_id = auth.uid());

create policy "Users can update own partnerships"
  on partnerships for update
  using (user_id = auth.uid() or partner_id = auth.uid());

-- Anyone can look up a pending invite by code (to accept it)
create policy "Anyone can find pending invites"
  on partnerships for select
  using (status = 'pending');

-- partner_cheers: Users can send cheers and see cheers sent to them
create policy "Users can send cheers"
  on partner_cheers for insert
  with check (from_user_id = auth.uid());

create policy "Users can see received cheers"
  on partner_cheers for select
  using (to_user_id = auth.uid());
