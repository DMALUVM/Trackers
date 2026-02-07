"use client";

import { ActivityLogger } from "@/app/app/_components/ActivityLogger";

export default function HydrationPage() {
  return (
    <ActivityLogger
      title="Hydration"
      activityKey="hydration"
      emoji="💧"
      fields={[
        { name: "glasses", label: "Glasses of water", unit: "glasses", inputMode: "numeric", placeholder: "8", required: true },
      ]}
      historyHref="/app/hydration"
      subtitle="Track your daily water intake."
    />
  );
}
