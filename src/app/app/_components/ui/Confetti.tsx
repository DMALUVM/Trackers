"use client";

import { useEffect, useState } from "react";

const COLORS = ["#10b981", "#facc15", "#6366f1", "#f97316", "#06b6d4", "#ec4899", "#84cc16", "#ef4444"];

interface Particle {
  id: number;
  x: number;
  startY: number;
  color: string;
  emoji?: string;
  rotation: number;
  scale: number;
  delay: number;
  duration: number;
  drift: number;
}

function generate(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    startY: -5 - Math.random() * 15,
    color: COLORS[i % COLORS.length],
    emoji: i < 4 ? ["🎉", "✨", "💪", "🔥", "⚡", "🏆"][Math.floor(Math.random() * 6)] : undefined,
    rotation: Math.random() * 720 - 360,
    scale: 0.5 + Math.random() * 0.7,
    delay: Math.random() * 400,
    duration: 1200 + Math.random() * 800,
    drift: (Math.random() - 0.5) * 60,
  }));
}

export function ConfettiBurst({ trigger, count = 24 }: { trigger: boolean; count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setParticles(generate(count));
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setParticles([]); }, 2200);
    return () => clearTimeout(t);
  }, [trigger, count]);

  if (!visible || particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {particles.map((p) => (
        <div key={p.id} className="absolute" style={{
          left: `${p.x}%`,
          top: `${p.startY}%`,
          animationName: "confetti-fall-v2",
          animationDuration: `${p.duration}ms`,
          animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          animationDelay: `${p.delay}ms`,
          animationFillMode: "forwards",
          ["--confetti-drift" as string]: `${p.drift}px`,
          ["--confetti-rotate" as string]: `${p.rotation}deg`,
        }}>
          {p.emoji ? (
            <span style={{ fontSize: `${16 + p.scale * 12}px` }}>{p.emoji}</span>
          ) : (
            <div style={{
              width: `${6 + p.scale * 4}px`,
              height: `${6 + p.scale * 4}px`,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              background: p.color,
              transform: `scale(${p.scale})`,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}
