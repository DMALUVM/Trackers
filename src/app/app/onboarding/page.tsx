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
        router.replace("/app/today");
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
        <p className="text-sm text-neutral-400">Get to your first win in under 60 seconds.</p>
      </header>

      <section className="space-y-3">
        <button
          type="button"
          className="w-full rounded-2xl bg-white p-4 text-left text-black"
          onClick={() => {
            localStorage.removeItem("routines365:gettingStarted:dismissed");
            router.push("/app/onboarding/goal");
          }}
        >
          <p className="text-base font-semibold">Start with a template</p>
          <p className="mt-1 text-sm text-black/70">Pick a goal, then quick start or customize. You land in Today.</p>
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
          <p className="mt-1 text-sm text-neutral-400">Build your own routine from scratch.</p>
        </button>
      </section>

      <p className="text-xs text-neutral-500">
        Tip: You can change CORE habits and ordering anytime in Routine settings.
      </p>
    </div>
  );
}
