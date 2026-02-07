/**
 * Routines365 brand icon — the 7-unit vertical stack.
 *
 * Top bar = outlined white (today / empty day).
 * 6 filled bars below = stacked green days, light→dark.
 *
 * Brand spec: Inter Tight · Emerald green + white on black.
 */
export function BrandIcon({ size = 80, className }: { size?: number; className?: string }) {
  // 7 bars × 9 tall + 6 gaps × 4 = 87 total height, 44 wide
  const W = 44;
  const H = 9;
  const GAP = 4;
  const RX = 3;
  const SW = 2.5;
  const totalH = 7 * H + 6 * GAP; // 87

  const fills = [null, "#bef264", "#86efac", "#4ade80", "#34d399", "#10b981", "#059669"];

  return (
    <svg
      width={size}
      height={size * (totalH / W)}
      viewBox={`0 0 ${W} ${totalH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Routines365 icon"
    >
      {fills.map((fill, i) => {
        const y = i * (H + GAP);
        if (!fill) {
          // Outlined bar
          return (
            <rect key={i}
              x={SW / 2} y={y + SW / 2}
              width={W - SW} height={H - SW}
              rx={RX} fill="none" stroke="#fff" strokeWidth={SW}
            />
          );
        }
        return <rect key={i} x={0} y={y} width={W} height={H} rx={RX} fill={fill} />;
      })}
    </svg>
  );
}

/** Brand bar colors for programmatic use (e.g., OG images). */
export const BRAND_BAR_COLORS = [
  "#bef264", "#86efac", "#4ade80", "#34d399", "#10b981", "#059669",
] as const;
