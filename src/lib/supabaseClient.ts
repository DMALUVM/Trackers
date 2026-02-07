import { createClient } from "@supabase/supabase-js";
import { cookieStorage } from "@/lib/cookieStorage";

// Fallback to placeholder during build (Next.js prerenders without env vars).
// At runtime these are always set via Vercel environment variables.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

// NOTE: Cookie names must be RFC-safe tokens. Avoid ":" and other separators.
const STORAGE_PREFIX = "r365_sb";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: STORAGE_PREFIX,
    // Cookie-backed persistence to prevent iOS PWA "random logout" behavior.
    storage: cookieStorage(STORAGE_PREFIX),
  },
});
