"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Play, Pause, RotateCcw, Lock, Crown, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { usePremium } from "@/lib/premium";
import { hapticLight, hapticMedium, hapticHeavy } from "@/lib/haptics";

// ── WAV Audio Engine ──
// iOS WKWebView (Capacitor) does NOT reliably support Web Audio API oscillators.
// Instead we generate actual WAV audio buffers, convert to blob URLs, and play
// them via HTMLAudioElement — the most reliable audio path on all platforms.

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

/** Generate a mono 16-bit PCM WAV as a blob URL */
function makeToneUrl(freq: number, duration: number, volume: number, fadeRate = 4): string {
  const sr = 44100;
  const n = Math.floor(sr * duration);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);

  // RIFF header
  writeString(v, 0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  writeString(v, 8, "WAVE");
  writeString(v, 12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);      // PCM
  v.setUint16(22, 1, true);      // mono
  v.setUint32(24, sr, true);     // sample rate
  v.setUint32(28, sr * 2, true); // byte rate
  v.setUint16(32, 2, true);      // block align
  v.setUint16(34, 16, true);     // bits per sample
  writeString(v, 36, "data");
  v.setUint32(40, n * 2, true);

  // PCM samples with exponential fade
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t * fadeRate);
    const sample = Math.sin(2 * Math.PI * freq * t) * volume * env;
    v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, sample * 32767)), true);
  }

  const blob = new Blob([buf], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

/** Generate a 3-note chord WAV (C5 + E5 + G5 cascade) */
function makeChordUrl(): string {
  const sr = 44100;
  const dur = 1.2;
  const n = Math.floor(sr * dur);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);

  writeString(v, 0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  writeString(v, 8, "WAVE");
  writeString(v, 12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  writeString(v, 36, "data");
  v.setUint32(40, n * 2, true);

  const notes = [
    { freq: 523, delay: 0, vol: 0.2 },    // C5
    { freq: 659, delay: 0.15, vol: 0.18 }, // E5
    { freq: 784, delay: 0.3, vol: 0.16 },  // G5
  ];

  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let sample = 0;
    for (const note of notes) {
      if (t >= note.delay) {
        const nt = t - note.delay;
        const env = Math.exp(-nt * 3);
        sample += Math.sin(2 * Math.PI * note.freq * nt) * note.vol * env;
      }
    }
    v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, sample * 32767)), true);
  }

  const blob = new Blob([buf], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

class BreathAudio {
  private urls: Record<string, string> | null = null;

  /** Generate all sound URLs (lazy, called once) */
  private ensureSounds() {
    if (this.urls) return;
    this.urls = {
      inhale:   makeToneUrl(523, 0.6, 0.35, 3),    // C5, gentle rising chime
      exhale:   makeToneUrl(392, 0.8, 0.3, 2.5),    // G4, warm descending tone
      hold:     makeToneUrl(440, 0.3, 0.2, 5),      // A4, soft short tick
      complete: makeChordUrl(),                       // C-E-G bright chord
    };
  }

  private playUrl(key: string) {
    if (!this.urls?.[key]) return;
    try {
      const audio = new Audio(this.urls[key]);
      audio.volume = 1.0;
      // play() returns a promise; we catch any autoplay errors silently
      const p = audio.play();
      if (p) p.catch(() => {});
    } catch {
      // Fallback: do nothing if audio creation fails
    }
  }

  /** Call from user tap handler — generates sounds + plays first tone.
   *  This "unlocks" iOS audio session because .play() happens in gesture context. */
  inhale()   { this.ensureSounds(); this.playUrl("inhale"); }
  exhale()   { this.ensureSounds(); this.playUrl("exhale"); }
  hold()     { this.ensureSounds(); this.playUrl("hold"); }
  complete() { this.ensureSounds(); this.playUrl("complete"); }
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

  // Play audio cue on each phase change
  useEffect(() => {
    if (!isRunning || !soundOn) return;
    const key = `${currentRound}-${currentPhaseIdx}`;
    if (lastPhaseRef.current === key) return;
    lastPhaseRef.current = key;
    const p = technique.phases[currentPhaseIdx];
    if (p.type === "inhale") breathAudio.inhale();
    else if (p.type === "exhale") breathAudio.exhale();
    else breathAudio.hold();
  }, [currentPhaseIdx, currentRound, isRunning, soundOn, technique.phases]);

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
            if (soundOn) breathAudio.complete();
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

  // CRITICAL: start() is fully synchronous. breathAudio.inhale() generates
  // WAV blob URLs + calls new Audio().play() all within the tap gesture.
  // This unlocks the iOS audio session so timer-triggered sounds also work.
  const start = () => {
    hapticMedium();
    if (soundOn) {
      breathAudio.inhale();
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
      {/* Session header — z-50 above SettingsGear (z-40) */}
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
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                      <Volume2 size={10} /> Audio cues
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
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>4 premium methods with guided audio</p>
        </Link>
      )}
    </div>
  );
}
