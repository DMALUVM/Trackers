import { createClient } from "@supabase/supabase-js";
import { cookieStorage } from "@/lib/cookieStorage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("Missing env NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) throw new Error("Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY");

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
