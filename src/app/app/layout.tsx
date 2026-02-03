import type { ReactNode } from "react";
import { AppNav } from "@/app/app/_components/AppNav";
import { AuthGate } from "@/app/app/_components/AuthGate";
import { PasskeyGate } from "@/app/app/_components/PasskeyGate";
import { IosInstallPrompt } from "@/app/app/_components/IosInstallPrompt";
import { ThemeGate } from "@/app/app/_components/ThemeGate";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PasskeyGate>
      <AuthGate>
        <ThemeGate>
          <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
            <IosInstallPrompt />
            <div className="flex-1 p-4">{children}</div>
            <AppNav />
          </div>
        </ThemeGate>
      </AuthGate>
    </PasskeyGate>
  );
}
