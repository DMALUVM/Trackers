"use client";

import { ActivityLogger } from "@/app/app/_components/ActivityLogger";

export default function SleepPage() {
  return (
    <ActivityLogger
      title="Sleep"
      activityKey="sleep_hours"
      emoji="😴"
      fields={[
        { name: "hours", label: "Hours slept", unit: "hours", inputMode: "decimal", placeholder: "7.5", required: true },
      ]}
      historyHref="/app/sleep"
      subtitle="Track your sleep duration daily."
    />
  );
}
