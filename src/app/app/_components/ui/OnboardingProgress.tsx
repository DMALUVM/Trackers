"use client";

const STEPS = [
  { label: "Goal" },
  { label: "Template" },
  { label: "Core" },
  { label: "Finish" },
];

interface OnboardingProgressProps {
  /** Current step (1-based: 1=Goal, 2=Template, 3=Core, 4=Addons/Finish) */
  current: number;
}

export function OnboardingProgress({ current }: OnboardingProgressProps) {
  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < current;
          const isCurrent = stepNum === current;
          return (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-500"
              style={{
                background: isCompleted || isCurrent
                  ? "var(--accent-green)"
                  : "var(--bg-card-hover)",
                opacity: isCompleted ? 0.5 : 1,
              }}
            />
          );
        })}
      </div>
      {/* Step label */}
      <p className="text-[11px] font-semibold tracking-wide" style={{ color: "var(--text-faint)" }}>
        Step {current} of {STEPS.length} · {STEPS[current - 1]?.label}
      </p>
    </div>
  );
}
