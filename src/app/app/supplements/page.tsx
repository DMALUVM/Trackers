"use client";

import { ActivityLogger } from "@/app/app/_components/ActivityLogger";

export default function SupplementsPage() {
  return (
    <ActivityLogger
      title="Supplements"
      activityKey="supplements"
      emoji="💊"
      fields={[
        { name: "count", label: "Supplements taken", unit: "count", inputMode: "numeric", placeholder: "5", required: true },
      ]}
      historyHref="/app/supplements"
      subtitle="Log your daily supplement and medication stack."
    />
  );
}
