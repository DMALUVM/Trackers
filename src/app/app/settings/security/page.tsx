"use client";

import { useEffect, useState } from "react";
import { isPasskeyEnabled, registerPasskey, clearPasskey } from "@/lib/passkey";
import { supabase } from "@/lib/supabaseClient";
import { Toast, type ToastState } from "@/app/app/_components/ui";

export default function SecurityPage() {
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>("idle");

  useEffect(() => {
    setEnabled(isPasskeyEnabled());
    void (async () => {
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user.email ?? null);
    })();
  }, []);

  const toggle = async () => {
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

  return (
    <div className="space-y-5">
      <Toast state={toast} />
      <header>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Security</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {email ? `Signed in as ${email}` : "Loading…"}
        </p>
      </header>
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Face ID / Touch ID</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {enabled ? "Enabled — the app will ask for biometrics on open." : "Add a biometric lock to the app."}
            </p>
          </div>
          <button type="button" className={enabled ? "btn-primary text-xs py-2 px-4" : "btn-secondary text-xs py-2 px-4"} onClick={toggle}>
            {enabled ? "Disable" : "Enable"}
          </button>
        </div>
      </section>
    </div>
  );
}
