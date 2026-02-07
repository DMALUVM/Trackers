"use client";

import { useEffect, useState } from "react";

const CONFETTI_COLORS = [
  "#10b981", "#facc15", "#ef4444", "#6366f1", "#f97316",
  "#06b6d4", "#ec4899", "#84cc16",
];

const EMOJIS = ["🎉", "✨", "🔥", "⚡", "💪", "🏆", "🌟", "💯"];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  emoji?: string;
  rotation: number;
  scale: number;
  delay: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40, // spread across 30-70% of width
    y: -10,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    emoji: i < 3 ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : undefined,
    rotation: Math.random() * 360,
    scale: 0.6 + Math.random() * 0.6,
    delay: Math.random() * 300,
  }));
}

interface ConfettiBurstProps {
  /** Set to true to trigger the burst */
  trigger: boolean;
  /** How many particles */
  count?: number;
}

export function ConfettiBurst({ trigger, count = 16 }: ConfettiBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setParticles(generateParticles(count));
    setVisible(true);

    const t = setTimeout(() => {
      setVisible(false);
      setParticles([]);
    }, 1200);

    return () => clearTimeout(t);
  }, [trigger, count]);

  if (!visible || particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: "40%",
            animation: `confetti-fall ${0.6 + Math.random() * 0.4}s ease-out ${p.delay}ms forwards`,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
          }}
        >
          {p.emoji ? (
            <span className="text-2xl">{p.emoji}</span>
          ) : (
            <div
              className="h-2 w-2 rounded-sm"
              style={{ background: p.color }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
