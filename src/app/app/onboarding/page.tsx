"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRoutineItems } from "@/lib/supabaseData";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const items = await listRoutineItems();
      if (items.length > 0) { router.replace("/app/today"); return; }
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Welcome</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Welcome</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Get to your first win in under 60 seconds.</p>
      </header>

      <section className="space-y-3">
        <button type="button" className="btn-primary w-full p-4 text-left rounded-2xl"
          onClick={() => { localStorage.removeItem("routines365:gettingStarted:dismissed"); router.push("/app/onboarding/goal"); }}>
          <p className="text-base font-semibold">Start with a template</p>
          <p className="mt-1 text-sm opacity-70">Pick a goal, then quick start or customize.</p>
        </button>

        <button type="button" className="btn-secondary w-full p-4 text-left rounded-2xl"
          onClick={() => { localStorage.removeItem("routines365:gettingStarted:dismissed"); router.replace("/app/settings/routines"); }}>
          <p className="text-base font-semibold">Start blank</p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Build your own routine from scratch.</p>
        </button>
      </section>

      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        Tip: You can change CORE habits and ordering anytime in Routine settings.
      </p>
    </div>
  );
}
