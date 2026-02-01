import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-neutral-50">
      <div className="flex-1 p-4">{children}</div>
      <nav className="sticky bottom-0 border-t bg-white">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 p-2 text-xs">
          <a className="rounded-lg px-3 py-2 text-center hover:bg-neutral-100" href="/app/routines">
            Routines
          </a>
          <a className="rounded-lg px-3 py-2 text-center hover:bg-neutral-100" href="/app/rowing">
            Rowing
          </a>
          <a className="rounded-lg px-3 py-2 text-center hover:bg-neutral-100" href="/app/neuro">
            Neuro
          </a>
          <a className="rounded-lg px-3 py-2 text-center hover:bg-neutral-100" href="/app/settings">
            Settings
          </a>
        </div>
      </nav>
    </div>
  );
}
