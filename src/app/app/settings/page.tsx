"use client";

import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-neutral-400">Account and app preferences.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
        <a
          className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
          href="/app/settings/routines"
        >
          Edit routines + non-negotiables
        </a>
        <a
          className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
          href="/app/cardio"
        >
          Log walking/running
        </a>
        <a
          className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
          href="/app/settings/modules"
        >
          Customize bottom tabs
        </a>
        <a
          className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
          href="/app/settings/backup"
        >
          Export / backup data
        </a>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <button
          className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs text-neutral-400">
          Build: <span className="text-neutral-200">UX-v1</span>
        </p>
      </section>
    </div>
  );
}
