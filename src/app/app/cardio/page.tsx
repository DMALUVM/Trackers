"use client";

import { useState } from "react";
import { ActivityLogger } from "@/app/app/_components/ActivityLogger";

export default function CardioPage() {
  const [mode, setMode] = useState<"walking" | "running">("walking");

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button type="button"
          className={mode === "walking" ? "btn-primary text-sm" : "btn-secondary text-sm"}
          onClick={() => setMode("walking")}>
          🚶 Walking
        </button>
        <button type="button"
          className={mode === "running" ? "btn-primary text-sm" : "btn-secondary text-sm"}
          onClick={() => setMode("running")}>
          🏃 Running
        </button>
      </div>

      {mode === "walking" ? (
        <ActivityLogger
          title="Walking"
          activityKey="walking"
          emoji="🚶"
          fields={[
            { name: "steps", label: "Steps", unit: "steps", inputMode: "numeric", placeholder: "8500", required: true },
          ]}
          historyHref="/app/cardio/history"
        />
      ) : (
        <ActivityLogger
          title="Running"
          activityKey="running"
          emoji="🏃"
          fields={[
            { name: "miles", label: "Miles", unit: "miles", inputMode: "decimal", placeholder: "2.5", required: true },
          ]}
          historyHref="/app/cardio/history"
        />
      )}
    </div>
  );
}
