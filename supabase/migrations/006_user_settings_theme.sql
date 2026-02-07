-- Add theme preference to user_settings (persists across devices/logins)

alter table public.user_settings
  add column if not exists theme text not null default 'system';
