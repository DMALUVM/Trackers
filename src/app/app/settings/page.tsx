"use client";

import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-600">Account and app preferences.</p>
      </header>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <button
          className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
