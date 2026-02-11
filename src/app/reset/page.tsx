"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { BrandIcon } from "@/app/app/_components/BrandIcon";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      setSignedInEmail(data.session?.user.email ?? null);
      setReady(true);
    };
    void run();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedInEmail(session?.user.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!password || password.length < 8) { setStatus("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setStatus("Passwords don't match."); return; }

    setBusy(true);
    setStatus("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("Password updated! You can now close this and sign in from the app.");
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-md px-6 py-10 space-y-6">
        <header className="text-center space-y-3">
          <div className="mx-auto" style={{ width: 64 }}><BrandIcon size={64} /></div>
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="text-sm text-neutral-400">
            {!ready ? "Loading…" : signedInEmail ? `Signed in as ${signedInEmail}` : "Open the reset link from your email."}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400">New password</label>
            <input className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="new-password" disabled={!signedInEmail}
              required minLength={8} />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400">Confirm password</label>
            <input className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
              type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••" autoComplete="new-password" disabled={!signedInEmail}
              required />
          </div>

          <button type="submit" disabled={!signedInEmail || busy}
            className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-black disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            {busy ? (
              <><span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin" /> Saving…</>
            ) : "Set new password"}
          </button>

          {status && (
            <p className={`text-xs ${status.includes("updated") ? "text-emerald-400" : "text-red-400"}`}>
              {status}
            </p>
          )}
        </form>

        <div className="text-center">
          <a className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors" href="/login">
            ← Back to sign in
          </a>
        </div>
      </div>
    </main>
  );
}
