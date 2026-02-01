"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRoutineItems } from "@/lib/supabaseData";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const items = await listRoutineItems();
      if (items.length > 0) {
        router.replace("/app/routines");
        return;
      }
      setLoading(false);
    };
    void run();
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-sm text-neutral-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Welcome</h1>
        <p className="text-sm text-neutral-400">
          Let’s get you set up. Most people start with a template.
        </p>
      </header>

      <section className="space-y-3">
        <button
          type="button"
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
          onClick={() => {
            localStorage.removeItem("routines365:gettingStarted:dismissed");
            router.push("/app/onboarding/templates");
          }}
        >
          <p className="text-base font-semibold">Recommended: Choose a template</p>
          <p className="mt-1 text-sm text-neutral-400">
            Start with a proven routine pack, then customize it.
          </p>
        </button>

        <button
          type="button"
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
          onClick={() => {
            localStorage.removeItem("routines365:gettingStarted:dismissed");
            router.replace("/app/settings/routines");
          }}
        >
          <p className="text-base font-semibold">Start blank</p>
          <p className="mt-1 text-sm text-neutral-400">
            Add your own routines and emojis from scratch.
          </p>
        </button>

        <button
          type="button"
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
          onClick={() => router.push("/app/settings/modules")}
        >
          <p className="text-base font-semibold">Choose tabs (optional)</p>
          <p className="mt-1 text-sm text-neutral-400">
            Show/hide tabs like Progress, Rowing, Cardio, Neuro.
          </p>
        </button>
      </section>

      <p className="text-xs text-neutral-500">
        Tip: after you start, mark your “Core” habits. That’s what powers the green/yellow/red calendar.
      </p>
    </div>
  );
}
