"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BottomSheet, Toast, SubPageHeader, type ToastState } from "@/app/app/_components/ui";

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

const BUILTINS: Array<{ id: BuiltinQuestId; title: string; desc: string }> = [
  { id: "q-rowing", title: "Rowing meters (WTD)", desc: "Track weekly meters rowed" },
  { id: "q-walk", title: "Walking steps (WTD)", desc: "Track weekly steps" },
  { id: "q-run", title: "Running miles (WTD)", desc: "Track weekly miles" },
  { id: "q-recovery", title: "Recovery sessions (WTD)", desc: "Sauna + cold sessions" },
  { id: "q-green", title: "Green days (WTD)", desc: "CORE green days this week" },
];

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

function saveCfg(cfg: QuestConfig) {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event("routines365:questsChanged"));
}

export default function QuestSettingsPage() {
  const [cfg, setCfg] = useState<QuestConfig | null>(null);
  const [toast, setToast] = useState<ToastState>("idle");
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newKeywords, setNewKeywords] = useState("");

  useEffect(() => { setCfg(loadCfg()); }, []);

  const selectedSet = useMemo(() => new Set(cfg?.selected ?? []), [cfg]);

  const update = (next: QuestConfig) => {
    setCfg(next);
    saveCfg(next);
    setToast("saved");
    setTimeout(() => setToast("idle"), 800);
  };

  const toggleBuiltin = (id: BuiltinQuestId) => {
    if (!cfg) return;
    const selected = selectedSet.has(id) ? cfg.selected.filter((x) => x !== id) : [...cfg.selected, id];
    update({ ...cfg, selected });
  };

  const addCustom = () => {
    if (!cfg || !newTitle.trim() || !newKeywords.trim()) return;
    const keywords = newKeywords.split(",").map((s) => s.trim()).filter(Boolean);
    if (keywords.length === 0) return;
    const custom = [...cfg.custom, { id: `c-${Date.now()}`, emoji: newEmoji.trim() || "⭐", title: newTitle.trim(), keywords }];
    update({ ...cfg, custom });
    setNewTitle(""); setNewEmoji(""); setNewKeywords("");
    setAddOpen(false);
  };

  const delCustom = (id: string) => {
    if (!cfg) return;
    update({ ...cfg, custom: cfg.custom.filter((c) => c.id !== id) });
  };

  if (!cfg) return null;

  return (
    <div className="space-y-5">
      <Toast state={toast} />

      <SubPageHeader title="Quests" subtitle="Choose what shows on Today" backHref="/app/settings" />

      {/* Master toggle + max shown */}
      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Enable quests</p>
          <button type="button" className="rounded-full px-3 py-2 text-xs font-semibold"
            style={{
              background: cfg.enabled ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
              color: cfg.enabled ? "var(--accent-green-text)" : "var(--text-muted)",
            }}
            onClick={() => update({ ...cfg, enabled: !cfg.enabled })}>
            {cfg.enabled ? "ON" : "OFF"}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Show on Today</p>
          <select className="rounded-xl px-3 py-2 text-sm"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
            value={cfg.maxShown}
            onChange={(e) => update({ ...cfg, maxShown: Number(e.target.value) as 0 | 1 | 2 | 3 })}>
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </section>

      {/* Built-in quests */}
      <section className="card p-4 space-y-3">
        <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Built-in quests</p>
        <div className="space-y-2">
          {BUILTINS.map((q) => {
            const on = selectedSet.has(q.id);
            return (
              <button key={q.id} type="button" onClick={() => toggleBuiltin(q.id)}
                className="card-interactive px-3 py-3 flex w-full items-center justify-between text-left">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{q.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>{q.desc}</p>
                </div>
                <span className="rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{
                    background: on ? "var(--accent-green-soft)" : "var(--bg-card-hover)",
                    color: on ? "var(--accent-green-text)" : "var(--text-faint)",
                  }}>
                  {on ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Custom quests */}
      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Custom streak quests</p>
          <button type="button" className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add
          </button>
        </div>

        {cfg.custom.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            None yet. Add one like "💪 Pullups" with keyword "pullup".
          </p>
        ) : (
          <div className="space-y-2">
            {cfg.custom.map((c) => (
              <div key={c.id} className="card-interactive px-3 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    <span className="mr-1.5">{c.emoji}</span>{c.title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>Keywords: {c.keywords.join(", ")}</p>
                </div>
                <button type="button" onClick={() => delCustom(c.id)}
                  className="p-2 rounded-lg" style={{ color: "var(--text-faint)" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
        Custom quests count streaks by consecutive days where at least one routine label matches a keyword.
      </p>

      {/* Add custom quest bottom sheet (replaces prompt()) */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="New custom quest">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Quest name *</label>
            <input className="mt-1 w-full rounded-xl px-3 py-3 text-sm"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
              value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Pullups" />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Emoji</label>
            <input className="mt-1 w-full rounded-xl px-3 py-3 text-sm"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
              value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="💪" />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Keywords (comma-separated) *</label>
            <input className="mt-1 w-full rounded-xl px-3 py-3 text-sm"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
              value={newKeywords} onChange={(e) => setNewKeywords(e.target.value)} placeholder="pullup, pull-ups" />
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              Matched against your routine labels (case-insensitive).
            </p>
          </div>
          <button type="button" className="btn-primary w-full text-sm" onClick={addCustom}
            disabled={!newTitle.trim() || !newKeywords.trim()}>
            Add quest
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
