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
          Pick a starting point. You can fully customize routines, emojis, goals,
          and modules.
        </p>
      </header>

      <section className="space-y-3">
        <button
          type="button"
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
          onClick={() => router.push("/app/settings/modules")}
        >
          <p className="text-base font-semibold">Choose your modules</p>
          <p className="mt-1 text-sm text-neutral-400">
            Show/hide tabs like Progress, Rowing, Cardio, Neuro.
          </p>
        </button>

        <button
          type="button"
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
          onClick={() => router.replace("/app/settings/routines")}
        >
          <p className="text-base font-semibold">Start blank</p>
          <p className="mt-1 text-sm text-neutral-400">
            Add your own routines and emojis.
          </p>
        </button>

        <button
          type="button"
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
          onClick={() => router.push("/app/onboarding/templates")}
        >
          <p className="text-base font-semibold">Choose a template</p>
          <p className="mt-1 text-sm text-neutral-400">
            Fitness, morning routine, recovery, focus, and more.
          </p>
        </button>
      </section>

      <p className="text-xs text-neutral-500">
        Note: Neurofeedback is optional and not a default module.
      </p>
    </div>
  );
}
