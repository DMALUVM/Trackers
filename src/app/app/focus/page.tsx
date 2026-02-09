"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Play, Pause, RotateCcw, Coffee, Brain, Zap } from "lucide-react";
import Link from "next/link";
import { hapticLight, hapticMedium, hapticHeavy } from "@/lib/haptics";

interface FocusMode {
  id: string;
  name: string;
  emoji: string;
  work: number;   // minutes
  break_: number;  // minutes
  rounds: number;
  description: string;
}

const MODES: FocusMode[] = [
  { id: "pomodoro", name: "Pomodoro", emoji: "🍅", work: 25, break_: 5, rounds: 4, description: "Classic 25/5 intervals" },
  { id: "deep", name: "Deep Work", emoji: "🧠", work: 50, break_: 10, rounds: 2, description: "Extended focus blocks" },
  { id: "sprint", name: "Sprint", emoji: "⚡", work: 15, break_: 3, rounds: 6, description: "Quick bursts for energy" },
];

type Phase = "work" | "break" | "done";

export default function FocusPage() {
  const [selectedMode, setSelectedMode] = useState<FocusMode>(MODES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("work");
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MODES[0].work * 60);
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPhaseSeconds = phase === "work" ? selectedMode.work * 60 : selectedMode.break_ * 60;
  const progress = 1 - timeLeft / totalPhaseSeconds;

  const handlePhaseEnd = useCallback(() => {
    hapticHeavy();
    if (phase === "work") {
      const nextRound = currentRound + 1;
      if (nextRound >= selectedMode.rounds) {
        setPhase("done");
        setIsRunning(false);
        return;
      }
      setPhase("break");
      setTimeLeft(selectedMode.break_ * 60);
    } else {
      setCurrentRound((prev) => prev + 1);
      setPhase("work");
      setTimeLeft(selectedMode.work * 60);
    }
  }, [phase, currentRound, selectedMode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            handlePhaseEnd();
            return 0;
          }
          return prev - 1;
        });
        if (phase === "work") {
          setTotalFocusSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, handlePhaseEnd, phase]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const reset = () => {
    hapticLight();
    setIsRunning(false);
    setPhase("work");
    setCurrentRound(0);
    setTimeLeft(selectedMode.work * 60);
    setTotalFocusSeconds(0);
    setStarted(false);
  };

  const selectMode = (mode: FocusMode) => {
    hapticMedium();
    setSelectedMode(mode);
    setTimeLeft(mode.work * 60);
    setPhase("work");
    setCurrentRound(0);
    setTotalFocusSeconds(0);
    setStarted(false);
  };

  const phaseColors = {
    work: { bg: "rgba(59,130,246,0.1)", ring: "#3b82f6", text: "Focus" },
    break: { bg: "rgba(16,185,129,0.1)", ring: "#10b981", text: "Break" },
    done: { bg: "rgba(245,158,11,0.1)", ring: "#f59e0b", text: "Done!" },
  };

  const c = phaseColors[phase];

  if (phase === "done") {
    const focusMin = Math.round(totalFocusSeconds / 60);
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Focus Complete!
        </h2>
        <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
          {selectedMode.name} · {selectedMode.rounds} rounds
        </p>
        <p className="text-3xl font-bold my-4 tabular-nums" style={{ color: "#3b82f6" }}>
          {focusMin} min
        </p>
        <p className="text-xs mb-8" style={{ color: "var(--text-faint)" }}>
          of deep focus time logged
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={reset}
            className="px-5 py-3 rounded-xl text-sm font-bold"
            style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}>
            New Session
          </button>
          <Link href="/app/today"
            className="px-5 py-3 rounded-xl text-sm font-bold"
            style={{ background: "var(--accent-green)", color: "var(--text-inverse)", textDecoration: "none" }}>
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/today" className="tap-btn rounded-full p-1.5" style={{ background: "var(--bg-card)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Focus Timer</h1>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Deep work sessions with breaks</p>
        </div>
      </div>

      {/* Mode selector */}
      {!started && (
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button key={m.id} type="button" onClick={() => selectMode(m)}
              className="flex-1 rounded-xl p-3 text-center transition-all"
              style={{
                background: selectedMode.id === m.id ? "var(--accent-green-soft)" : "var(--bg-card)",
                border: selectedMode.id === m.id ? "1px solid var(--accent-green)" : "1px solid var(--border-primary)",
              }}>
              <span className="text-lg">{m.emoji}</span>
              <p className="text-xs font-bold mt-1" style={{
                color: selectedMode.id === m.id ? "var(--accent-green-text)" : "var(--text-muted)"
              }}>{m.name}</p>
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{m.work}/{m.break_}</p>
            </button>
          ))}
        </div>
      )}

      {/* Timer */}
      <div className="flex flex-col items-center pt-4">
        {/* Phase indicator */}
        <div className="flex items-center gap-2 mb-6">
          {phase === "work"
            ? <Brain size={16} style={{ color: c.ring }} />
            : <Coffee size={16} style={{ color: c.ring }} />
          }
          <span className="text-sm font-bold" style={{ color: c.ring }}>{c.text}</span>
          <span className="text-xs tabular-nums" style={{ color: "var(--text-faint)" }}>
            Round {currentRound + 1}/{selectedMode.rounds}
          </span>
        </div>

        {/* Circle timer */}
        <div className="relative" style={{ width: 220, height: 220 }}>
          <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
            <circle cx="110" cy="110" r="96" fill="none" stroke="var(--bg-card-hover)" strokeWidth="8" />
            <circle
              cx="110" cy="110" r="96" fill="none"
              stroke={c.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 96}`}
              strokeDashoffset={`${2 * Math.PI * 96 * (1 - progress)}`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {formatTime(timeLeft)}
            </span>
            {totalFocusSeconds > 0 && (
              <span className="text-xs mt-1 tabular-nums" style={{ color: "var(--text-faint)" }}>
                {Math.round(totalFocusSeconds / 60)} min focused
              </span>
            )}
          </div>
        </div>

        {/* Round dots */}
        <div className="flex gap-2 my-6">
          {Array.from({ length: selectedMode.rounds }).map((_, i) => (
            <div key={i} className="rounded-full"
              style={{
                width: 10, height: 10,
                background: i < currentRound ? "var(--accent-green)" : i === currentRound ? c.ring : "var(--bg-card-hover)",
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={reset}
            className="rounded-full p-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
            <RotateCcw size={20} style={{ color: "var(--text-muted)" }} />
          </button>
          <button type="button"
            onClick={() => {
              hapticMedium();
              setIsRunning(!isRunning);
              setStarted(true);
            }}
            className="rounded-full p-5"
            style={{
              background: isRunning ? "rgba(239,68,68,0.15)" : c.ring,
              boxShadow: isRunning ? "none" : `0 4px 24px ${c.ring}40`,
            }}>
            {isRunning
              ? <Pause size={28} style={{ color: "#ef4444" }} />
              : <Play size={28} style={{ color: "white", marginLeft: 2 }} />
            }
          </button>
          <div style={{ width: 44 }} />
        </div>
      </div>

      {/* Info */}
      {!started && (
        <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>{selectedMode.name}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {selectedMode.description}. {selectedMode.work} min work / {selectedMode.break_} min break × {selectedMode.rounds} rounds = {selectedMode.work * selectedMode.rounds} min focus time.
          </p>
        </div>
      )}
    </div>
  );
}
