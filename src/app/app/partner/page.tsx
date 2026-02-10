"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Users, Heart, Flame, Trophy, Send, UserPlus } from "lucide-react";
import { SubPageHeader } from "@/app/app/_components/ui";
import { hapticLight, hapticMedium, hapticHeavy } from "@/lib/haptics";
import {
  getMyPartnership,
  createInvite,
  acceptInvite,
  sendCheer,
  getRecentCheers,
  endPartnership,
  type Partnership,
} from "@/lib/partner";

// ── No Partner State ──

function NoPartner({ onCreated }: { onCreated: () => void }) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const c = await createInvite(name.trim());
      setInviteCode(c);
      hapticMedium();
    } catch {
      setError("Failed to create invite. Try again.");
      hapticHeavy();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      hapticLight();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const handleShareCode = async () => {
    if (!inviteCode) return;
    hapticMedium();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Be my accountability partner!",
          text: `Join me on Routines365! Use code: ${inviteCode}`,
        });
      } catch { /* cancelled */ }
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const ok = await acceptInvite(code.trim(), name.trim());
      if (ok) {
        hapticHeavy();
        onCreated();
      } else {
        setError("Invalid code or already used. Check and try again.");
        hapticHeavy();
      }
    } catch {
      setError("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "choose") {
    return (
      <div className="space-y-4 pt-4">
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--accent-green-soft)" }}>
            <Users size={32} style={{ color: "var(--accent-green)" }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Accountability Partner</h2>
          <p className="text-sm mt-2 px-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Connect with one person who sees your streak and cheers you on.
            People with an accountability partner are <strong style={{ color: "var(--text-primary)" }}>65% more likely</strong> to reach their goals.
          </p>
        </div>

        <button type="button" onClick={() => { setMode("create"); hapticLight(); }}
          className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent-green-soft)" }}>
              <Send size={18} style={{ color: "var(--accent-green)" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Invite someone</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>Share a code with a friend or family member</p>
            </div>
          </div>
        </button>

        <button type="button" onClick={() => { setMode("join"); hapticLight(); }}
          className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.1)" }}>
              <UserPlus size={18} style={{ color: "#6366f1" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>I have a code</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>Enter a code from your partner</p>
            </div>
          </div>
        </button>
      </div>
    );
  }

  if (mode === "create" && inviteCode) {
    return (
      <div className="space-y-4 pt-4 text-center">
        <div className="text-4xl mb-2">🤝</div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Your invite code</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Share this code with your partner</p>

        <div className="rounded-2xl p-5 flex items-center justify-center gap-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <span className="text-3xl font-mono font-black tracking-[0.3em]" style={{ color: "var(--accent-green)" }}>
            {inviteCode}
          </span>
          <button type="button" onClick={handleCopy}
            className="tap-btn p-2 rounded-full" style={{ background: "var(--bg-card-hover)" }}>
            {copied ? <Check size={18} style={{ color: "var(--accent-green)" }} /> : <Copy size={18} style={{ color: "var(--text-muted)" }} />}
          </button>
        </div>

        <button type="button" onClick={handleShareCode}
          className="w-full py-3 rounded-2xl text-sm font-bold"
          style={{ background: "var(--accent-green)", color: "var(--text-inverse)" }}>
          Share with Partner
        </button>

        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Waiting for your partner to enter this code...
        </p>

        <button type="button" onClick={() => { setMode("choose"); setInviteCode(null); hapticLight(); }}
          className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>
          ← Back
        </button>
      </div>
    );
  }

  // Create or Join form
  return (
    <div className="space-y-4 pt-4">
      <button type="button" onClick={() => { setMode("choose"); hapticLight(); }}
        className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>
        ← Back
      </button>

      <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        {mode === "create" ? "Create your invite" : "Join a partner"}
      </h2>

      <div>
        <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--text-muted)" }}>
          Your display name
        </label>
        <input
          type="text" value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Dave"
          maxLength={20}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium"
          style={{
            background: "var(--bg-card)", border: "1px solid var(--border-primary)",
            color: "var(--text-primary)", outline: "none",
          }}
          autoCorrect="off"
          enterKeyHint="next"
        />
      </div>

      {mode === "join" && (
        <div>
          <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--text-muted)" }}>
            Partner's invite code
          </label>
          <input
            type="text" value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., A3B7K9"
            maxLength={6}
            className="w-full rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-[0.2em] text-center"
            style={{
              background: "var(--bg-card)", border: "1px solid var(--border-primary)",
              color: "var(--text-primary)", outline: "none",
            }}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
          />
          <p className="text-[10px] mt-1 text-center" style={{ color: "var(--text-faint)" }}>
            Case doesn't matter
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-center" style={{ color: "var(--accent-red)" }}>{error}</p>
      )}

      <button type="button" disabled={loading || !name.trim() || (mode === "join" && !code.trim())}
        onClick={mode === "create" ? handleCreate : handleJoin}
        className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all"
        style={{
          background: "var(--accent-green)", color: "var(--text-inverse)",
          opacity: loading || !name.trim() ? 0.5 : 1,
        }}>
        {loading ? "Connecting..." : mode === "create" ? "Generate Code" : "Connect"}
      </button>
    </div>
  );
}

// ── Active Partner View ──

function ActivePartner({ partnership, onRefresh }: { partnership: Partnership; onRefresh: () => void }) {
  const [cheered, setCheered] = useState(false);
  const [cheerCount, setCheerCount] = useState(0);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    void getRecentCheers().then(setCheerCount);
  }, []);

  const handleCheer = async () => {
    const partnerId = partnership.user_id === partnership.partner_id
      ? partnership.user_id : (partnership.partner_id ?? partnership.user_id);
    hapticHeavy();
    setCheered(true);
    await sendCheer(partnerId);
    setTimeout(() => setCheered(false), 3000);
  };

  const handleEnd = async () => {
    hapticHeavy();
    await endPartnership(partnership.id);
    onRefresh();
  };

  const todayPct = partnership.partner_today_total
    ? Math.round(((partnership.partner_today_done ?? 0) / partnership.partner_today_total) * 100)
    : 0;

  return (
    <div className="space-y-4 pt-2">
      {/* Cheers received */}
      {cheerCount > 0 && (
        <div className="rounded-2xl p-3 text-center"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <span className="text-sm font-bold" style={{ color: "#ef4444" }}>
            ❤️ {cheerCount} cheer{cheerCount > 1 ? "s" : ""} from your partner today!
          </span>
        </div>
      )}

      {/* Partner card */}
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ background: "var(--accent-green-soft)" }}>
            {(partnership.partner_name ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {partnership.partner_name ?? "Partner"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Last active: {partnership.partner_last_active ?? "—"}
            </p>
          </div>
        </div>

        {/* Partner streak */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "var(--bg-card-hover)" }}>
            <Flame size={20} className="mx-auto mb-1" style={{ color: "#ef4444" }} />
            <p className="text-2xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
              {partnership.partner_streak ?? 0}
            </p>
            <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>STREAK</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: "var(--bg-card-hover)" }}>
            <Trophy size={20} className="mx-auto mb-1" style={{ color: "#f59e0b" }} />
            <p className="text-2xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>
              {partnership.partner_best_streak ?? 0}
            </p>
            <p className="text-[10px] font-bold" style={{ color: "var(--text-faint)" }}>BEST</p>
          </div>
        </div>

        {/* Today's progress */}
        <div className="mb-4">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Today's progress</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {partnership.partner_today_done ?? 0}/{partnership.partner_today_total ?? 0}
            </span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-card-hover)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${todayPct}%`,
              background: todayPct >= 80 ? "var(--accent-green)" : todayPct >= 50 ? "var(--accent-yellow)" : "var(--accent-red)",
            }} />
          </div>
        </div>

        {/* Cheer button */}
        <button type="button" onClick={handleCheer} disabled={cheered}
          className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
          style={{
            background: cheered ? "rgba(239,68,68,0.1)" : "var(--accent-green)",
            color: cheered ? "#ef4444" : "var(--text-inverse)",
          }}>
          <Heart size={16} fill={cheered ? "#ef4444" : "none"} />
          {cheered ? "Cheer sent! 🎉" : "Send a cheer"}
        </button>
      </div>

      {/* End partnership */}
      {!showEnd ? (
        <button type="button" onClick={() => setShowEnd(true)}
          className="w-full text-center text-xs py-2" style={{ color: "var(--text-faint)" }}>
          End partnership
        </button>
      ) : (
        <div className="rounded-2xl p-4 text-center space-y-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--accent-red)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>End this partnership?</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Both of you will lose access to each other's progress.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowEnd(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: "var(--bg-card-hover)", color: "var(--text-muted)" }}>
              Cancel
            </button>
            <button type="button" onClick={handleEnd}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              End it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pending State ──

function PendingPartner({ partnership, onRefresh }: { partnership: Partnership; onRefresh: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(partnership.invite_code);
      setCopied(true);
      hapticLight();
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-4 pt-4 text-center">
      <div className="animate-pulse text-4xl">⏳</div>
      <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Waiting for your partner</h2>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Share this code and wait for them to connect
      </p>

      <div className="rounded-2xl p-5 flex items-center justify-center gap-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
        <span className="text-3xl font-mono font-black tracking-[0.3em]" style={{ color: "var(--accent-green)" }}>
          {partnership.invite_code}
        </span>
        <button type="button" onClick={handleCopy}
          className="tap-btn p-2 rounded-full" style={{ background: "var(--bg-card-hover)" }}>
          {copied ? <Check size={18} style={{ color: "var(--accent-green)" }} /> : <Copy size={18} style={{ color: "var(--text-muted)" }} />}
        </button>
      </div>

      <button type="button" onClick={() => { hapticLight(); onRefresh(); }}
        className="text-sm font-medium" style={{ color: "var(--accent-green)" }}>
        Refresh status
      </button>

      <button type="button" onClick={async () => { await endPartnership(partnership.id); hapticLight(); onRefresh(); }}
        className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>
        Cancel invite
      </button>
    </div>
  );
}

// ── Main Page ──

export default function PartnerPage() {
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [loading, setLoading] = useState(true);
  const [tablesExist, setTablesExist] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getMyPartnership();
      setPartnership(p);
    } catch (err) {
      // If tables don't exist yet, show setup message
      const msg = String(err);
      if (msg.includes("relation") || msg.includes("does not exist") || msg.includes("42P01")) {
        setTablesExist(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <div className="space-y-4">
      <SubPageHeader title="Accountability Partner" subtitle="Stay consistent together" />

      {loading && (
        <div className="py-12 text-center">
          <div className="animate-spin w-6 h-6 border-2 rounded-full mx-auto"
            style={{ borderColor: "var(--text-faint)", borderTopColor: "var(--accent-green)" }} />
        </div>
      )}

      {!loading && !tablesExist && (
        <div className="py-8 text-center rounded-2xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
          <p className="text-3xl mb-3">🔧</p>
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Coming soon!</p>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            The accountability partner feature is being set up. Check back soon!
          </p>
        </div>
      )}

      {!loading && tablesExist && !partnership && (
        <NoPartner onCreated={refresh} />
      )}

      {!loading && tablesExist && partnership?.status === "pending" && (
        <PendingPartner partnership={partnership} onRefresh={refresh} />
      )}

      {!loading && tablesExist && partnership?.status === "active" && (
        <ActivePartner partnership={partnership} onRefresh={refresh} />
      )}
    </div>
  );
}
