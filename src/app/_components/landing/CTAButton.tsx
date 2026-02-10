import Link from "next/link";

export function CTAButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href="/login" className={className}>
      {children}
    </Link>
  );
}
