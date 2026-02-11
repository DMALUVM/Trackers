"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isPasskeyEnabled, registerPasskey, clearPasskey } from "@/lib/passkey";
import { supabase } from "@/lib/supabaseClient";
import { Toast, SubPageHeader, BottomSheet, type ToastState } from "@/app/app/_components/ui";
import { clearSessionCookies } from "@/lib/sessionCookie";
import { hapticLight, hapticHeavy, hapticWarning } from "@/lib/haptics";

export default function SecurityPage() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>("idle");
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"confirm" | "typing" | "deleting">("confirm");
  const [deleteInput, setDeleteInput] = useState("");
  const [bioLabel, setBioLabel] = useState("Face ID / Touch ID");

  useEffect(() => {
    setEnabled(isPasskeyEnabled());
    void (async () => {
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user.email ?? null);
    })();
    void (async () => {
      try {
        const { getBiometryType } = await import("@/lib/passkey");
        const type = await getBiometryType();
        if (type === "faceID") setBioLabel("Face ID");
        else if (type === "touchID") setBioLabel("Touch ID");
        else if (type === "opticID") setBioLabel("Optic ID");
      } catch {}
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
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("routines365:"));
      keys.forEach((k) => localStorage.removeItem(k));
      router.replace("/login");
    } catch {
      setSigningOut(false);
      setConfirmSignOut(false);
      setToast("error");
      setTimeout(() => setToast("idle"), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteStep("deleting");
    hapticHeavy();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");
      const uid = session.user.id;

      // Delete all user data from every table
      await Promise.all([
        supabase.from("day_snoozes").delete().eq("user_id", uid),
        supabase.from("daily_checks").delete().eq("user_id", uid),
        supabase.from("daily_logs").delete().eq("user_id", uid),
        supabase.from("activity_logs").delete().eq("user_id", uid),
        supabase.from("reminders").delete().eq("user_id", uid),
        supabase.from("push_subscriptions").delete().eq("user_id", uid),
        supabase.from("weekly_goals").delete().eq("user_id", uid),
        supabase.from("routine_items").delete().eq("user_id", uid),
        supabase.from("user_settings").delete().eq("user_id", uid),
        supabase.from("partner_stats").delete().eq("user_id", uid),
        supabase.from("partnerships").delete().or(`user_a.eq.${uid},user_b.eq.${uid}`),
        supabase.from("profiles").delete().eq("id", uid),
      ]);

      // Delete auth.users record via server-side RPC (Apple Guideline 5.1.1v)
      const { error: rpcError } = await supabase.rpc("delete_own_account");
      if (rpcError) {
        console.error("delete_own_account RPC failed:", rpcError.message);
        // Don't throw — data is already deleted above, auth record may already
        // be gone from CASCADE. Continue with sign-out.
      }

      // Clear local data and sign out
      clearPasskey();
      clearSessionCookies();
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("routines365:"));
      keys.forEach((k) => localStorage.removeItem(k));
      await supabase.auth.signOut();
      router.replace("/login");
    } catch {
      setDeleteStep("confirm");
      setConfirmDelete(false);
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
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{bioLabel}</p>
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

      {/* Danger zone */}
      <section>
        <p className="text-xs font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>Danger Zone</p>
        <div className="card p-4">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Delete Account</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Permanently delete your account and all data — habits, streaks, journal entries, and activity logs. This cannot be undone.
          </p>
          <button type="button"
            onClick={() => { hapticWarning(); setConfirmDelete(true); setDeleteStep("confirm"); setDeleteInput(""); }}
            className="mt-3 w-full rounded-xl py-3 text-sm font-semibold text-center transition-colors"
            style={{ background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
            Delete my account
          </button>
        </div>
      </section>

      {/* Legal */}
      <section>
        <p className="text-xs font-bold tracking-wider uppercase mb-2 px-1" style={{ color: "var(--text-faint)" }}>Legal</p>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-primary)" }}>
          <a href="/privacy" target="_blank" rel="noopener"
            className="flex items-center justify-between px-4 py-3.5"
            style={{ background: "var(--bg-card)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Privacy Policy</p>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>↗</span>
          </a>
          <a href="/terms" target="_blank" rel="noopener"
            className="flex items-center justify-between px-4 py-3.5"
            style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-secondary)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Terms of Service</p>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>↗</span>
          </a>
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

      {/* Delete account confirmation — two-step */}
      <BottomSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Account">
        <div className="space-y-4">
          {deleteStep === "confirm" && (
            <>
              <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>⚠️ This is permanent</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  All your habits, streaks, journal entries, activity logs, and settings will be permanently deleted. Your subscription (if any) will not be automatically cancelled — manage it in your Apple ID settings.
                </p>
              </div>
              <button type="button"
                onClick={() => setDeleteStep("typing")}
                className="w-full rounded-xl py-3 text-sm font-bold transition-colors"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                I understand, continue
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="btn-secondary w-full text-sm py-3">
                Cancel
              </button>
            </>
          )}
          {deleteStep === "typing" && (
            <>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Type <strong style={{ color: "#ef4444" }}>DELETE</strong> to confirm:
              </p>
              <input
                className="w-full rounded-xl px-4 py-3 text-sm"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                autoFocus
              />
              <button type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deleteInput !== "DELETE"}
                className="w-full rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-40"
                style={{ background: "#ef4444", color: "white" }}>
                Permanently delete my account
              </button>
              <button type="button" onClick={() => { setDeleteStep("confirm"); setDeleteInput(""); }}
                className="btn-secondary w-full text-sm py-3">
                Go back
              </button>
            </>
          )}
          {deleteStep === "deleting" && (
            <div className="text-center py-6">
              <div className="animate-spin mx-auto mb-3" style={{ width: 24, height: 24, border: "3px solid var(--border-primary)", borderTopColor: "#ef4444", borderRadius: "50%" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Deleting your account…</p>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
