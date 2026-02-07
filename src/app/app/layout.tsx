import type { ReactNode } from "react";
import { AppNav } from "@/app/app/_components/AppNav";
import { AuthGate } from "@/app/app/_components/AuthGate";
import { PasskeyGate } from "@/app/app/_components/PasskeyGate";
import { IosInstallPrompt } from "@/app/app/_components/IosInstallPrompt";
import { ThemeGate } from "@/app/app/_components/ThemeGate";
import { ErrorBoundary } from "@/app/app/_components/ErrorBoundary";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PasskeyGate>
      <AuthGate>
        <ThemeGate>
          <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
            <IosInstallPrompt />
            <main className="flex-1 px-4 pt-safe pb-2">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <AppNav />
          </div>
        </ThemeGate>
      </AuthGate>
    </PasskeyGate>
  );
}
