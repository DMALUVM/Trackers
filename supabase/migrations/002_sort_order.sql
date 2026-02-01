-- Add sort_order to routine_items for user-controlled ordering

alter table public.routine_items
add column if not exists sort_order integer;

create index if not exists routine_items_user_sort_idx
on public.routine_items(user_id, sort_order);
