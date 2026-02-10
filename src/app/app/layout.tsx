import type { ReactNode } from "react";
import { AppNav } from "@/app/app/_components/AppNav";
import { AuthGate } from "@/app/app/_components/AuthGate";
import { PasskeyGate } from "@/app/app/_components/PasskeyGate";
import { IosInstallPrompt } from "@/app/app/_components/IosInstallPrompt";
import { ThemeGate } from "@/app/app/_components/ThemeGate";
import { ErrorBoundary } from "@/app/app/_components/ErrorBoundary";
import { SettingsGear } from "@/app/app/_components/SettingsGear";
import { GlobalPullToRefresh } from "@/app/app/_components/GlobalPullToRefresh";
import { PageTint } from "@/app/app/_components/PageTint";
import { PremiumProvider } from "@/lib/premium";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PasskeyGate>
      <AuthGate>
        <ThemeGate>
          <PremiumProvider>
            <PageTint />
            <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
              <IosInstallPrompt />
              <SettingsGear />
              <main className="flex-1 px-4 pt-safe pb-2">
                <GlobalPullToRefresh>
                  <ErrorBoundary>{children}</ErrorBoundary>
                </GlobalPullToRefresh>
              </main>
              <AppNav />
            </div>
          </PremiumProvider>
        </ThemeGate>
      </AuthGate>
    </PasskeyGate>
  );
}
