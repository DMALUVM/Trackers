"use client";

import { useCallback, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { hapticMedium } from "@/lib/haptics";
import type { StreakData } from "@/lib/hooks";

interface ShareCardProps {
  streaks: StreakData;
  greenPct: number;
  greenDays: number;
  totalDays: number;
  last7: Array<{ color: "green" | "yellow" | "red" | "empty" }>;
}

export function ShareCard({ streaks, greenPct, greenDays, totalDays, last7 }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const W = 600, H = 400;
    const dpr = 2;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0a0f1a");
    grad.addColorStop(1, "#111827");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle border (manual rounded rect for TS compat)
    const r = 16, bx = 4, by = 4, bw = W - 8, bh = H - 8;
    ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + bw - r, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
    ctx.lineTo(bx + bw, by + bh - r);
    ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
    ctx.lineTo(bx + r, by + bh);
    ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
    ctx.lineTo(bx, by + r);
    ctx.arcTo(bx, by, bx + r, by, r);
    ctx.closePath();
    ctx.stroke();

    // Header
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 14px -apple-system, system-ui, sans-serif";
    ctx.fillText("ROUTINES365", 32, 42);

    // Main stat
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px -apple-system, system-ui, sans-serif";
    ctx.fillText(`${greenPct}%`, 32, 130);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "500 16px -apple-system, system-ui, sans-serif";
    ctx.fillText("consistency score", 32, 155);

    // Stats row
    const stats = [
      { val: `${streaks.activeStreak || streaks.currentStreak}`, label: "day streak" },
      { val: `${streaks.bestStreak}`, label: "best streak" },
      { val: `${greenDays}`, label: "green days" },
    ];

    stats.forEach((s, i) => {
      const x = 32 + i * 180;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px -apple-system, system-ui, sans-serif";
      ctx.fillText(s.val, x, 220);
      ctx.fillStyle = "#6b7280";
      ctx.font = "500 13px -apple-system, system-ui, sans-serif";
      ctx.fillText(s.label, x, 242);
    });

    // Week dots
    const dotColors: Record<string, string> = {
      green: "#10b981",
      yellow: "#f59e0b",
      red: "#ef4444",
      empty: "#374151",
    };

    ctx.fillStyle = "#6b7280";
    ctx.font = "600 12px -apple-system, system-ui, sans-serif";
    ctx.fillText("LAST 7 DAYS", 32, 295);

    last7.forEach((d, i) => {
      const x = 32 + i * 44;
      ctx.fillStyle = dotColors[d.color] ?? "#374151";
      ctx.beginPath();
      ctx.arc(x + 14, 320, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    // Footer
    ctx.fillStyle = "#374151";
    ctx.font = "400 12px -apple-system, system-ui, sans-serif";
    ctx.fillText("Track your habits · routines365.com", 32, H - 20);

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), "image/png");
    });
  }, [greenPct, greenDays, totalDays, streaks, last7]);

  const handleShare = async () => {
    setGenerating(true);
    hapticMedium();
    try {
      const blob = await generate();
      if (!blob) return;

      const file = new File([blob], "routines365-progress.png", { type: "image/png" });

      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        try {
          // Share image ONLY — including text causes iOS to drop the image
          await navigator.share({ files: [file] });
          return;
        } catch { /* user cancelled or fallback */ }
      }

      // Download fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "routines365-progress.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <button type="button" onClick={handleShare} disabled={generating}
        className="card-interactive flex items-center justify-center gap-2 px-4 py-3.5 w-full"
        style={{ opacity: generating ? 0.6 : 1 }}>
        <Share2 size={16} style={{ color: "var(--text-muted)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {generating ? "Generating..." : "Share Your Progress"}
        </span>
      </button>
    </>
  );
}
