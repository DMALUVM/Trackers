// ══════════════════════════════════════════════════════════
// ACCOUNTABILITY PARTNER — Data Layer
// ══════════════════════════════════════════════════════════
// Simple 1:1 partner system. Each user can have one partner.
// They see each other's current streak, today's progress,
// and can send "cheers" (push-notification ready).
//
// Requires Supabase tables: partnerships, partner_cheers
// See /supabase/partner-migration.sql
// ══════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";
import { getUserId } from "@/lib/supabaseData";

export interface Partnership {
  id: string;
  user_id: string;
  partner_id: string | null;
  invite_code: string;
  status: "pending" | "active" | "ended";
  created_at: string;
  /** Populated from partner_stats join */
  partner_name?: string;
  partner_streak?: number;
  partner_best_streak?: number;
  partner_today_done?: number;
  partner_today_total?: number;
  partner_last_active?: string;
}

export interface PartnerStats {
  user_id: string;
  display_name: string;
  current_streak: number;
  best_streak: number;
  today_done: number;
  today_total: number;
  last_active: string;
}

// ── Invite Code ──

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Get or Create Partnership ──

export async function getMyPartnership(): Promise<Partnership | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("partnerships")
    .select("*")
    .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  // If we have an active partner, fetch their stats
  const partnerId = data.user_id === userId ? data.partner_id : data.user_id;
  if (partnerId && data.status === "active") {
    const { data: stats } = await supabase
      .from("partner_stats")
      .select("*")
      .eq("user_id", partnerId)
      .single();

    if (stats) {
      return {
        ...data,
        partner_name: stats.display_name,
        partner_streak: stats.current_streak,
        partner_best_streak: stats.best_streak,
        partner_today_done: stats.today_done,
        partner_today_total: stats.today_total,
        partner_last_active: stats.last_active,
      };
    }
  }

  return data;
}

// ── Create Invite ──

export async function createInvite(displayName: string): Promise<string> {
  const userId = await getUserId();
  const code = generateCode();

  // Upsert my stats
  await supabase.from("partner_stats").upsert({
    user_id: userId,
    display_name: displayName,
    current_streak: 0,
    best_streak: 0,
    today_done: 0,
    today_total: 0,
    last_active: new Date().toISOString().slice(0, 10),
  });

  // Create partnership with invite code
  const { error } = await supabase.from("partnerships").insert({
    user_id: userId,
    invite_code: code,
    status: "pending",
  });

  if (error) throw error;
  return code;
}

// ── Accept Invite ──

export async function acceptInvite(code: string, displayName: string): Promise<boolean> {
  const userId = await getUserId();

  // Find the pending partnership
  const { data: partnership, error: findErr } = await supabase
    .from("partnerships")
    .select("*")
    .eq("invite_code", code.toUpperCase().trim())
    .eq("status", "pending")
    .single();

  if (findErr || !partnership) return false;
  if (partnership.user_id === userId) return false; // Can't partner with yourself

  // Upsert my stats
  await supabase.from("partner_stats").upsert({
    user_id: userId,
    display_name: displayName,
    current_streak: 0,
    best_streak: 0,
    today_done: 0,
    today_total: 0,
    last_active: new Date().toISOString().slice(0, 10),
  });

  // Activate the partnership
  const { error } = await supabase
    .from("partnerships")
    .update({ partner_id: userId, status: "active" })
    .eq("id", partnership.id);

  return !error;
}

// ── Update My Stats (call after completing habits) ──

export async function updateMyPartnerStats(stats: {
  currentStreak: number;
  bestStreak: number;
  todayDone: number;
  todayTotal: number;
}) {
  const userId = await getUserId();

  await supabase.from("partner_stats").upsert({
    user_id: userId,
    current_streak: stats.currentStreak,
    best_streak: stats.bestStreak,
    today_done: stats.todayDone,
    today_total: stats.todayTotal,
    last_active: new Date().toISOString().slice(0, 10),
  });
}

// ── Send Cheer ──

export async function sendCheer(partnerId: string): Promise<boolean> {
  const userId = await getUserId();

  const { error } = await supabase.from("partner_cheers").insert({
    from_user_id: userId,
    to_user_id: partnerId,
  });

  return !error;
}

// ── Get Recent Cheers ──

export async function getRecentCheers(): Promise<number> {
  const userId = await getUserId();
  const since = new Date();
  since.setHours(since.getHours() - 24);

  const { count } = await supabase
    .from("partner_cheers")
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", userId)
    .gte("created_at", since.toISOString());

  return count ?? 0;
}

// ── End Partnership ──

export async function endPartnership(partnershipId: string): Promise<boolean> {
  const { error } = await supabase
    .from("partnerships")
    .update({ status: "ended" })
    .eq("id", partnershipId);

  return !error;
}
