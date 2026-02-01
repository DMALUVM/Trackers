# Daily Routines — PROJECT_PROGRESS

## North star
A world-class, mobile-first tracking app with:
- Daily routines checklist + day modes (normal/travel/sick)
- Progress view: calendar heatmap (green/yellow/red based on non-negotiables)
- Weekly goals (Mon–Sun), e.g. rowing 5x/week (not penalizing specific days)
- Supabase persistence + private-by-default (RLS)
- Passkeys (Face ID-style) after core flows are stable

## Guardrails (do not break)
- Never overwrite/delete user-entered history without explicit migration.
- Additive schema changes only.
- Changes ship as small commits, one task per commit.
- Always provide Dave checkpoints with commit hashes at key milestones.

## Definitions
### Calendar coloring
- Green: all non-negotiables met
- Yellow: missed exactly 1 non-negotiable
- Red: missed 2+ non-negotiables
- Non-negotiables are user-editable. Dave’s current non-negotiables:
  - Nattokinase
  - Lymphatic flow
  - Workout (satisfied by weights OR rowing)
  - Collagen/creatine
  - Breathwork

### Weekly goals
- Week: Mon–Sun
- Rowing goal: 5x/week. Missing a day is fine; track weekly total.

## Current status (ground truth)
- Repo: DMALUVM/Trackers (Vercel: trackers-ebon.vercel.app)
- App has:
  - Dark/contrast UI
  - Routines screen with emojis
  - Progress screen route (/app/routines/progress) placeholder calendar
  - Temporary local persistence via localStorage (to be replaced)
- Supabase migration added (RLS): `supabase/migrations/001_init.sql` (commit: c445414)

## Current task (ONE)
Onboarding + defaults:
- Stop auto-seeding Dave defaults for NEW users.
- Add onboarding gate when routine_items is empty (Start blank / Choose template).
- Ensure RLS isolation is correct and no cross-user leakage is possible.

## Next tasks (queue)
1) Apply migration in Supabase and verify RLS with a real user (auth.uid scoping).
2) Implement seed routine items + non-negotiables in-app (first login only).
3) Replace localStorage save with Supabase upserts.
4) Populate Progress calendar from Supabase history using green/yellow/red logic.
5) Weekly goals UI + compute rowing count for current week.
6) Add passkeys (WebAuthn) sign-in.

## Checkpoints to send Dave
- Schema+RLS applied and verified (with proof + any adjustments)
- Supabase save working (today logs persist across refresh/device)
- Progress calendar populated from real data
- Weekly goals working
