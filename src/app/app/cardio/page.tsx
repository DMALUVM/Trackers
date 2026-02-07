"use client";

import { useState } from "react";
import { ActivityLogger } from "@/app/app/_components/ActivityLogger";
import { hapticLight } from "@/lib/haptics";

export default function CardioPage() {
  const [mode, setMode] = useState<"walking" | "running">("walking");

  return (
    <div className="space-y-6">
      {/* Segmented control */}
      <div className="rounded-2xl p-1 flex gap-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        {([
          { key: "walking" as const, label: "🚶 Walking" },
          { key: "running" as const, label: "🏃 Running" },
        ]).map(({ key, label }) => (
          <button key={key} type="button"
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-center transition-all duration-200"
            style={{
              background: mode === key ? "var(--btn-primary-bg)" : "transparent",
              color: mode === key ? "var(--btn-primary-text)" : "var(--text-muted)",
            }}
            onClick={() => { setMode(key); hapticLight(); }}>
            {label}
          </button>
        ))}
      </div>

      {mode === "walking" ? (
        <ActivityLogger
          title="Walking" activityKey="walking" emoji="🚶"
          fields={[{ name: "steps", label: "Steps", unit: "steps", inputMode: "numeric", placeholder: "8500", required: true }]}
          historyHref="/app/cardio/history"
        />
      ) : (
        <ActivityLogger
          title="Running" activityKey="running" emoji="🏃"
          fields={[{ name: "miles", label: "Miles", unit: "miles", inputMode: "decimal", placeholder: "2.5", required: true }]}
          historyHref="/app/cardio/history"
        />
      )}
    </div>
  );
}
