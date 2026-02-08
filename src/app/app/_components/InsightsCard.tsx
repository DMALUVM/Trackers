"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { useInsights, type Insight } from "@/lib/hooks";
import { SkeletonCard } from "@/app/app/_components/ui";
import { hapticLight } from "@/lib/haptics";

function InsightRow({ insight, index }: { insight: Insight; index: number }) {
  return (
    <div
      className="flex gap-3 py-3"
      style={{
        borderTop: index > 0 ? "1px solid var(--border-secondary)" : undefined,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <span className="text-2xl shrink-0 mt-0.5">{insight.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {insight.title}
        </p>
        <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {insight.body}
        </p>
      </div>
    </div>
  );
}

export function InsightsCard() {
  const { insights, loading, error } = useInsights();
  const [expanded, setExpanded] = useState(true);

  if (loading) return <SkeletonCard lines={4} />;
  if (error || insights.length === 0) return null;

  const preview = insights.slice(0, 2);
  const rest = insights.slice(2);

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} style={{ color: "var(--accent-yellow-text)" }} />
          <h3 className="text-sm font-bold tracking-wide uppercase" style={{ color: "var(--text-faint)" }}>
            Insights
          </h3>
        </div>
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => { setExpanded(e => !e); hapticLight(); }}
            className="tap-btn flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1"
            style={{ color: "var(--text-muted)", background: "var(--bg-card-hover)" }}
          >
            {expanded ? "Less" : `+${rest.length} more`}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      <div className="stagger-children">
        {preview.map((insight, i) => (
          <InsightRow key={insight.id} insight={insight} index={i} />
        ))}
        {expanded && rest.map((insight, i) => (
          <InsightRow key={insight.id} insight={insight} index={i + 2} />
        ))}
      </div>

      <p className="text-[10px] mt-2" style={{ color: "var(--text-faint)" }}>
        Based on your last 60 days · Updates daily
      </p>
    </section>
  );
}
