# Supabase (Daily Routines)

This folder holds SQL migrations for the Daily Routines app.

## Apply
In Supabase SQL editor, run the latest migration file(s) under `supabase/migrations/`.

## Design goals
- User-scoped data (auth.uid())
- RLS enabled on every table
- Additive migrations only (do not overwrite user data)

## Key tables
- `routine_items`: user-defined checklist items (with emoji + non-negotiable flag + optional days_of_week)
- `daily_logs`: one row per user per day (day_mode, sex, did_rowing, did_weights)
- `daily_checks`: completion records per routine_item per day
- `weekly_goals`: e.g. rowing 5x/week
