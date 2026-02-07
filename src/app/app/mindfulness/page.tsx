"use client";

import { ActivityLogger } from "@/app/app/_components/ActivityLogger";

export default function MindfulnessPage() {
  return (
    <ActivityLogger
      title="Mindfulness"
      activityKey="meditation"
      emoji="🧘"
      fields={[
        { name: "minutes", label: "Minutes", unit: "minutes", inputMode: "numeric", placeholder: "10", required: true },
      ]}
      historyHref="/app/mindfulness"
      subtitle="Track meditation, breathwork, and mindfulness sessions."
    />
  );
}
