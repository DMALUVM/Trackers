"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Play, Pause, RotateCcw, Lock, Crown } from "lucide-react";
import Link from "next/link";
import { usePremium } from "@/lib/premium";
import { hapticLight, hapticMedium, hapticHeavy } from "@/lib/haptics";

// ── Breathing Techniques ──

interface BreathPhase {
  label: string;
  seconds: number;
  color: string;
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
    id: "box",
    name: "Box Breathing",
    description: "Equal inhale, hold, exhale, hold. Used by Navy SEALs for calm focus.",
    emoji: "🟦",
    phases: [
      { label: "Inhale", seconds: 4, color: "#3b82f6" },
      { label: "Hold", seconds: 4, color: "#8b5cf6" },
      { label: "Exhale", seconds: 4, color: "#06b6d4" },
      { label: "Hold", seconds: 4, color: "#6366f1" },
    ],
    rounds: 6,
    premium: false,
    benefits: "Reduces stress, improves focus",
  },
  {
    id: "478",
    name: "4-7-8 Relaxation",
    description: "Dr. Andrew Weil's natural tranquilizer for the nervous system.",
    emoji: "🌙",
    phases: [
      { label: "Inhale", seconds: 4, color: "#3b82f6" },
      { label: "Hold", seconds: 7, color: "#8b5cf6" },
      { label: "Exhale", seconds: 8, color: "#06b6d4" },
    ],
    rounds: 4,
    premium: true,
    benefits: "Promotes deep sleep, reduces anxiety",
  },
  {
    id: "wimhof",
    name: "Wim Hof Power Breath",
    description: "30 rapid breaths followed by a retention hold. Energizing.",
    emoji: "❄️",
    phases: [
      { label: "Rapid Inhale", seconds: 1.5, color: "#ef4444" },
      { label: "Rapid Exhale", seconds: 1.5, color: "#f97316" },
    ],
    rounds: 30,
    premium: true,
    benefits: "Boosts energy, strengthens immune system",
  },
  {
    id: "sigh",
    name: "Physiological Sigh",
    description: "Double inhale through nose, long exhale. Fastest way to calm down.",
    emoji: "😮‍💨",
    phases: [
      { label: "Inhale", seconds: 2, color: "#3b82f6" },
      { label: "Sip In", seconds: 1, color: "#6366f1" },
      { label: "Long Exhale", seconds: 6, color: "#06b6d4" },
    ],
    rounds: 5,
    premium: true,
    benefits: "Instant calm, reduces CO2",
  },
  {
    id: "energize",
    name: "Energizing Breath",
    description: "Quick rhythmic breathing to wake up body and mind.",
    emoji: "⚡",
    phases: [
      { label: "Sharp Inhale", seconds: 1, color: "#f59e0b" },
      { label: "Sharp Exhale", seconds: 1, color: "#ef4444" },
    ],
    rounds: 20,
    premium: true,
    benefits: "Increases alertness, boosts energy",
  },
];

// ── Breathing Circle Component ──

function BreathingCircle({
  phase,
  progress,
  label,
  color,
  isActive,
}: {
  phase: string;
  progress: number;
  label: string;
  color: string;
  isActive: boolean;
}) {
  const minScale = 0.5;
  const maxScale = 1;
  const isInhale = label.toLowerCase().includes("inhale") || label.toLowerCase().includes("sip");
  const isExhale = label.toLowerCase().includes("exhale");

  let scale: number;
  if (isInhale) {
    scale = minScale + (maxScale - minScale) * progress;
  } else if (isExhale) {
    scale = maxScale - (maxScale - minScale) * progress;
  } else {
    scale = maxScale; // hold
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
      {/* Outer glow */}
      <div
        className="absolute rounded-full transition-transform"
        style={{
          width: 240,
          height: 240,
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          transform: `scale(${scale})`,
          transition: "transform 0.3s ease-in-out",
        }}
      />
      {/* Main circle */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: 180,
          height: 180,
          background: `radial-gradient(circle at 30% 30%, ${color}40, ${color}15)`,
          border: `3px solid ${color}60`,
          transform: `scale(${scale})`,
          transition: "transform 0.3s ease-in-out",
          boxShadow: isActive ? `0 0 40px ${color}30` : "none",
        }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {label}
          </p>
          <p className="text-sm mt-1 tabular-nums" style={{ color: "var(--text-muted)" }}>
            {phase}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Session View ──

function BreathSession({
  technique,
  onClose,
}: {
  technique: BreathTechnique;
  onClose: () => void;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [timeInPhase, setTimeInPhase] = useState(0);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase = technique.phases[currentPhaseIdx];
  const totalPhaseTime = phase.seconds;

  const tick = useCallback(() => {
    setTimeInPhase((prev) => {
      const next = prev + 0.05;
      const progress = Math.min(next / totalPhaseTime, 1);
      setPhaseProgress(progress);

      if (next >= totalPhaseTime) {
        // Phase complete — haptic pulse
        hapticLight();

        const nextPhaseIdx = currentPhaseIdx + 1;
        if (nextPhaseIdx >= technique.phases.length) {
          // Round complete
          const nextRound = currentRound + 1;
          if (nextRound >= technique.rounds) {
            // Session complete
            hapticHeavy();
            setCompleted(true);
            setIsRunning(false);
            return 0;
          }
          setCurrentRound(nextRound);
          setCurrentPhaseIdx(0);
        } else {
          setCurrentPhaseIdx(nextPhaseIdx);
        }
        return 0;
      }
      return next;
    });
  }, [currentPhaseIdx, currentRound, technique, totalPhaseTime]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 50);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const toggleRunning = () => {
    hapticMedium();
    setIsRunning(!isRunning);
  };

  const reset = () => {
    hapticLight();
    setIsRunning(false);
    setCurrentRound(0);
    setCurrentPhaseIdx(0);
    setPhaseProgress(0);
    setTimeInPhase(0);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="text-5xl mb-4">🧘</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Session Complete
        </h2>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          {technique.name} · {technique.rounds} rounds
        </p>
        <p className="text-xs mb-8" style={{ color: "var(--text-faint)" }}>
          {technique.benefits}
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={reset}
            className="px-5 py-3 rounded-xl text-sm font-bold"
            style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}>
            Repeat
          </button>
          <button type="button" onClick={onClose}
            className="px-5 py-3 rounded-xl text-sm font-bold"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[70vh]">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <button type="button" onClick={onClose} className="text-sm font-medium tap-btn"
          style={{ color: "var(--text-muted)" }}>
          ✕ Close
        </button>
        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-faint)" }}>
          Round {currentRound + 1} / {technique.rounds}
        </span>
      </div>

      {/* Breathing circle */}
      <div className="flex-1 flex items-center justify-center">
        <BreathingCircle
          phase={`${Math.ceil(totalPhaseTime - timeInPhase)}s`}
          progress={phaseProgress}
          label={phase.label}
          color={phase.color}
          isActive={isRunning}
        />
      </div>

      {/* Round progress dots */}
      <div className="flex gap-1.5 my-6 flex-wrap justify-center max-w-[200px]">
        {Array.from({ length: technique.rounds }).map((_, i) => (
          <div key={i} className="rounded-full"
            style={{
              width: 8, height: 8,
              background: i < currentRound ? "var(--accent-green)" : i === currentRound ? phase.color : "var(--bg-card-hover)",
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 pb-6">
        <button type="button" onClick={reset}
          className="rounded-full p-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <RotateCcw size={20} style={{ color: "var(--text-muted)" }} />
        </button>
        <button type="button" onClick={toggleRunning}
          className="rounded-full p-5"
          style={{
            background: isRunning
              ? "rgba(239,68,68,0.15)"
              : "var(--accent-green)",
            boxShadow: isRunning ? "none" : "0 4px 24px rgba(16,185,129,0.3)",
          }}>
          {isRunning
            ? <Pause size={28} style={{ color: "#ef4444" }} />
            : <Play size={28} style={{ color: "var(--text-inverse)", marginLeft: 2 }} />
          }
        </button>
        <div style={{ width: 44 }} />
      </div>
    </div>
  );
}

// ── Main Page ──

export default function BreathworkPage() {
  const { isPremium } = usePremium();
  const [activeTechnique, setActiveTechnique] = useState<BreathTechnique | null>(null);

  if (activeTechnique) {
    return (
      <BreathSession
        technique={activeTechnique}
        onClose={() => setActiveTechnique(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/today" className="tap-btn rounded-full p-1.5"
          style={{ background: "var(--bg-card)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Breathwork
          </h1>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Guided breathing exercises
          </p>
        </div>
      </div>

      {/* Technique cards */}
      <div className="space-y-3">
        {TECHNIQUES.map((t) => {
          const locked = t.premium && !isPremium;
          const totalTime = t.phases.reduce((s, p) => s + p.seconds, 0) * t.rounds;
          const minutes = Math.round(totalTime / 60);

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (locked) {
                  hapticLight();
                  window.location.href = "/app/settings/premium";
                  return;
                }
                hapticMedium();
                setActiveTechnique(t);
              }}
              className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-primary)",
                opacity: locked ? 0.7 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {t.name}
                    </p>
                    {locked && <Lock size={12} style={{ color: "var(--text-faint)" }} />}
                    {t.premium && isPremium && <Crown size={12} style={{ color: "#f59e0b" }} />}
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                      ~{minutes} min
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                      {t.benefits}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Premium upsell */}
      {!isPremium && (
        <Link href="/app/settings/premium"
          className="block rounded-2xl p-4 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))",
            border: "1px solid rgba(99,102,241,0.2)",
            textDecoration: "none",
          }}>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Unlock All Techniques
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            4 premium breathwork methods + guided movement
          </p>
        </Link>
      )}
    </div>
  );
}
