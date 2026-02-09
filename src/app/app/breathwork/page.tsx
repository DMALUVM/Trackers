"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Play, Pause, RotateCcw, Lock, Crown, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { usePremium } from "@/lib/premium";
import { hapticLight, hapticMedium, hapticHeavy } from "@/lib/haptics";

// ── Om Drone Audio Engine ──
// Generates smooth, sustained Om-like drones using layered harmonics.
// Each tone lasts the full phase duration with a gentle fade-out in the final 25%.
// No vibrato or pulsing — pure smooth sustained sound.
// Rendered as WAV blobs, played via HTMLAudioElement for iOS reliability.

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

/**
 * Generate a smooth Om drone.
 * - Fades in over 0.3s
 * - Sustains at full volume
 * - Last 25% of duration gently fades to silence
 */
function makeOmDrone(
  fundamental: number,
  duration: number,
  volume: number,
  harmonics: Array<{ ratio: number; amp: number }>,
): string {
  const sr = 44100;
  const n = Math.floor(sr * duration);
  const raw = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / sr;

    // Smooth envelope: 0.3s fade-in → sustain → last 25% fades out
    const fadeIn = Math.min(t / 0.3, 1);
    const fadeOutStart = duration * 0.75;
    const fadeOut = t > fadeOutStart
      ? Math.max(0, 1 - ((t - fadeOutStart) / (duration - fadeOutStart)))
      : 1;
    // Smooth the fade-out curve (ease-out)
    const env = fadeIn * (fadeOut * fadeOut);

    let val = 0;
    for (const h of harmonics) {
      val += Math.sin(2 * Math.PI * fundamental * h.ratio * t) * h.amp;
    }
    raw[i] = val * env;
  }

  // Normalize to target volume
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(raw[i]));
  if (peak > 0) {
    const norm = volume / peak;
    for (let i = 0; i < n; i++) raw[i] *= norm;
  }

  return samplesToWav(raw, sr);
}

/** Completion: three Om tones cascading into a warm chord that slowly fades */
function makeCompletionUrl(): string {
  const sr = 44100;
  const dur = 5.0;
  const n = Math.floor(sr * dur);
  const raw = new Float64Array(n);

  const voices = [
    { fund: 130, delay: 0,   vol: 0.30 }, // C3
    { fund: 164, delay: 0.8, vol: 0.25 }, // E3
    { fund: 196, delay: 1.6, vol: 0.22 }, // G3
  ];

  const harmonics = [
    { ratio: 1.0, amp: 1.0 },
    { ratio: 2.0, amp: 0.4 },
    { ratio: 3.0, amp: 0.15 },
    { ratio: 0.5, amp: 0.25 },
  ];

  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let val = 0;
    for (const voice of voices) {
      if (t < voice.delay) continue;
      const vt = t - voice.delay;
      const remaining = dur - voice.delay;
      // Fade in 0.4s, sustain, fade out last 30%
      const fadeIn = Math.min(vt / 0.4, 1);
      const fadeOutStart = remaining * 0.7;
      const fadeOut = vt > fadeOutStart
        ? Math.max(0, 1 - ((vt - fadeOutStart) / (remaining - fadeOutStart)))
        : 1;
      const env = fadeIn * (fadeOut * fadeOut);

      for (const h of harmonics) {
        val += Math.sin(2 * Math.PI * voice.fund * h.ratio * vt) * h.amp * env * voice.vol;
      }
    }
    raw[i] = val;
  }

  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(raw[i]));
  if (peak > 0) {
    const norm = 0.45 / peak;
    for (let i = 0; i < n; i++) raw[i] *= norm;
  }

  return samplesToWav(raw, sr);
}

// Om harmonic profiles for each phase type
const INHALE_HARMONICS = [
  { ratio: 1.0, amp: 1.0 },   // fundamental
  { ratio: 2.0, amp: 0.45 },  // octave
  { ratio: 3.0, amp: 0.2 },   // 5th above octave
  { ratio: 4.0, amp: 0.08 },  // 2nd octave
  { ratio: 0.5, amp: 0.25 },  // sub-octave for depth
];

const EXHALE_HARMONICS = [
  { ratio: 1.0, amp: 1.0 },
  { ratio: 2.0, amp: 0.35 },
  { ratio: 3.0, amp: 0.12 },
  { ratio: 0.5, amp: 0.4 },   // stronger sub for deeper feel
  { ratio: 1.5, amp: 0.15 },  // perfect 5th — adds warmth
];

const HOLD_HARMONICS = [
  { ratio: 1.0, amp: 1.0 },
  { ratio: 2.0, amp: 0.3 },
  { ratio: 3.0, amp: 0.1 },
  { ratio: 0.5, amp: 0.2 },
];

interface SoundSet {
  /** Map of "phase_index" → blob URL, where tone duration matches phase seconds */
  phases: Map<number, string>;
  complete: string;
}

class BreathAudio {
  private cache = new Map<string, SoundSet>();
  private completionUrl: string | null = null;

  /** Pre-generate all tones for a technique (each phase gets its exact duration) */
  prepareTechnique(technique: { id: string; phases: Array<{ seconds: number; type: string }> }) {
    if (this.cache.has(technique.id)) return;

    const phases = new Map<number, string>();
    for (let i = 0; i < technique.phases.length; i++) {
      const p = technique.phases[i];
      const dur = p.seconds;

      if (p.type === "inhale") {
        // C3 (130Hz) — bright, uplifting
        phases.set(i, makeOmDrone(130, dur, 0.35, INHALE_HARMONICS));
      } else if (p.type === "exhale") {
        // G2 (98Hz) — deep, calming
        phases.set(i, makeOmDrone(98, dur, 0.30, EXHALE_HARMONICS));
      } else {
        // A2 (110Hz) — neutral, gentle hold
        phases.set(i, makeOmDrone(110, dur, 0.20, HOLD_HARMONICS));
      }
    }

    if (!this.completionUrl) {
      this.completionUrl = makeCompletionUrl();
    }

    this.cache.set(technique.id, { phases, complete: this.completionUrl });
  }

  playPhase(techniqueId: string, phaseIdx: number) {
    const set = this.cache.get(techniqueId);
    const url = set?.phases.get(phaseIdx);
    if (!url) return;
    try {
      const a = new Audio(url);
      a.volume = 1.0;
      const p = a.play();
      if (p) p.catch(() => {});
    } catch { /* silent */ }
  }

  playComplete(techniqueId: string) {
    const set = this.cache.get(techniqueId);
    const url = set?.complete;
    if (!url) return;
    try {
      const a = new Audio(url);
      a.volume = 1.0;
      const p = a.play();
      if (p) p.catch(() => {});
    } catch { /* silent */ }
  }
}

const breathAudio = new BreathAudio();

// ── Types ──

interface BreathPhase {
  label: string;
  seconds: number;
  color: string;
  type: "inhale" | "exhale" | "hold";
}

interface BreathTechnique {
  id: string;
  name: string;
  description: string;
  emoji: string;
  phases: BreathPhase[];
  rounds: number;
  premium: boolean;
  benefits: string;
}

const TECHNIQUES: BreathTechnique[] = [
  {
    id: "box", name: "Box Breathing",
    description: "Equal inhale, hold, exhale, hold. Used by Navy SEALs for calm focus.",
    emoji: "🟦",
    phases: [
      { label: "Breathe In", seconds: 4, color: "#3b82f6", type: "inhale" },
      { label: "Hold", seconds: 4, color: "#8b5cf6", type: "hold" },
      { label: "Breathe Out", seconds: 4, color: "#06b6d4", type: "exhale" },
      { label: "Hold", seconds: 4, color: "#6366f1", type: "hold" },
    ],
    rounds: 6, premium: false, benefits: "Reduces stress, improves focus",
  },
  {
    id: "478", name: "4-7-8 Relaxation",
    description: "Dr. Andrew Weil's natural tranquilizer for the nervous system.",
    emoji: "🌙",
    phases: [
      { label: "Breathe In", seconds: 4, color: "#3b82f6", type: "inhale" },
      { label: "Hold", seconds: 7, color: "#8b5cf6", type: "hold" },
      { label: "Breathe Out", seconds: 8, color: "#06b6d4", type: "exhale" },
    ],
    rounds: 4, premium: true, benefits: "Promotes deep sleep, reduces anxiety",
  },
  {
    id: "wimhof", name: "Wim Hof Power Breath",
    description: "30 rapid breaths followed by a retention hold. Energizing.",
    emoji: "❄️",
    phases: [
      { label: "In", seconds: 1.5, color: "#ef4444", type: "inhale" },
      { label: "Out", seconds: 1.5, color: "#f97316", type: "exhale" },
    ],
    rounds: 30, premium: true, benefits: "Boosts energy, strengthens immune system",
  },
  {
    id: "sigh", name: "Physiological Sigh",
    description: "Double inhale through nose, long exhale. Fastest way to calm down.",
    emoji: "😮‍💨",
    phases: [
      { label: "Breathe In", seconds: 2, color: "#3b82f6", type: "inhale" },
      { label: "Sip In", seconds: 1, color: "#6366f1", type: "inhale" },
      { label: "Long Exhale", seconds: 6, color: "#06b6d4", type: "exhale" },
    ],
    rounds: 5, premium: true, benefits: "Instant calm, reduces CO2",
  },
  {
    id: "energize", name: "Energizing Breath",
    description: "Quick rhythmic breathing to wake up body and mind.",
    emoji: "⚡",
    phases: [
      { label: "Sharp In", seconds: 1, color: "#f59e0b", type: "inhale" },
      { label: "Sharp Out", seconds: 1, color: "#ef4444", type: "exhale" },
    ],
    rounds: 20, premium: true, benefits: "Increases alertness, boosts energy",
  },
];

// ── Circle ──

function BreathingCircle({ progress, label, color, secondsLeft, isActive }: {
  progress: number; label: string; color: string; secondsLeft: number; isActive: boolean;
}) {
  const isInhale = label.toLowerCase().includes("in") || label.toLowerCase().includes("sip");
  const isExhale = label.toLowerCase().includes("out") || label.toLowerCase().includes("exhale");
  const minScale = 0.45;
  const maxScale = 1;
  const scale = isInhale ? minScale + (maxScale - minScale) * progress
    : isExhale ? maxScale - (maxScale - minScale) * progress
    : maxScale;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>
      <div className="absolute rounded-full" style={{
        width: 300, height: 300,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        transform: `scale(${scale})`, transition: "transform 0.2s ease-out",
      }} />
      <div className="absolute rounded-full flex items-center justify-center" style={{
        width: 240, height: 240,
        background: `radial-gradient(circle at 30% 30%, ${color}35, ${color}10)`,
        border: `3px solid ${color}50`,
        transform: `scale(${scale})`, transition: "transform 0.2s ease-out",
        boxShadow: isActive ? `0 0 60px ${color}25, inset 0 0 30px ${color}08` : "none",
      }}>
        <div className="text-center">
          <p className="text-3xl font-black tracking-tight" style={{ color }}>{label}</p>
          <p className="text-5xl font-bold mt-2 tabular-nums" style={{ color: "var(--text-primary)" }}>
            {Math.ceil(secondsLeft)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Session ──

function BreathSession({ technique, onClose }: { technique: BreathTechnique; onClose: () => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [timeInPhase, setTimeInPhase] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPhaseRef = useRef<string>("");

  const phase = technique.phases[currentPhaseIdx];
  const totalPhaseTime = phase.seconds;

  // Play the Om drone for each new phase
  useEffect(() => {
    if (!isRunning || !soundOn) return;
    const key = `${currentRound}-${currentPhaseIdx}`;
    if (lastPhaseRef.current === key) return;
    lastPhaseRef.current = key;
    breathAudio.playPhase(technique.id, currentPhaseIdx);
  }, [currentPhaseIdx, currentRound, isRunning, soundOn, technique.id]);

  const tick = useCallback(() => {
    setTimeInPhase((prev) => {
      const next = prev + 0.05;
      setPhaseProgress(Math.min(next / totalPhaseTime, 1));
      if (next >= totalPhaseTime) {
        hapticLight();
        const nextPI = currentPhaseIdx + 1;
        if (nextPI >= technique.phases.length) {
          const nextR = currentRound + 1;
          if (nextR >= technique.rounds) {
            hapticHeavy();
            if (soundOn) breathAudio.playComplete(technique.id);
            setCompleted(true);
            setIsRunning(false);
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
  }, [currentPhaseIdx, currentRound, technique, totalPhaseTime, soundOn]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 50);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  // Start: pre-generate tones (sync, in gesture context) then play first phase
  const start = () => {
    hapticMedium();
    breathAudio.prepareTechnique(technique);
    if (soundOn) {
      breathAudio.playPhase(technique.id, 0);
      lastPhaseRef.current = "0-0";
    }
    setIsRunning(true);
  };

  const resume = () => { hapticMedium(); setIsRunning(true); };
  const pause = () => { hapticMedium(); setIsRunning(false); };
  const hasStarted = currentRound > 0 || currentPhaseIdx > 0 || timeInPhase > 0;
  const reset = () => {
    hapticLight();
    setIsRunning(false);
    setCurrentRound(0);
    setCurrentPhaseIdx(0);
    setPhaseProgress(0);
    setTimeInPhase(0);
    setCompleted(false);
    lastPhaseRef.current = "";
  };

  if (completed) {
    const totalTime = technique.phases.reduce((s, p) => s + p.seconds, 0) * technique.rounds;
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <div className="text-6xl mb-6">🧘</div>
        <h2 className="text-3xl font-black mb-2" style={{ color: "var(--text-primary)" }}>Complete</h2>
        <p className="text-lg mb-1" style={{ color: "var(--text-muted)" }}>{technique.name}</p>
        <p className="text-sm mb-8" style={{ color: "var(--text-faint)" }}>{technique.rounds} rounds · {Math.round(totalTime / 60)} min</p>
        <div className="flex gap-3">
          <button type="button" onClick={reset} className="px-6 py-3.5 rounded-2xl text-base font-bold"
            style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}>Repeat</button>
          <button type="button" onClick={onClose} className="px-6 py-3.5 rounded-2xl text-base font-bold"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[80vh]">
      <div className="w-full flex items-center justify-between mb-2 px-1"
        style={{ position: "relative", zIndex: 50 }}>
        <button type="button" onClick={onClose}
          className="tap-btn rounded-full flex items-center justify-center"
          style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </button>
        <p className="text-sm font-bold" style={{ color: "var(--text-faint)" }}>{technique.name}</p>
        <button type="button"
          onClick={() => { hapticLight(); setSoundOn(s => !s); }}
          className="tap-btn rounded-full flex items-center justify-center"
          style={{ width: 40, height: 40, background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          {soundOn ? <Volume2 size={18} style={{ color: "var(--text-muted)" }} /> : <VolumeX size={18} style={{ color: "var(--text-faint)" }} />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <BreathingCircle secondsLeft={totalPhaseTime - timeInPhase} progress={phaseProgress} label={phase.label} color={phase.color} isActive={isRunning} />
      </div>

      <p className="text-lg font-bold tabular-nums mb-4" style={{ color: "var(--text-faint)" }}>{currentRound + 1} / {technique.rounds}</p>

      <div className="flex gap-2 mb-6 flex-wrap justify-center max-w-[240px]">
        {Array.from({ length: Math.min(technique.rounds, 30) }).map((_, i) => (
          <div key={i} className="rounded-full" style={{ width: 10, height: 10,
            background: i < currentRound ? "var(--accent-green)" : i === currentRound ? phase.color : "var(--bg-card-hover)", transition: "background 0.3s" }} />
        ))}
      </div>

      <div className="flex items-center gap-5 pb-8">
        <button type="button" onClick={reset} className="rounded-full p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <RotateCcw size={22} style={{ color: "var(--text-muted)" }} />
        </button>
        <button type="button" onClick={isRunning ? pause : (hasStarted ? resume : start)}
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

// ── Main Page ──

export default function BreathworkPage() {
  const { isPremium } = usePremium();
  const [activeTechnique, setActiveTechnique] = useState<BreathTechnique | null>(null);

  if (activeTechnique) return <BreathSession technique={activeTechnique} onClose={() => setActiveTechnique(null)} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/app/today" className="tap-btn rounded-full p-1.5" style={{ background: "var(--bg-card)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Breathwork</h1>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Close your eyes. We'll guide you with sound.</p>
        </div>
      </div>

      <div className="space-y-3">
        {TECHNIQUES.map((t) => {
          const locked = t.premium && !isPremium;
          const totalTime = t.phases.reduce((s, p) => s + p.seconds, 0) * t.rounds;
          const minutes = Math.round(totalTime / 60);
          return (
            <button key={t.id} type="button"
              onClick={() => { if (locked) { hapticLight(); window.location.href = "/app/settings/premium"; return; } hapticMedium(); setActiveTechnique(t); }}
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
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>~{minutes} min</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                      🕉️ Om drones
                    </span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>{t.benefits}</p>
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
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>4 premium methods with guided Om audio</p>
        </Link>
      )}
    </div>
  );
}
