"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronLeft, Play, Pause, RotateCcw, Lock, Crown, Volume2, VolumeX, Wind, Flame, Moon, Zap, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePremium } from "@/lib/premium";
import { hapticLight, hapticMedium, hapticHeavy, hapticSelection } from "@/lib/haptics";
import { logSession } from "@/lib/sessionLog";

// ═══════════════════════════════════════════════
// Om Drone Audio Engine
// ═══════════════════════════════════════════════

function writeStr(v: DataView, o: number, s: string) {
  for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
}

function samplesToWav(samples: Float64Array, sr: number): string {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  writeStr(v, 0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  writeStr(v, 8, "WAVE");
  writeStr(v, 12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  writeStr(v, 36, "data");
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, samples[i] * 32767)), true);
  }
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

function makeOmDrone(
  fundamental: number, duration: number, volume: number,
  harmonics: Array<{ ratio: number; amp: number }>,
): string {
  const sr = 44100;
  const n = Math.floor(sr * duration);
  const raw = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const fadeIn = Math.min(t / 0.3, 1);
    const fadeOutStart = duration * 0.75;
    const fadeOut = t > fadeOutStart ? Math.max(0, 1 - ((t - fadeOutStart) / (duration - fadeOutStart))) : 1;
    const env = fadeIn * (fadeOut * fadeOut);
    let val = 0;
    for (const h of harmonics) val += Math.sin(2 * Math.PI * fundamental * h.ratio * t) * h.amp;
    raw[i] = val * env;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(raw[i]));
  if (peak > 0) { const norm = volume / peak; for (let i = 0; i < n; i++) raw[i] *= norm; }
  return samplesToWav(raw, sr);
}

function makeCompletionUrl(): string {
  const sr = 44100; const dur = 5.0; const n = Math.floor(sr * dur);
  const raw = new Float64Array(n);
  const voices = [
    { fund: 130, delay: 0, vol: 0.30 },
    { fund: 164, delay: 0.8, vol: 0.25 },
    { fund: 196, delay: 1.6, vol: 0.22 },
  ];
  const harmonics = [{ ratio: 1.0, amp: 1.0 }, { ratio: 2.0, amp: 0.4 }, { ratio: 3.0, amp: 0.15 }, { ratio: 0.5, amp: 0.25 }];
  for (let i = 0; i < n; i++) {
    const t = i / sr; let val = 0;
    for (const voice of voices) {
      if (t < voice.delay) continue;
      const vt = t - voice.delay; const remaining = dur - voice.delay;
      const fadeIn = Math.min(vt / 0.4, 1);
      const fadeOutStart = remaining * 0.7;
      const fadeOut = vt > fadeOutStart ? Math.max(0, 1 - ((vt - fadeOutStart) / (remaining - fadeOutStart))) : 1;
      const env = fadeIn * (fadeOut * fadeOut);
      for (const h of harmonics) val += Math.sin(2 * Math.PI * voice.fund * h.ratio * vt) * h.amp * env * voice.vol;
    }
    raw[i] = val;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(raw[i]));
  if (peak > 0) { const norm = 0.45 / peak; for (let i = 0; i < n; i++) raw[i] *= norm; }
  return samplesToWav(raw, sr);
}

const INHALE_HARMONICS = [
  { ratio: 1.0, amp: 1.0 }, { ratio: 2.0, amp: 0.45 }, { ratio: 3.0, amp: 0.2 },
  { ratio: 4.0, amp: 0.08 }, { ratio: 0.5, amp: 0.25 },
];
const EXHALE_HARMONICS = [
  { ratio: 1.0, amp: 1.0 }, { ratio: 2.0, amp: 0.35 }, { ratio: 3.0, amp: 0.12 },
  { ratio: 0.5, amp: 0.4 }, { ratio: 1.5, amp: 0.15 },
];
const HOLD_HARMONICS = [
  { ratio: 1.0, amp: 1.0 }, { ratio: 2.0, amp: 0.3 }, { ratio: 3.0, amp: 0.1 },
  { ratio: 0.5, amp: 0.2 },
];

class BreathAudio {
  private cache = new Map<string, { phases: Map<number, string>; complete: string }>();
  private completionUrl: string | null = null;

  prepareTechnique(technique: { id: string; phases: Array<{ seconds: number; type: string }> }) {
    if (this.cache.has(technique.id)) return;
    const phases = new Map<number, string>();
    for (let i = 0; i < technique.phases.length; i++) {
      const p = technique.phases[i];
      if (p.type === "inhale") phases.set(i, makeOmDrone(130, p.seconds, 0.35, INHALE_HARMONICS));
      else if (p.type === "exhale") phases.set(i, makeOmDrone(98, p.seconds, 0.30, EXHALE_HARMONICS));
      else phases.set(i, makeOmDrone(110, p.seconds, 0.20, HOLD_HARMONICS));
    }
    if (!this.completionUrl) this.completionUrl = makeCompletionUrl();
    this.cache.set(technique.id, { phases, complete: this.completionUrl });
  }

  playPhase(techniqueId: string, phaseIdx: number) {
    const url = this.cache.get(techniqueId)?.phases.get(phaseIdx);
    if (!url) return;
    try { const a = new Audio(url); a.volume = 1.0; a.play().catch(() => {}); } catch {}
  }

  playComplete(techniqueId: string) {
    const url = this.cache.get(techniqueId)?.complete;
    if (!url) return;
    try { const a = new Audio(url); a.volume = 1.0; a.play().catch(() => {}); } catch {}
  }
}

const breathAudio = new BreathAudio();

// ═══════════════════════════════════════════════
// Intent Categories
// ═══════════════════════════════════════════════

type Intent = "all" | "calm" | "sleep" | "focus" | "energy";

const INTENT_META: { key: Intent; label: string; icon: typeof Wind; color: string }[] = [
  { key: "all",    label: "All",    icon: Wind,  color: "var(--text-muted)" },
  { key: "calm",   label: "Calm",   icon: Wind,  color: "#06b6d4" },
  { key: "sleep",  label: "Sleep",  icon: Moon,  color: "#8b5cf6" },
  { key: "focus",  label: "Focus",  icon: Zap,   color: "#3b82f6" },
  { key: "energy", label: "Energy", icon: Flame, color: "#f59e0b" },
];

// ═══════════════════════════════════════════════
// Technique Definitions
// ═══════════════════════════════════════════════

interface BreathPhase {
  label: string;
  seconds: number;
  color: string;
  type: "inhale" | "exhale" | "hold";
  /** Breathing route guidance shown under the countdown */
  route?: string;
}

interface BreathTechnique {
  id: string;
  name: string;
  description: string;
  emoji: string;
  phases: BreathPhase[];
  defaultRounds: number;
  minRounds: number;
  maxRounds: number;
  premium: boolean;
  benefits: string;
  intents: Intent[];
  /** Ambient background colors for session [inhale, hold, exhale] */
  ambientColors: [string, string, string];
  /** Optional post-rounds phase (e.g. Wim Hof retention hold) */
  postPhases?: BreathPhase[];
  postLabel?: string;
}

const TECHNIQUES: BreathTechnique[] = [
  {
    id: "box", name: "Box Breathing",
    description: "Equal inhale, hold, exhale, hold. Used by Navy SEALs for calm focus.",
    emoji: "🟦",
    phases: [
      { label: "Breathe In", seconds: 4, color: "#3b82f6", type: "inhale", route: "Nose" },
      { label: "Hold", seconds: 4, color: "#8b5cf6", type: "hold" },
      { label: "Breathe Out", seconds: 4, color: "#06b6d4", type: "exhale", route: "Mouth" },
      { label: "Hold", seconds: 4, color: "#6366f1", type: "hold" },
    ],
    defaultRounds: 6, minRounds: 3, maxRounds: 12,
    premium: false, benefits: "Reduces stress, sharpens focus, calms the nervous system",
    intents: ["calm", "focus"],
    ambientColors: ["#1e3a5f", "#2d1b69", "#0c4a5e"],
  },
  {
    id: "478", name: "4-7-8 Sleep Breath",
    description: "Dr. Andrew Weil\u2019s natural tranquilizer for the nervous system.",
    emoji: "\uD83C\uDF19",
    phases: [
      { label: "Breathe In", seconds: 4, color: "#6366f1", type: "inhale", route: "Nose" },
      { label: "Hold", seconds: 7, color: "#8b5cf6", type: "hold" },
      { label: "Breathe Out", seconds: 8, color: "#4338ca", type: "exhale", route: "Mouth" },
    ],
    defaultRounds: 4, minRounds: 2, maxRounds: 8,
    premium: true, benefits: "Promotes deep sleep, quiets racing thoughts",
    intents: ["sleep", "calm"],
    ambientColors: ["#1a1a3e", "#2d1b4e", "#161632"],
  },
  {
    id: "coherent", name: "Coherent Breathing",
    description: "5.5 seconds in, 5.5 out. Maximizes heart rate variability — the gold standard.",
    emoji: "\uD83D\uDC9A",
    phases: [
      { label: "Breathe In", seconds: 5.5, color: "#10b981", type: "inhale", route: "Nose" },
      { label: "Breathe Out", seconds: 5.5, color: "#059669", type: "exhale", route: "Nose" },
    ],
    defaultRounds: 10, minRounds: 5, maxRounds: 20,
    premium: false, benefits: "Optimizes HRV, reduces blood pressure, balances the autonomic nervous system",
    intents: ["calm", "focus"],
    ambientColors: ["#0d3b2e", "#0a2f24", "#072920"],
  },
  {
    id: "sigh", name: "Physiological Sigh",
    description: "Double inhale through nose, long exhale. Fastest science-backed way to calm down.",
    emoji: "\uD83D\uDE2E\u200D\uD83D\uDCA8",
    phases: [
      { label: "Breathe In", seconds: 2, color: "#3b82f6", type: "inhale", route: "Nose" },
      { label: "Sip In", seconds: 1, color: "#6366f1", type: "inhale", route: "Nose" },
      { label: "Long Exhale", seconds: 6, color: "#06b6d4", type: "exhale", route: "Mouth" },
    ],
    defaultRounds: 5, minRounds: 3, maxRounds: 10,
    premium: true, benefits: "Instant calm, reduces CO\u2082, resets panic response",
    intents: ["calm"],
    ambientColors: ["#1e3a5f", "#1e2a6f", "#0c3a5e"],
  },
  {
    id: "21relax", name: "2-1 Relaxation",
    description: "Exhale twice as long as inhale. Clinically proven to activate the vagus nerve.",
    emoji: "\uD83E\uDEB7",
    phases: [
      { label: "Breathe In", seconds: 4, color: "#6366f1", type: "inhale", route: "Nose" },
      { label: "Breathe Out", seconds: 8, color: "#4338ca", type: "exhale", route: "Mouth" },
    ],
    defaultRounds: 8, minRounds: 4, maxRounds: 15,
    premium: false, benefits: "Deep relaxation, lowers heart rate, excellent for wind-down",
    intents: ["sleep", "calm"],
    ambientColors: ["#1a1a4e", "#1e1645", "#141235"],
  },
  {
    id: "wimhof", name: "Wim Hof Power Breath",
    description: "30 rapid breaths, then a deep retention hold. The original cold exposure method.",
    emoji: "\u2744\uFE0F",
    phases: [
      { label: "In", seconds: 1.5, color: "#ef4444", type: "inhale", route: "Mouth" },
      { label: "Out", seconds: 1.5, color: "#f97316", type: "exhale", route: "Mouth" },
    ],
    defaultRounds: 30, minRounds: 20, maxRounds: 40,
    premium: true, benefits: "Boosts energy, alkalizes blood, strengthens immune response",
    intents: ["energy"],
    ambientColors: ["#4a1010", "#5c2600", "#3a0a0a"],
    postPhases: [
      { label: "Let Go", seconds: 3, color: "#06b6d4", type: "exhale", route: "Mouth" },
      { label: "Retention Hold", seconds: 60, color: "#8b5cf6", type: "hold" },
      { label: "Recovery Breath", seconds: 15, color: "#3b82f6", type: "inhale", route: "Nose" },
    ],
    postLabel: "Retention",
  },
  {
    id: "energize", name: "Energizing Breath",
    description: "Quick rhythmic breathing to wake up body and mind. Like a double espresso for your lungs.",
    emoji: "\u26A1",
    phases: [
      { label: "Sharp In", seconds: 1, color: "#f59e0b", type: "inhale", route: "Nose" },
      { label: "Sharp Out", seconds: 1, color: "#ef4444", type: "exhale", route: "Mouth" },
    ],
    defaultRounds: 20, minRounds: 10, maxRounds: 30,
    premium: true, benefits: "Increases alertness, boosts adrenaline, sharpens reactions",
    intents: ["energy", "focus"],
    ambientColors: ["#4a3500", "#4a1010", "#3a2500"],
  },
  {
    id: "nostril", name: "Alternate Nostril",
    description: "Ancient pranayama technique. Alternates airflow to balance both brain hemispheres.",
    emoji: "\uD83E\uDDD8",
    phases: [
      { label: "Left In", seconds: 4, color: "#8b5cf6", type: "inhale", route: "Left nostril" },
      { label: "Hold", seconds: 2, color: "#6366f1", type: "hold" },
      { label: "Right Out", seconds: 4, color: "#06b6d4", type: "exhale", route: "Right nostril" },
      { label: "Right In", seconds: 4, color: "#3b82f6", type: "inhale", route: "Right nostril" },
      { label: "Hold", seconds: 2, color: "#6366f1", type: "hold" },
      { label: "Left Out", seconds: 4, color: "#a78bfa", type: "exhale", route: "Left nostril" },
    ],
    defaultRounds: 5, minRounds: 3, maxRounds: 10,
    premium: true, benefits: "Balances nervous system, improves focus, reduces anxiety",
    intents: ["calm", "focus"],
    ambientColors: ["#2d1b69", "#1e2a6f", "#1a1a4e"],
  },
];

// ═══════════════════════════════════════════════
// Streak Helper
// ═══════════════════════════════════════════════

function getBreathworkStreak(): number {
  try {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dk = d.toISOString().slice(0, 10);
      const raw = localStorage.getItem(`routines365:sessions:${dk}`);
      if (!raw) { if (i === 0) continue; break; } // today not done yet is ok
      const sessions = JSON.parse(raw);
      if (sessions.some((s: { module: string }) => s.module === "breathwork")) {
        streak++;
      } else {
        if (i === 0) continue; // today not done yet
        break;
      }
    }
    return streak;
  } catch { return 0; }
}

function getTotalBreathworkSessions(): number {
  try {
    let total = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dk = d.toISOString().slice(0, 10);
      const raw = localStorage.getItem(`routines365:sessions:${dk}`);
      if (!raw) continue;
      const sessions = JSON.parse(raw);
      total += sessions.filter((s: { module: string }) => s.module === "breathwork").length;
    }
    return total;
  } catch { return 0; }
}

// ═══════════════════════════════════════════════
// Breathing Circle (Enhanced)
// ═══════════════════════════════════════════════

function BreathingCircle({ progress, label, color, secondsLeft, isActive, route, breathCount }: {
  progress: number; label: string; color: string; secondsLeft: number; isActive: boolean;
  route?: string; breathCount: number;
}) {
  const isInhale = label.toLowerCase().includes("in") || label.toLowerCase().includes("sip");
  const isExhale = label.toLowerCase().includes("out") || label.toLowerCase().includes("exhale") || label.toLowerCase().includes("let go");
  const minScale = 0.45;
  const maxScale = 1;
  const scale = isInhale ? minScale + (maxScale - minScale) * progress
    : isExhale ? maxScale - (maxScale - minScale) * progress
    : maxScale; // hold: stay expanded

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Outer pulse ring */}
      <div className="absolute rounded-full" style={{
        width: 280, height: 280,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        transform: `scale(${scale * 1.05})`,
        transition: "transform 0.15s linear",
      }} />
      {/* Secondary glow ring */}
      <div className="absolute rounded-full" style={{
        width: 250, height: 250,
        border: `1.5px solid ${color}20`,
        transform: `scale(${scale})`,
        transition: "transform 0.15s linear",
      }} />
      {/* Main circle */}
      <div className="absolute rounded-full flex items-center justify-center" style={{
        width: 220, height: 220,
        background: `radial-gradient(circle at 35% 35%, ${color}30, ${color}08)`,
        border: `2.5px solid ${color}45`,
        transform: `scale(${scale})`,
        transition: "transform 0.15s linear",
        boxShadow: isActive ? `0 0 60px ${color}20, inset 0 0 40px ${color}06` : "none",
      }}>
        <div className="text-center">
          {/* Breathing route guidance */}
          {route && (
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: `${color}90` }}>
              {route}
            </p>
          )}
          <p className="text-xl font-black tracking-tight" style={{ color }}>{label}</p>
          <p className="text-5xl font-bold mt-1 tabular-nums" style={{ color: "var(--text-primary)" }}>
            {Math.ceil(secondsLeft)}
          </p>
        </div>
      </div>
      {/* Breath counter - bottom */}
      {breathCount > 0 && (
        <div className="absolute bottom-2 flex items-center gap-1.5"
          style={{ color: "var(--text-faint)" }}>
          <Wind size={11} />
          <span className="text-[10px] font-bold tabular-nums">{breathCount} breaths</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Get Ready Countdown (3-2-1)
// ═══════════════════════════════════════════════

function GetReadyCountdown({ onDone, technique }: { onDone: () => void; technique: BreathTechnique }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) { onDone(); return; }
    const t = setTimeout(() => {
      hapticLight();
      setCount((c) => c - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [count, onDone]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <p className="text-sm font-bold mb-4" style={{ color: "var(--text-faint)" }}>{technique.name}</p>
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <div className="absolute rounded-full" style={{
          width: 200, height: 200,
          background: `radial-gradient(circle, ${technique.phases[0].color}20, transparent 70%)`,
          animation: "pulse 1s ease-in-out infinite",
        }} />
        <div className="text-8xl font-black tabular-nums" style={{
          color: count > 0 ? "var(--text-primary)" : "var(--accent-green)",
          animation: "breathScale 1s ease-in-out",
        }}>
          {count > 0 ? count : "Go"}
        </div>
      </div>
      <p className="mt-6 text-base" style={{ color: "var(--text-muted)" }}>
        {count > 0 ? "Find your breath\u2026" : "Begin"}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Elapsed time formatter
// ═══════════════════════════════════════════════

function fmtElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════
// Completion Messages
// ═══════════════════════════════════════════════

const COMPLETION_MESSAGES = [
  "Your nervous system thanks you.",
  "Calmer mind, stronger you.",
  "That\u2019s what control feels like.",
  "Breath by breath, you\u2019re building resilience.",
  "Stillness is a superpower.",
  "Your body remembers this peace.",
  "The rhythm stays with you.",
  "One breath at a time.",
];

function getCompletionMessage(): string {
  return COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
}

// ═══════════════════════════════════════════════
// Round Selector (Pre-session)
// ═══════════════════════════════════════════════

function RoundSelector({ technique, rounds, onChange, onStart, onClose, soundOn, onToggleSound }: {
  technique: BreathTechnique; rounds: number; onChange: (r: number) => void;
  onStart: () => void; onClose: () => void; soundOn: boolean; onToggleSound: () => void;
}) {
  const cycleTime = technique.phases.reduce((s, p) => s + p.seconds, 0);
  const postTime = technique.postPhases?.reduce((s, p) => s + p.seconds, 0) ?? 0;
  const totalSeconds = cycleTime * rounds + postTime;
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  const timeLabel = minutes > 0 ? `${minutes}m ${secs > 0 ? `${secs}s` : ""}` : `${secs}s`;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onClose} className="tap-btn rounded-full flex items-center justify-center"
          style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </button>
        <button type="button" onClick={onToggleSound} className="tap-btn rounded-full flex items-center justify-center"
          style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          {soundOn ? <Volume2 size={18} style={{ color: "var(--text-muted)" }} /> : <VolumeX size={18} style={{ color: "var(--text-faint)" }} />}
        </button>
      </div>

      <div className="flex flex-col items-center pt-6">
        <span className="text-4xl mb-3">{technique.emoji}</span>
        <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{technique.name}</h2>
        <p className="text-sm mt-2 text-center leading-relaxed max-w-[280px]" style={{ color: "var(--text-muted)" }}>
          {technique.description}
        </p>
      </div>

      {/* Phase preview */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-faint)" }}>Breathing Pattern</p>
        <div className="flex items-center gap-2 flex-wrap">
          {technique.phases.map((p, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>&rarr;</span>}
              <div className="rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
                style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                <div className="rounded-full" style={{ width: 6, height: 6, background: p.color }} />
                <span className="text-xs font-bold" style={{ color: p.color }}>{p.label}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>{p.seconds}s</span>
              </div>
            </div>
          ))}
        </div>
        {technique.postPhases && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#a78bfa" }}>
              + {technique.postLabel ?? "Retention"} Phase
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {technique.postPhases.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>&rarr;</span>}
                  <span className="text-xs font-bold" style={{ color: p.color }}>{p.label} ({p.seconds}s)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Round adjustment */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-faint)" }}>Session Length</p>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => { hapticLight(); onChange(Math.max(technique.minRounds, rounds - 1)); }}
            disabled={rounds <= technique.minRounds}
            className="rounded-full p-2.5 transition-all active:scale-90"
            style={{ background: "var(--bg-card-hover)", opacity: rounds <= technique.minRounds ? 0.35 : 1 }}>
            <Minus size={18} style={{ color: "var(--text-muted)" }} />
          </button>
          <div className="text-center">
            <p className="text-3xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>{rounds}</p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-faint)" }}>
              {technique.id === "wimhof" ? "breaths" : "rounds"}
            </p>
          </div>
          <button type="button" onClick={() => { hapticLight(); onChange(Math.min(technique.maxRounds, rounds + 1)); }}
            disabled={rounds >= technique.maxRounds}
            className="rounded-full p-2.5 transition-all active:scale-90"
            style={{ background: "var(--bg-card-hover)", opacity: rounds >= technique.maxRounds ? 0.35 : 1 }}>
            <Plus size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
        <p className="text-center text-sm font-bold mt-2 tabular-nums" style={{ color: "var(--accent-green-text)" }}>
          ~{timeLabel}
        </p>
      </div>

      {/* Benefits */}
      <div className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>Benefits:</span> {technique.benefits}
        </p>
      </div>

      {/* Start button */}
      <button type="button" onClick={() => { hapticMedium(); onStart(); }}
        className="w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        style={{
          background: "var(--accent-green)",
          color: "var(--text-inverse)",
          boxShadow: "0 4px 30px rgba(16,185,129,0.3)",
        }}>
        <Play size={22} /> Begin Session
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Breath Session (Enhanced)
// ═══════════════════════════════════════════════

function BreathSession({ technique, onClose, rounds: initialRounds }: {
  technique: BreathTechnique; onClose: () => void; rounds: number;
}) {
  const [phase, setPhase] = useState<"countdown" | "breathing" | "post" | "done">("countdown");
  const [soundOn, setSoundOn] = useState(true);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [timeInPhase, setTimeInPhase] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [postPhaseIdx, setPostPhaseIdx] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [breathCount, setBreathCount] = useState(0);
  const [completionMsg] = useState(getCompletionMessage);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPhaseRef = useRef<string>("");
  const startTimeRef = useRef<number>(0);
  const holdTickRef = useRef<number>(-1);
  const rounds = initialRounds;

  const isPost = phase === "post";
  const activePhases = isPost ? (technique.postPhases ?? []) : technique.phases;
  const activeIdx = isPost ? postPhaseIdx : currentPhaseIdx;
  const currentPhase = activePhases[activeIdx];
  const totalPhaseTime = currentPhase?.seconds ?? 1;

  // Count breaths (each complete inhale = 1 breath)
  const prevPhaseTypeRef = useRef<string>("");
  useEffect(() => {
    if (!currentPhase) return;
    const wasInhale = prevPhaseTypeRef.current === "inhale";
    if (currentPhase.type !== "inhale" && wasInhale) {
      setBreathCount((c) => c + 1);
    }
    prevPhaseTypeRef.current = currentPhase.type;
  }, [currentPhaseIdx, currentRound, currentPhase]);

  // Ambient background color
  const ambientColor = useMemo(() => {
    if (!currentPhase) return technique.ambientColors[0];
    if (currentPhase.type === "inhale") return technique.ambientColors[0];
    if (currentPhase.type === "hold") return technique.ambientColors[1];
    return technique.ambientColors[2];
  }, [currentPhase, technique.ambientColors]);

  // Play Om drone for each new phase
  useEffect(() => {
    if ((phase !== "breathing" && phase !== "post") || !soundOn) return;
    const key = `${isPost ? "post" : currentRound}-${activeIdx}`;
    if (lastPhaseRef.current === key) return;
    lastPhaseRef.current = key;
    breathAudio.playPhase(technique.id, activeIdx % technique.phases.length);
  }, [activeIdx, currentRound, phase, soundOn, technique.id, technique.phases.length, isPost]);

  // Track elapsed time
  useEffect(() => {
    if (phase !== "breathing" && phase !== "post") return;
    const t = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const tick = useCallback(() => {
    setTimeInPhase((prev) => {
      const next = prev + 0.05;
      setPhaseProgress(Math.min(next / totalPhaseTime, 1));

      // Gentle haptic tick every second during hold phases
      const wholeSec = Math.floor(next);
      if (wholeSec !== holdTickRef.current && currentPhase?.type === "hold") {
        holdTickRef.current = wholeSec;
        hapticSelection();
      }

      if (next >= totalPhaseTime) {
        hapticLight();
        holdTickRef.current = -1;

        if (isPost) {
          const nextPI = postPhaseIdx + 1;
          if (nextPI >= (technique.postPhases?.length ?? 0)) {
            hapticHeavy();
            if (soundOn) breathAudio.playComplete(technique.id);
            setPhase("done");
            return 0;
          }
          setPostPhaseIdx(nextPI);
          return 0;
        }

        const nextPI = currentPhaseIdx + 1;
        if (nextPI >= technique.phases.length) {
          const nextR = currentRound + 1;
          if (nextR >= rounds) {
            if (technique.postPhases && technique.postPhases.length > 0) {
              hapticMedium();
              setPhase("post");
              setPostPhaseIdx(0);
              return 0;
            }
            hapticHeavy();
            if (soundOn) breathAudio.playComplete(technique.id);
            setPhase("done");
            return 0;
          }
          setCurrentRound(nextR);
          setCurrentPhaseIdx(0);
        } else {
          setCurrentPhaseIdx(nextPI);
        }
        return 0;
      }
      return next;
    });
  }, [currentPhaseIdx, currentRound, technique, totalPhaseTime, soundOn, isPost, postPhaseIdx, rounds]);

  useEffect(() => {
    if (isRunning && (phase === "breathing" || phase === "post")) {
      intervalRef.current = setInterval(tick, 50);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, tick, isRunning]);

  const startBreathing = useCallback(() => {
    breathAudio.prepareTechnique(technique);
    if (soundOn) {
      breathAudio.playPhase(technique.id, 0);
      lastPhaseRef.current = "0-0";
    }
    startTimeRef.current = Date.now();
    setPhase("breathing");
  }, [technique, soundOn]);

  const pause = () => { hapticMedium(); setIsRunning(false); };
  const resume = () => { hapticMedium(); setIsRunning(true); };

  // Log session once when reaching "done"
  const loggedRef = useRef(false);
  useEffect(() => {
    if (phase === "done" && !loggedRef.current) {
      loggedRef.current = true;
      const totalBreathTime = technique.phases.reduce((s, p) => s + p.seconds, 0) * rounds
        + (technique.postPhases?.reduce((s, p) => s + p.seconds, 0) ?? 0);
      logSession({ module: "breathwork", name: technique.name, minutes: Math.max(1, Math.round(totalBreathTime / 60)) });
    }
    if (phase === "countdown") loggedRef.current = false;
  }, [phase, technique, rounds]);

  const reset = () => {
    hapticLight();
    setPhase("countdown");
    setCurrentRound(0); setCurrentPhaseIdx(0); setPostPhaseIdx(0);
    setPhaseProgress(0); setTimeInPhase(0); setElapsedSeconds(0);
    setBreathCount(0);
    setIsRunning(true);
    lastPhaseRef.current = "";
    prevPhaseTypeRef.current = "";
  };

  // ── Countdown ──
  if (phase === "countdown") {
    return (
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <button type="button" onClick={onClose} className="tap-btn rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
          </button>
          <span />
          <button type="button" onClick={() => { hapticLight(); setSoundOn((s) => !s); }} className="tap-btn rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            {soundOn ? <Volume2 size={18} style={{ color: "var(--text-muted)" }} /> : <VolumeX size={18} style={{ color: "var(--text-faint)" }} />}
          </button>
        </div>
        <GetReadyCountdown technique={technique} onDone={startBreathing} />
      </div>
    );
  }

  // ── Completion ──
  if (phase === "done") {
    const totalTime = elapsedSeconds;
    const streak = getBreathworkStreak();
    const totalSessions = getTotalBreathworkSessions();

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        {/* Completion glow */}
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full"
            style={{ width: 100, height: 100, background: "radial-gradient(circle, rgba(16,185,129,0.2), transparent 70%)", filter: "blur(20px)" }} />
          <div className="text-6xl relative">🧘</div>
        </div>
        <h2 className="text-3xl font-black mb-2" style={{ color: "var(--text-primary)" }}>Complete</h2>
        <p className="text-sm italic mb-1" style={{ color: "var(--text-muted)" }}>{completionMsg}</p>
        <p className="text-xs mb-6" style={{ color: "var(--text-faint)" }}>{technique.name}</p>

        {/* Session stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-[300px]">
          <div className="rounded-xl py-3 px-2 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <p className="text-xl font-bold tabular-nums" style={{ color: "var(--accent-green-text)" }}>{fmtElapsed(totalTime)}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--text-faint)" }}>Duration</p>
          </div>
          <div className="rounded-xl py-3 px-2 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <p className="text-xl font-bold tabular-nums" style={{ color: "var(--accent-green-text)" }}>{breathCount}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--text-faint)" }}>Breaths</p>
          </div>
          <div className="rounded-xl py-3 px-2 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <p className="text-xl font-bold tabular-nums" style={{ color: "var(--accent-green-text)" }}>{rounds}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--text-faint)" }}>Rounds</p>
          </div>
        </div>

        {/* Streak & total */}
        {(streak > 0 || totalSessions > 1) && (
          <div className="flex gap-3 mb-6">
            {streak > 0 && (
              <div className="rounded-full px-4 py-1.5 flex items-center gap-1.5"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>{streak} day streak</span>
              </div>
            )}
            {totalSessions > 1 && (
              <div className="rounded-full px-4 py-1.5 flex items-center gap-1.5"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <span className="text-xs font-bold" style={{ color: "#818cf8" }}>{totalSessions} sessions total</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={reset} className="px-6 py-3.5 rounded-2xl text-base font-bold transition-all active:scale-[0.97]"
            style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}>Repeat</button>
          <button type="button" onClick={onClose} className="px-6 py-3.5 rounded-2xl text-base font-bold transition-all active:scale-[0.97]"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>Done</button>
        </div>
      </div>
    );
  }

  // ── Active Session ──
  const roundLabel = isPost
    ? technique.postLabel ?? "Retention"
    : `${currentRound + 1} / ${rounds}`;

  const dotCount = isPost ? (technique.postPhases?.length ?? 0) : Math.min(rounds, 30);
  const dotActiveIdx = isPost ? postPhaseIdx : currentRound;
  const dotCompare = isPost ? postPhaseIdx : currentRound;

  return (
    <div className="flex flex-col items-center min-h-[80vh] relative">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${ambientColor}40, transparent 80%)`,
          transition: "background 1.5s ease-in-out",
          zIndex: 0,
        }} />

      {/* Top bar */}
      <div className="w-full flex items-center justify-between mb-2 px-1" style={{ position: "relative", zIndex: 50 }}>
        <button type="button" onClick={onClose} className="tap-btn rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </button>
        <div className="text-center">
          <p className="text-xs font-bold" style={{ color: "var(--text-faint)" }}>{technique.name}</p>
          <p className="text-[10px] tabular-nums font-semibold" style={{ color: "var(--text-faint)" }}>{fmtElapsed(elapsedSeconds)}</p>
        </div>
        <button type="button" onClick={() => { hapticLight(); setSoundOn((s) => !s); }} className="tap-btn rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          {soundOn ? <Volume2 size={18} style={{ color: "var(--text-muted)" }} /> : <VolumeX size={18} style={{ color: "var(--text-faint)" }} />}
        </button>
      </div>

      {/* Post-phase label */}
      {isPost && (
        <div className="rounded-full px-4 py-1.5 mb-2" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", position: "relative", zIndex: 10 }}>
          <p className="text-xs font-bold" style={{ color: "#a78bfa" }}>Retention Phase</p>
        </div>
      )}

      {/* Circle */}
      <div className="flex-1 flex items-center justify-center" style={{ position: "relative", zIndex: 10 }}>
        <BreathingCircle
          secondsLeft={totalPhaseTime - timeInPhase}
          progress={phaseProgress}
          label={currentPhase.label}
          color={currentPhase.color}
          isActive={isRunning}
          route={currentPhase.route}
          breathCount={breathCount}
        />
      </div>

      {/* Round indicator */}
      <p className="text-lg font-bold tabular-nums mb-3" style={{ color: "var(--text-faint)", position: "relative", zIndex: 10 }}>{roundLabel}</p>

      {/* Progress dots */}
      {dotCount <= 30 && (
        <div className="flex gap-1.5 mb-5 flex-wrap justify-center max-w-[260px]" style={{ position: "relative", zIndex: 10 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <div key={i} className="rounded-full transition-all" style={{
              width: dotCount > 15 ? 8 : 10,
              height: dotCount > 15 ? 8 : 10,
              background: i < dotCompare ? "var(--accent-green)" : i === dotActiveIdx ? currentPhase.color : "var(--bg-card-hover)",
              transition: "background 0.3s, transform 0.2s",
              transform: i === dotActiveIdx ? "scale(1.25)" : "scale(1)",
            }} />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-5 pb-8" style={{ position: "relative", zIndex: 10 }}>
        <button type="button" onClick={reset} className="rounded-full p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <RotateCcw size={22} style={{ color: "var(--text-muted)" }} />
        </button>
        <button type="button" onClick={isRunning ? pause : resume}
          className="rounded-full p-6" style={{
            background: isRunning ? "rgba(239,68,68,0.15)" : "var(--accent-green)",
            boxShadow: isRunning ? "none" : "0 4px 30px rgba(16,185,129,0.35)",
          }}>
          {isRunning ? <Pause size={34} style={{ color: "#ef4444" }} /> : <Play size={34} style={{ color: "var(--text-inverse)", marginLeft: 3 }} />}
        </button>
        <div style={{ width: 54 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Technique List (Main Page)
// ═══════════════════════════════════════════════

export default function BreathworkPage() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [activeTechnique, setActiveTechnique] = useState<BreathTechnique | null>(null);
  const [sessionRounds, setSessionRounds] = useState(0);
  const [showSession, setShowSession] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [intent, setIntent] = useState<Intent>("all");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem("routines365:breathwork:introduced")) setShowIntro(true);
      setStreak(getBreathworkStreak());
    } catch {}
  }, []);

  const dismissIntro = () => {
    setShowIntro(false);
    try { localStorage.setItem("routines365:breathwork:introduced", "1"); } catch {}
  };

  const selectTechnique = (t: BreathTechnique) => {
    if (t.premium && !isPremium) { hapticLight(); router.push("/app/settings/premium"); return; }
    hapticMedium();
    setActiveTechnique(t);
    setSessionRounds(t.defaultRounds);
    setShowSession(false);
  };

  const startSession = () => {
    setShowSession(true);
  };

  const closeSession = () => {
    setActiveTechnique(null);
    setShowSession(false);
    // Refresh streak
    try { setStreak(getBreathworkStreak()); } catch {}
  };

  // Active session
  if (activeTechnique && showSession) {
    return <BreathSession technique={activeTechnique} onClose={closeSession} rounds={sessionRounds} />;
  }

  // Round selector / technique detail
  if (activeTechnique) {
    return (
      <div className="max-w-md mx-auto px-1">
        <RoundSelector
          technique={activeTechnique}
          rounds={sessionRounds}
          onChange={setSessionRounds}
          onStart={startSession}
          onClose={() => setActiveTechnique(null)}
          soundOn={true}
          onToggleSound={() => {}}
        />
      </div>
    );
  }

  const filteredTechniques = intent === "all"
    ? TECHNIQUES
    : TECHNIQUES.filter((t) => t.intents.includes(intent));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/today" className="tap-btn rounded-full p-1.5" style={{ background: "var(--bg-card)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Breathwork</h1>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Close your eyes. We&apos;ll guide you with sound.</p>
        </div>
        {streak > 0 && (
          <div className="shrink-0 rounded-full px-3 py-1.5 flex items-center gap-1.5"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <span className="text-xs">🔥</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: "#f59e0b" }}>{streak}</span>
          </div>
        )}
      </div>

      {/* First-visit intro */}
      {showIntro && (
        <div className="rounded-2xl p-5 relative animate-fade-in-up"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.08))", border: "1px solid rgba(99,102,241,0.2)" }}>
          <button type="button" onClick={dismissIntro}
            className="absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-lg"
            style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
            Got it
          </button>
          <p className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>🧘 How it works</p>
          <div className="space-y-1.5 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            <p>🔵 The <strong style={{ color: "var(--text-primary)" }}>circle expands</strong> when you inhale and <strong style={{ color: "var(--text-primary)" }}>contracts</strong> when you exhale. Follow its rhythm.</p>
            <p>🕉️ <strong style={{ color: "var(--text-primary)" }}>Om drones</strong> play for each breath phase — deeper tones for exhales, higher for inhales. Toggle sound with the speaker button.</p>
            <p>📳 Gentle <strong style={{ color: "var(--text-primary)" }}>haptic feedback</strong> ticks during hold phases so you can close your eyes and still feel the rhythm.</p>
          </div>
        </div>
      )}

      {/* Intent filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {INTENT_META.map((im) => {
          const active = intent === im.key;
          const Icon = im.icon;
          return (
            <button key={im.key} type="button"
              onClick={() => { hapticLight(); setIntent(im.key); }}
              className="shrink-0 rounded-full px-3.5 py-2 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
              style={{
                background: active ? `${im.color}18` : "var(--bg-card)",
                color: active ? im.color : "var(--text-faint)",
                border: `1.5px solid ${active ? `${im.color}50` : "var(--border-primary)"}`,
              }}>
              <Icon size={13} />
              {im.label}
            </button>
          );
        })}
      </div>

      {/* Technique cards */}
      <div className="space-y-3">
        {filteredTechniques.map((t) => {
          const locked = t.premium && !isPremium;
          const cycleTime = t.phases.reduce((s, p) => s + p.seconds, 0);
          const totalTime = cycleTime * t.defaultRounds + (t.postPhases?.reduce((s, p) => s + p.seconds, 0) ?? 0);
          const timeLabel = totalTime >= 90 ? `~${Math.round(totalTime / 60)} min` : `~${Math.round(totalTime)}s`;
          return (
            <button key={t.id} type="button"
              onClick={() => selectTechnique(t)}
              className="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.98]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", opacity: locked ? 0.65 : 1 }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl mt-0.5">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                    {locked && <Lock size={13} style={{ color: "var(--text-faint)" }} />}
                    {t.premium && isPremium && <Crown size={13} style={{ color: "#f59e0b" }} />}
                  </div>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{t.description}</p>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>{timeLabel}</span>
                    {/* Phase mini-preview */}
                    <div className="flex items-center gap-0.5">
                      {t.phases.slice(0, 4).map((p, i) => (
                        <div key={i} className="rounded-full" style={{ width: 5, height: 5, background: p.color }} />
                      ))}
                      {t.phases.length > 4 && <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>+{t.phases.length - 4}</span>}
                    </div>
                    {t.postPhases && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>
                        + retention
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {t.intents.filter((i) => i !== "all").map((i) => {
                      const meta = INTENT_META.find((m) => m.key === i);
                      if (!meta) return null;
                      return (
                        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: `${meta.color}12`, color: meta.color }}>
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!isPremium && (
        <Link href="/app/settings/premium" className="block rounded-2xl p-5 text-center"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))", border: "1px solid rgba(99,102,241,0.2)", textDecoration: "none" }}>
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>🔓 Unlock All Techniques</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>5 premium methods with guided Om audio</p>
        </Link>
      )}
    </div>
  );
}
