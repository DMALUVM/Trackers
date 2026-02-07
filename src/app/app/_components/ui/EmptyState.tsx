"use client";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  emoji = "📭",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`card p-8 text-center animate-fade-in-up ${className}`}>
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      {(actionLabel && actionHref) && (
        <a
          href={actionHref}
          className="btn-primary inline-block mt-4 text-sm"
        >
          {actionLabel}
        </a>
      )}
      {(actionLabel && onAction && !actionHref) && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary mt-4 text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
