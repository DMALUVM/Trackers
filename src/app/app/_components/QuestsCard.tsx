"use client";

import { useEffect, useMemo, useState } from "react";
import { useMultiActivityTotals, type MultiTotalsEntry } from "@/lib/hooks/useActivityTotals";
import type { ActivityKey, ActivityUnit } from "@/lib/activity";

/* ── Quest config (matches settings/quests/page.tsx) ── */

type BuiltinQuestId = "q-rowing" | "q-walk" | "q-run" | "q-recovery" | "q-green";

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
  { emoji: string; label: string; unit: string; activityKey?: ActivityKey; activityUnit?: ActivityUnit }
> = {
  "q-rowing": { emoji: "🚣", label: "Rowing", unit: "m", activityKey: "rowing", activityUnit: "meters" },
  "q-walk": { emoji: "🚶", label: "Walking", unit: "steps", activityKey: "walking", activityUnit: "steps" },
  "q-run": { emoji: "🏃", label: "Running", unit: "mi", activityKey: "running", activityUnit: "miles" },
  "q-recovery": { emoji: "🔥", label: "Recovery", unit: "sessions", activityKey: "sauna", activityUnit: "sessions" },
  "q-green": { emoji: "🟢", label: "Green days", unit: "days" },
};

/* ── Component ── */

interface QuestsCardProps {
  greenDaysThisWeek: number;
  /** Labels of items the user checked today — used for custom quest streak display */
  checkedLabels?: string[];
}

export function QuestsCard({ greenDaysThisWeek, checkedLabels = [] }: QuestsCardProps) {
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
  type QuestRow = { id: string; emoji: string; label: string; value: string };
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

    if (meta.activityKey && meta.activityUnit) {
      const key = `${meta.activityKey}:${meta.activityUnit}`;
      const totals = actTotals[key];
      const wtd = totals?.wtd ?? 0;
      const formatted = meta.activityUnit === "miles"
        ? wtd.toFixed(1)
        : wtd >= 10000 ? `${(wtd / 1000).toFixed(1)}k` : Math.round(wtd).toLocaleString();
      rows.push({ id, emoji: meta.emoji, label: meta.label, value: `${formatted} ${meta.unit} this week` });
    }
  }

  // Custom quests (keyword-matched streak display)
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
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl px-3 py-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{r.emoji}</span>
              <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{r.label}</p>
            </div>
            <p className="mt-1 text-xs font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>
              {r.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
