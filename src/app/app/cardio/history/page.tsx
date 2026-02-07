"use client";

import { ActivityHistory } from "@/app/app/_components/ActivityHistory";

export default function CardioHistoryPage() {
  return (
    <div className="space-y-8">
      <ActivityHistory title="Walking" activityKey="walking" emoji="🚶" />
      <div className="border-t" style={{ borderColor: "var(--border-secondary)" }} />
      <ActivityHistory title="Running" activityKey="running" emoji="🏃" />
    </div>
  );
}
