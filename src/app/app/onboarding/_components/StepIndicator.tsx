"use client";

/**
 * Onboarding step indicator — shows progress through setup flow.
 *
 * Psychology: Zeigarnik effect — people remember incomplete tasks.
 * Showing step 2/4 creates tension that drives completion.
 */
export function StepIndicator({
  currentStep,
  totalSteps = 4,
}: {
  currentStep: number;
  totalSteps?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <div
            key={step}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              background: isDone || isActive ? "var(--accent-green)" : "var(--bg-card-hover)",
              opacity: isActive ? 1 : isDone ? 0.6 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}
