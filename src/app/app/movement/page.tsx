"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, Play, Pause, SkipForward, RotateCcw, Lock } from "lucide-react";
import Link from "next/link";
import { usePremium } from "@/lib/premium";
import { hapticLight, hapticMedium, hapticHeavy } from "@/lib/haptics";

interface MovementStep {
  name: string;
  instruction: string;
  seconds: number;
  emoji: string;
}

interface MovementRoutine {
  id: string;
  name: string;
  description: string;
  emoji: string;
  duration: string;
  premium: boolean;
  category: string;
  steps: MovementStep[];
}

const ROUTINES: MovementRoutine[] = [
  {
    id: "morning-mobility",
    name: "Morning Mobility",
    description: "Wake up your joints and get blood flowing. Perfect first thing.",
    emoji: "🌅",
    duration: "5 min",
    premium: false,
    category: "Morning",
    steps: [
      { name: "Neck Circles", instruction: "Slowly roll your head in full circles. 5 each direction.", seconds: 30, emoji: "🔄" },
      { name: "Shoulder Rolls", instruction: "Big backward circles with both shoulders. Open up the chest.", seconds: 20, emoji: "💪" },
      { name: "Cat-Cow", instruction: "On all fours — arch and round your spine with each breath.", seconds: 40, emoji: "🐱" },
      { name: "World's Greatest Stretch", instruction: "Lunge position, rotate torso toward front knee, reach arm up.", seconds: 40, emoji: "🌍" },
      { name: "Hip Circles", instruction: "Hands on hips, make big circles. 10 each direction.", seconds: 30, emoji: "⭕" },
      { name: "Standing Forward Fold", instruction: "Hang loose, let gravity pull you down. Shake your head yes and no.", seconds: 30, emoji: "🙇" },
      { name: "Spinal Twist", instruction: "Seated or standing, rotate torso left and right gently.", seconds: 30, emoji: "🔀" },
      { name: "Deep Breaths", instruction: "Stand tall. 5 deep breaths — inhale through nose, exhale through mouth.", seconds: 30, emoji: "🧘" },
    ],
  },
  {
    id: "lymphatic",
    name: "Lymphatic Drainage Flow",
    description: "Gentle movements to stimulate lymph flow and reduce inflammation.",
    emoji: "💧",
    duration: "5 min",
    premium: true,
    category: "Recovery",
    steps: [
      { name: "Diaphragmatic Breathing", instruction: "Deep belly breathing. Hands on belly, feel it rise and fall.", seconds: 40, emoji: "🫁" },
      { name: "Neck Lymph Massage", instruction: "Light strokes from behind ears down to collarbone. Very gentle.", seconds: 30, emoji: "✋" },
      { name: "Arm Pumps", instruction: "Arms overhead, open and close fists 20 times. Pump the lymph.", seconds: 25, emoji: "✊" },
      { name: "Trunk Rotations", instruction: "Arms out, twist torso side to side. Keep hips forward.", seconds: 30, emoji: "🔄" },
      { name: "Leg Bounce", instruction: "Seated, bounce both legs rapidly. Stimulates lower body lymph.", seconds: 30, emoji: "🦵" },
      { name: "Ankle Circles", instruction: "Rotate each ankle 15 times each direction. Get fluid moving.", seconds: 30, emoji: "⭕" },
      { name: "Rebounding", instruction: "Gentle bouncing on toes. If you have a rebounder, use it!", seconds: 40, emoji: "⬆️" },
      { name: "Deep Breaths", instruction: "Finish with 5 deep breaths. Belly, then chest, then exhale slowly.", seconds: 30, emoji: "🧘" },
    ],
  },
  {
    id: "desk-stretch",
    name: "Desk Break Stretch",
    description: "Quick stretch for office workers. Do it every 2 hours.",
    emoji: "🖥️",
    duration: "3 min",
    premium: true,
    category: "Work",
    steps: [
      { name: "Chest Opener", instruction: "Clasp hands behind back, squeeze shoulder blades, lift arms.", seconds: 20, emoji: "🫁" },
      { name: "Seated Spinal Twist", instruction: "Sit tall, twist right hand to left knee. Hold. Switch.", seconds: 30, emoji: "🔀" },
      { name: "Wrist Circles", instruction: "Circle wrists both directions. Spread fingers wide between.", seconds: 20, emoji: "🖐️" },
      { name: "Neck Side Stretch", instruction: "Ear to shoulder, hold 10 seconds each side. No forcing.", seconds: 25, emoji: "↔️" },
      { name: "Standing Quad Stretch", instruction: "Pull one foot to glute, hold desk for balance. Switch.", seconds: 30, emoji: "🦵" },
      { name: "Figure Four", instruction: "Cross ankle over knee, hinge forward gently. Great for hips.", seconds: 30, emoji: "4️⃣" },
    ],
  },
  {
    id: "evening-wind",
    name: "Evening Wind-Down",
    description: "Calm your nervous system before bed. Pairs with 4-7-8 breathing.",
    emoji: "🌙",
    duration: "5 min",
    premium: true,
    category: "Evening",
    steps: [
      { name: "Child's Pose", instruction: "Knees wide, arms extended, forehead to floor. Breathe deeply.", seconds: 40, emoji: "🧎" },
      { name: "Supine Twist", instruction: "Lying down, knees to one side, arms out. Switch after 20 sec.", seconds: 40, emoji: "🔀" },
      { name: "Legs Up Wall", instruction: "Lie on back, legs straight up against a wall. Let gravity drain.", seconds: 50, emoji: "🦶" },
      { name: "Butterfly Stretch", instruction: "Soles of feet together, knees out. Gentle forward fold.", seconds: 30, emoji: "🦋" },
      { name: "Happy Baby", instruction: "On back, grab outer feet, rock side to side gently.", seconds: 30, emoji: "👶" },
      { name: "Savasana", instruction: "Lie flat, palms up, eyes closed. Scan body for tension and release.", seconds: 60, emoji: "🧘" },
    ],
  },
];

// ── Session View ──

function MovementSession({
  routine,
  onClose,
}: {
  routine: MovementRoutine;
  onClose: () => void;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(routine.steps[0].seconds);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = routine.steps[currentStep];
  const progress = 1 - timeLeft / step.seconds;

  const nextStep = useCallback(() => {
    hapticMedium();
    if (currentStep + 1 >= routine.steps.length) {
      hapticHeavy();
      setCompleted(true);
      setIsRunning(false);
      return;
    }
    setCurrentStep((prev) => prev + 1);
    setTimeLeft(routine.steps[currentStep + 1].seconds);
  }, [currentStep, routine.steps]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            nextStep();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, nextStep]);

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Routine Complete!
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          {routine.name} · {routine.steps.length} movements
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={() => { setCurrentStep(0); setTimeLeft(routine.steps[0].seconds); setCompleted(false); }}
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
    <div className="flex flex-col min-h-[70vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={onClose} className="text-sm font-medium tap-btn"
          style={{ color: "var(--text-muted)" }}>
          ✕ Close
        </button>
        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-faint)" }}>
          {currentStep + 1} / {routine.steps.length}
        </span>
      </div>

      {/* Current movement */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <span className="text-5xl mb-4">{step.emoji}</span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          {step.name}
        </h2>
        <p className="text-sm leading-relaxed max-w-[280px]" style={{ color: "var(--text-muted)" }}>
          {step.instruction}
        </p>

        {/* Timer ring */}
        <div className="relative mt-8 mb-4" style={{ width: 120, height: 120 }}>
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-card-hover)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="var(--accent-green)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {Math.ceil(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex gap-1.5 justify-center my-4 flex-wrap max-w-[240px] mx-auto">
        {routine.steps.map((_, i) => (
          <div key={i} className="rounded-full"
            style={{
              width: 8, height: 8,
              background: i < currentStep ? "var(--accent-green)" : i === currentStep ? "var(--text-primary)" : "var(--bg-card-hover)",
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <button type="button" onClick={() => { hapticLight(); setIsRunning(!isRunning); }}
          className="rounded-full p-5"
          style={{
            background: isRunning ? "rgba(239,68,68,0.15)" : "var(--accent-green)",
            boxShadow: isRunning ? "none" : "0 4px 24px rgba(16,185,129,0.3)",
          }}>
          {isRunning
            ? <Pause size={28} style={{ color: "#ef4444" }} />
            : <Play size={28} style={{ color: "var(--text-inverse)", marginLeft: 2 }} />
          }
        </button>
        <button type="button" onClick={nextStep}
          className="rounded-full p-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <SkipForward size={20} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function MovementPage() {
  const { isPremium } = usePremium();
  const [activeRoutine, setActiveRoutine] = useState<MovementRoutine | null>(null);

  if (activeRoutine) {
    return <MovementSession routine={activeRoutine} onClose={() => setActiveRoutine(null)} />;
  }

  const categories = [...new Set(ROUTINES.map(r => r.category))];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/app/today" className="tap-btn rounded-full p-1.5" style={{ background: "var(--bg-card)" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-muted)" }} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Movement</h1>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>Guided routines for mobility & recovery</p>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1"
            style={{ color: "var(--text-faint)" }}>{cat}</p>
          <div className="space-y-2">
            {ROUTINES.filter(r => r.category === cat).map((r) => {
              const locked = r.premium && !isPremium;
              return (
                <button key={r.id} type="button"
                  onClick={() => {
                    if (locked) { hapticLight(); window.location.href = "/app/settings/premium"; return; }
                    hapticMedium();
                    setActiveRoutine(r);
                  }}
                  className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)", opacity: locked ? 0.7 : 1 }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{r.name}</p>
                        {locked && <Lock size={12} style={{ color: "var(--text-faint)" }} />}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{r.description}</p>
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                          {r.duration}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--bg-card-hover)", color: "var(--text-faint)" }}>
                          {r.steps.length} moves
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
