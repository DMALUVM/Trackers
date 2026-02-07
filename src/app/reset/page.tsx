"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      // With detectSessionInUrl enabled, Supabase should turn the recovery link into a session.
      const { data } = await supabase.auth.getSession();
      setSignedInEmail(data.session?.user.email ?? null);
      setReady(true);
    };
    void run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedInEmail(session?.user.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setNewPassword = async () => {
    if (saving) return;
    if (!password || password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }

    setSaving(true);
    setStatus("Saving new password...");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("Password updated. Taking you to the app...");
      setTimeout(() => router.replace("/app/today"), 500);
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-md px-6 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm text-neutral-300">
            {ready
              ? signedInEmail
                ? `Signed in as ${signedInEmail}`
                : "Open the reset link from your email to continue."
              : "Loading..."}
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300">New password</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white placeholder:text-neutral-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={!signedInEmail}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300">Confirm password</label>
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-white placeholder:text-neutral-500"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={!signedInEmail}
            />
          </div>

          <button
            type="button"
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
            onClick={setNewPassword}
            disabled={!signedInEmail || saving}
          >
            {saving ? "Saving..." : "Set new password"}
          </button>

          {status ? <p className="text-xs text-neutral-400">{status}</p> : null}
        </section>

        <a className="text-sm text-neutral-300 underline" href="/">
          Back to sign in
        </a>
      </div>
    </main>
  );
}
