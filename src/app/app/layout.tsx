import type { ReactNode } from "react";
import { AppNav } from "@/app/app/_components/AppNav";
import { PasskeyGate } from "@/app/app/_components/PasskeyGate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PasskeyGate>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-neutral-950 text-white">
        <div className="flex-1 p-4">{children}</div>
        <AppNav />
      </div>
    </PasskeyGate>
  );
}
