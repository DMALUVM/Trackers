"use client";

import { ActivityLogger } from "@/app/app/_components/ActivityLogger";

export default function FitnessPage() {
  return (
    <ActivityLogger
      title="Fitness"
      activityKey="workout"
      emoji="💪"
      fields={[
        { name: "minutes", label: "Duration", unit: "minutes", inputMode: "numeric", placeholder: "45", required: true },
      ]}
      historyHref="/app/fitness/history"
      subtitle="Log workouts — weights, classes, sports, anything."
    />
  );
}
