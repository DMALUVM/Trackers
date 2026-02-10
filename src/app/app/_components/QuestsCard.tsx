"use client";

import { useEffect, useMemo, useState } from "react";
import { useMultiActivityTotals, type MultiTotalsEntry } from "@/lib/hooks/useActivityTotals";
import type { ActivityKey, ActivityUnit } from "@/lib/activity";
import { weeklyModuleSessions } from "@/lib/sessionLog";

/* ── Quest config (matches settings/quests/page.tsx) ── */

type BuiltinQuestId = "q-rowing" | "q-walk" | "q-run" | "q-recovery" | "q-green"
  | "q-breathwork" | "q-movement" | "q-focus" | "q-journal";

type CustomQuest = {
  id: string;
  emoji: string;
  title: string;
  keywords: string[];
};

type QuestConfig = {
  enabled: boolean;
  maxShown: 0 | 1 | 2 | 3;
  selected: BuiltinQuestId[];
  custom: CustomQuest[];
};

const KEY = "routines365:quests:v1";

function loadCfg(): QuestConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error("no");
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      maxShown: (parsed.maxShown ?? 3) as 0 | 1 | 2 | 3,
      selected: Array.isArray(parsed.selected) ? parsed.selected : ["q-rowing", "q-walk", "q-green"],
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
    };
  } catch {
    return { enabled: true, maxShown: 3, selected: ["q-rowing", "q-walk", "q-green"], custom: [] };
  }
}

/* ── Builtin quest metadata ── */

const BUILTIN_META: Record<
  BuiltinQuestId,
  { emoji: string; label: string; unit: string; activityKey?: ActivityKey; activityUnit?: ActivityUnit; metricKey?: string; sessionModule?: "breathwork" | "movement" | "focus"; journalQuest?: boolean }
> = {
  "q-rowing": { emoji: "🚣", label: "Rowing", unit: "m", activityKey: "rowing", activityUnit: "meters", metricKey: "rowing" },
  "q-walk": { emoji: "🚶", label: "Walking", unit: "steps", activityKey: "walking", activityUnit: "steps", metricKey: "walking" },
  "q-run": { emoji: "🏃", label: "Running", unit: "mi", activityKey: "running", activityUnit: "miles", metricKey: "running" },
  "q-recovery": { emoji: "🔥", label: "Recovery", unit: "sessions", activityKey: "sauna", activityUnit: "sessions", metricKey: "sauna" },
  "q-green": { emoji: "🟢", label: "Green days", unit: "days" },
  "q-breathwork": { emoji: "🌬️", label: "Breathwork", unit: "sessions", sessionModule: "breathwork" },
  "q-movement": { emoji: "🧘", label: "Movement", unit: "sessions", sessionModule: "movement" },
  "q-focus": { emoji: "🎯", label: "Focus", unit: "sessions", sessionModule: "focus" },
  "q-journal": { emoji: "📓", label: "Journal", unit: "days", journalQuest: true },
};

/* ── Component ── */

interface QuestsCardProps {
  greenDaysThisWeek: number;
  checkedLabels?: string[];
  /** Called when user taps a loggable quest — pass the metric activity key */
  onLogActivity?: (metricKey: string) => void;
}

export function QuestsCard({ greenDaysThisWeek, checkedLabels = [], onLogActivity }: QuestsCardProps) {
  const [cfg, setCfg] = useState<QuestConfig | null>(null);

  useEffect(() => {
    setCfg(loadCfg());
    const onChanged = () => setCfg(loadCfg());
    window.addEventListener("routines365:questsChanged", onChanged);
    return () => window.removeEventListener("routines365:questsChanged", onChanged);
  }, []);

  // Build activity entries for builtin quests
  const actEntries: MultiTotalsEntry[] = useMemo(() => {
    if (!cfg) return [];
    const entries: MultiTotalsEntry[] = [];
    const seen = new Set<string>();
    for (const id of cfg.selected) {
      const meta = BUILTIN_META[id];
      if (!meta?.activityKey || !meta.activityUnit) continue;
      const key = `${meta.activityKey}:${meta.activityUnit}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ activityKey: meta.activityKey, unit: meta.activityUnit, label: meta.label });
    }
    return entries;
  }, [cfg]);

  const { data: actTotals } = useMultiActivityTotals(actEntries);

  if (!cfg || !cfg.enabled || cfg.maxShown === 0) return null;
  if (cfg.selected.length === 0 && cfg.custom.length === 0) return null;

  // Build quest rows
  type QuestRow = { id: string; emoji: string; label: string; value: string; metricKey?: string };
  const rows: QuestRow[] = [];

  // Builtins
  for (const id of cfg.selected) {
    if (rows.length >= cfg.maxShown) break;
    const meta = BUILTIN_META[id];
    if (!meta) continue;

    if (id === "q-green") {
      rows.push({ id, emoji: meta.emoji, label: "Green days", value: `${greenDaysThisWeek} this week` });
      continue;
    }

    // Session-based quests (breathwork, movement, focus)
    if (meta.sessionModule) {
      const count = weeklyModuleSessions(meta.sessionModule);
      rows.push({ id, emoji: meta.emoji, label: meta.label, value: `${count} ${meta.unit} this week` });
      continue;
    }

    // Journal quest — check if today's labels include "journal"
    if (meta.journalQuest) {
      const journalDone = checkedLabels.some((lbl) => lbl.toLowerCase().includes("journal"));
      rows.push({
        id, emoji: meta.emoji, label: meta.label,
        value: journalDone ? "✓ Done today" : "Not yet today",
      });
      continue;
    }

    // Activity-based quests (rowing, walking, running, recovery)
    if (meta.activityKey && meta.activityUnit) {
      const key = `${meta.activityKey}:${meta.activityUnit}`;
      const totals = actTotals[key];
      const wtd = totals?.wtd ?? 0;
      const formatted = meta.activityUnit === "miles"
        ? wtd.toFixed(1)
        : wtd >= 10000 ? `${(wtd / 1000).toFixed(1)}k` : Math.round(wtd).toLocaleString();
      rows.push({
        id, emoji: meta.emoji, label: meta.label,
        value: `${formatted} ${meta.unit} this week`,
        metricKey: meta.metricKey,
      });
    }
  }

  // Custom quests
  for (const cq of cfg.custom) {
    if (rows.length >= cfg.maxShown) break;
    const matched = checkedLabels.some((lbl) =>
      cq.keywords.some((kw) => lbl.toLowerCase().includes(kw.toLowerCase()))
    );
    rows.push({
      id: cq.id,
      emoji: cq.emoji,
      label: cq.title,
      value: matched ? "✓ Done today" : "Not yet today",
    });
  }

  if (rows.length === 0) return null;

  return (
    <section className="space-y-2">
      <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
        Quests
      </p>
      <div className="grid gap-2" style={{ gridTemplateColumns: rows.length === 1 ? "1fr" : "1fr 1fr" }}>
        {rows.map((r) => {
          const tappable = !!r.metricKey && !!onLogActivity;
          return (
            <button
              key={r.id}
              type="button"
              className="rounded-2xl px-3 py-3.5 flex flex-col items-center justify-center text-center transition-transform active:scale-[0.97]"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-primary)",
                cursor: tappable ? "pointer" : "default",
                minHeight: 80,
              }}
              onClick={tappable ? () => onLogActivity!(r.metricKey!) : undefined}
            >
              <span className="text-2xl leading-none">{r.emoji}</span>
              <p className="text-sm font-bold mt-1.5 truncate w-full" style={{ color: "var(--text-primary)" }}>
                {r.label}
              </p>
              <p className="text-xs font-semibold tabular-nums mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {r.value}
              </p>
              {tappable && (
                <p className="text-[10px] mt-1" style={{ color: "var(--accent-green-text)" }}>
                  Tap to log
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
