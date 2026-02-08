"use client";

import { useEffect, useState } from "react";
import { SubPageHeader } from "@/app/app/_components/ui";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { getRestDays, setRestDays } from "@/lib/restDays";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NUMS = [1, 2, 3, 4, 5, 6, 7];

export default function RestDaysPage() {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    setSelected(getRestDays());
  }, []);

  const toggle = (day: number) => {
    hapticLight();
    setSelected(prev => {
      const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      setRestDays(next);
      return next;
    });
  };

  const restCount = selected.length;

  return (
    <div className="space-y-6 stagger-sections">
      <SubPageHeader title="Rest Days" subtitle="Planned days off that protect your streak" backHref="/app/settings" />

      <section className="card p-5">
        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
          Select days where you intentionally take a break. On rest days, your habits will appear dimmed and
          the day automatically counts as <strong style={{ color: "var(--accent-green-text)" }}>green</strong> — no
          guilt, no broken streaks.
        </p>

        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((label, i) => {
            const dayNum = DAY_NUMS[i];
            const on = selected.includes(dayNum);
            return (
              <button key={dayNum} type="button" onClick={() => toggle(dayNum)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                style={{
                  background: on ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
                  border: on ? "2px solid var(--accent-green)" : "2px solid transparent",
                }}>
                <span className="text-xs font-bold" style={{ color: on ? "var(--accent-green-text)" : "var(--text-muted)" }}>
                  {label}
                </span>
                <div className="w-3 h-3 rounded-full" style={{
                  background: on ? "var(--accent-green)" : "var(--bg-card-hover)",
                  border: on ? "none" : "2px solid var(--text-faint)",
                }} />
              </button>
            );
          })}
        </div>
      </section>

      {restCount > 0 && (
        <section className="rounded-2xl p-4 animate-fade-in-up"
          style={{ background: "var(--accent-green-soft)", border: "1px solid var(--accent-green)" }}>
          <p className="text-sm font-medium text-center" style={{ color: "var(--accent-green-text)" }}>
            ✓ {restCount} rest day{restCount > 1 ? "s" : ""} per week ·{" "}
            {7 - restCount} active day{7 - restCount !== 1 ? "s" : ""}
          </p>
        </section>
      )}

      <section className="card p-5">
        <h3 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>💡 Why rest days matter</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Research shows that planned rest prevents burnout and actually improves long-term adherence.
          Missing a day by accident feels bad. Choosing to rest on purpose feels empowering.
          Your streak stays intact because you made an intentional decision.
        </p>
      </section>
    </div>
  );
}
