"use client";

export function CTAButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        document
          .getElementById("auth-section")
          ?.scrollIntoView({ behavior: "smooth" })
      }
      className={className}
    >
      {children}
    </button>
  );
}
