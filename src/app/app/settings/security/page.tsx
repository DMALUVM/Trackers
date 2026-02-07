"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isPasskeyEnabled, registerPasskey, clearPasskey } from "@/lib/passkey";
import { supabase } from "@/lib/supabaseClient";
import { Toast, SubPageHeader, BottomSheet, type ToastState } from "@/app/app/_components/ui";
import { clearSessionCookies } from "@/lib/sessionCookie";
import { hapticLight, hapticHeavy } from "@/lib/haptics";

export default function SecurityPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>("idle");
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setEnabled(isPasskeyEnabled());
    void (async () => {
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user.email ?? null);
    })();
  }, []);

  const togglePasskey = async () => {
    if (enabled) {
      clearPasskey();
      setEnabled(false);
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
      return;
    }
    if (!email) return;
    setToast("saving");
    try {
      await registerPasskey({ email });
      setEnabled(true);
      setToast("saved");
      setTimeout(() => setToast("idle"), 1500);
    } catch {
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    hapticHeavy();
    try {
      clearPasskey();
      clearSessionCookies();
      await supabase.auth.signOut();
      // Clear all localStorage
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("routines365:"));
      keys.forEach((k) => localStorage.removeItem(k));
      router.replace("/");
    } catch {
      setSigningOut(false);
      setConfirmSignOut(false);
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <Toast state={toast} />
      <SubPageHeader title="Security" subtitle={email ? `Signed in as ${email}` : "Loading…"} backHref="/app/settings" />

      {/* Biometric lock */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Face ID / Touch ID</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {enabled ? "Enabled — asks for biometrics on open." : "Add a biometric lock to the app."}
            </p>
          </div>
          <button type="button" className={enabled ? "btn-primary text-xs py-2 px-4" : "btn-secondary text-xs py-2 px-4"} onClick={togglePasskey}>
            {enabled ? "Disable" : "Enable"}
          </button>
        </div>
      </section>

      {/* Account section */}
      <section>
        <p className="text-xs font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>Account</p>
        <div className="card p-4 space-y-4">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Email</p>
            <p className="text-sm mt-0.5 tabular-nums" style={{ color: "var(--text-muted)" }}>{email ?? "Loading…"}</p>
          </div>
          <button type="button" onClick={() => { hapticLight(); setConfirmSignOut(true); }}
            className="w-full rounded-xl py-3 text-sm font-semibold text-center transition-colors"
            style={{ background: "rgba(239,68,68,0.1)", color: "var(--accent-red-text)", border: "1px solid rgba(239,68,68,0.2)" }}>
            Sign out
          </button>
        </div>
      </section>

      {/* Sign out confirmation */}
      <BottomSheet open={confirmSignOut} onClose={() => setConfirmSignOut(false)} title="Sign out?">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Your data is saved in the cloud. You can sign back in anytime to pick up where you left off.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setConfirmSignOut(false)}
              className="btn-secondary text-sm py-3">
              Cancel
            </button>
            <button type="button" onClick={() => void handleSignOut()} disabled={signingOut}
              className="rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-60"
              style={{ background: "var(--accent-red)", color: "white" }}>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
