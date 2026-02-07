"use client";

import { ActivityLogger } from "@/app/app/_components/ActivityLogger";

export default function RowingPage() {
  return (
    <ActivityLogger
      title="Rowing"
      activityKey="rowing"
      emoji="🚣"
      fields={[
        { name: "meters", label: "Meters", unit: "meters", inputMode: "numeric", placeholder: "5000", required: true },
        { name: "minutes", label: "Minutes", unit: "minutes", inputMode: "decimal", placeholder: "20" },
      ]}
      historyHref="/app/rowing/history"
      subtitle="Log your erg sessions."
    />
  );
}
