"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { templatePacks } from "@/lib/templates";
import { createRoutineItemsBulk, listRoutineItems } from "@/lib/supabaseData";

export default function TemplatePickerPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const items = await listRoutineItems();
      if (items.length > 0) {
        router.replace("/app/routines");
      }
    };
    void run();
  }, [router]);

  const applyTemplate = async (id: string) => {
    setBusy(id);
    setError("");
    try {
      const pack = templatePacks.find((p) => p.id === id);
      if (!pack) throw new Error("Template not found");

      await createRoutineItemsBulk({
        items: pack.routines.map((r, idx) => ({
          label: r.label,
          emoji: r.emoji ?? null,
          section: r.section ?? "anytime",
          isNonNegotiable: r.isNonNegotiable ?? false,
          daysOfWeek: r.daysOfWeek ?? null,
          sortOrder: idx,
        })),
      });

      localStorage.removeItem("routines365:gettingStarted:dismissed");
      router.replace("/app/routines");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-neutral-400">
          Pick a starter pack. You can edit everything later.
        </p>
        {error ? <p className="text-xs text-rose-300">Error: {error}</p> : null}
      </header>

      <section className="space-y-3">
        {templatePacks.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!!busy}
            onClick={() => applyTemplate(p.id)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold">{p.title}</p>
              {busy === p.id ? (
                <span className="text-xs text-neutral-400">Applying…</span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-neutral-400">{p.desc}</p>
          </button>
        ))}
      </section>
    </div>
  );
}
