-- ============================================================================
-- 008: Account deletion RPC + server-side promo code validation
-- ============================================================================

-- 1) Full account deletion (Apple Guideline 5.1.1v compliance)
-- Deletes user data from ALL tables, then removes the auth.users record.
-- Must be SECURITY DEFINER to access auth.users.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from all user data tables (order matters for FK constraints)
  DELETE FROM public.day_snoozes WHERE user_id = uid;
  DELETE FROM public.daily_checks WHERE user_id = uid;
  DELETE FROM public.daily_logs WHERE user_id = uid;
  DELETE FROM public.activity_logs WHERE user_id = uid;
  DELETE FROM public.reminders WHERE user_id = uid;
  DELETE FROM public.push_subscriptions WHERE user_id = uid;
  DELETE FROM public.routine_items WHERE user_id = uid;
  DELETE FROM public.weekly_goals WHERE user_id = uid;
  DELETE FROM public.user_settings WHERE user_id = uid;
  DELETE FROM public.partner_stats WHERE user_id = uid;
  DELETE FROM public.partnerships WHERE user_a = uid OR user_b = uid;
  DELETE FROM public.profiles WHERE id = uid;

  -- Delete the auth record itself (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- 2) Promo code table + validation RPC (codes stay server-side only)
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY,
  max_uses INTEGER DEFAULT NULL,        -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT NULL    -- NULL = never expires
);

-- No RLS needed — users never query this table directly
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
-- No policies = no direct access. Only the RPC (SECURITY DEFINER) touches it.

-- Track which users redeemed which codes (prevents re-use per user)
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL REFERENCES public.promo_codes(code),
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, code)
);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own redemptions" ON public.promo_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- Seed initial promo codes
INSERT INTO public.promo_codes (code, max_uses, active) VALUES
  ('BETA2026', NULL, true),
  ('FOUNDER', 100, true),
  ('EARLYBIRD', 500, true)
ON CONFLICT (code) DO NOTHING;

-- Server-side promo code validation RPC
CREATE OR REPLACE FUNCTION public.redeem_promo_code(code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  normalized TEXT;
  promo RECORD;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Not authenticated');
  END IF;

  normalized := upper(trim(code_input));

  -- Look up the code
  SELECT * INTO promo FROM public.promo_codes
    WHERE code = normalized AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Invalid code');
  END IF;

  -- Check expiry
  IF promo.expires_at IS NOT NULL AND promo.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Code expired');
  END IF;

  -- Check max uses
  IF promo.max_uses IS NOT NULL AND promo.current_uses >= promo.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Code fully redeemed');
  END IF;

  -- Check if user already redeemed this code
  IF EXISTS (SELECT 1 FROM public.promo_redemptions WHERE user_id = uid AND code = normalized) THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Already redeemed');
  END IF;

  -- Redeem: record it and increment counter
  INSERT INTO public.promo_redemptions (user_id, code) VALUES (uid, normalized);
  UPDATE public.promo_codes SET current_uses = current_uses + 1 WHERE code = normalized;

  RETURN jsonb_build_object('valid', true, 'code', normalized);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_promo_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(TEXT) TO authenticated;
