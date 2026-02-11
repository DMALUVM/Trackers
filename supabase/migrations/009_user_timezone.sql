-- Add timezone to user_settings for correct reminder delivery
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Index for efficient cron lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_timezone
  ON public.user_settings (timezone);
