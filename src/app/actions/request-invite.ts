"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { validateInvite } from "@/lib/validate-invite";

/**
 * Server action for the private-group invite form. Backend only — the form is
 * not wired to it yet (Task 3 of docs/handoffs/private-group-invite-task-1.md).
 *
 * Flow: honeypot + time-gate (silent drop) → validation → best-effort IP rate
 * limit → email the owner via Resend. CSRF is covered by Next server actions
 * (POST-only + same-origin enforcement). Env-dormant like the rest of the
 * stack: with RESEND_API_KEY unset it fails soft with a friendly error.
 */

export type InviteResult = { ok: true } | { ok: false; error: string };

const MIN_FILL_MS = 3_000; // submissions faster than this are bots
const RATE_LIMIT = 3; // sends per IP…
const RATE_WINDOW_MS = 60 * 60 * 1_000; // …per hour

// Best-effort, per-instance (serverless caveat documented in the handoff).
const recentByIp = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recentByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    recentByIp.set(ip, hits);
    return true;
  }
  hits.push(now);
  recentByIp.set(ip, hits);
  // Opportunistic cleanup so the map can't grow unbounded.
  if (recentByIp.size > 1_000) {
    for (const [k, v] of recentByIp) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) recentByIp.delete(k);
    }
  }
  return false;
}

export async function requestInvite(formData: FormData): Promise<InviteResult> {
  // Honeypot: humans never see/fill this field. Pretend success so bots move on.
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.trim() !== "") return { ok: true };

  // Time-gate: the form reports how long it was on screen before submit,
  // measured entirely on the client clock (a client *timestamp* compared with
  // the server clock would silently drop visitors with skewed device clocks).
  // Only enforced when present, so direct POSTs without the field still work.
  // Sub-3s fills are bots — silent drop.
  const elapsedRaw = formData.get("elapsedMs");
  if (typeof elapsedRaw === "string" && elapsedRaw.trim() !== "") {
    const elapsedMs = Number(elapsedRaw);
    if (Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs < MIN_FILL_MS) {
      return { ok: true };
    }
  }

  const validated = validateInvite(formData.get("username"), formData.get("email"));
  if (!validated.ok) return { ok: false, error: validated.error };
  const { username, email } = validated;

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "";

  if (ip && rateLimited(ip)) {
    return { ok: false, error: "Too many requests from your connection — try again in an hour." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.INVITE_NOTIFY_TO;
  if (!apiKey || !notifyTo) {
    console.error("requestInvite: RESEND_API_KEY / INVITE_NOTIFY_TO not configured");
    return { ok: false, error: "Invite requests are temporarily unavailable — DM on Instagram instead." };
  }

  const now = new Date();
  const skopje = now.toLocaleString("en-GB", { timeZone: "Europe/Skopje", hour12: false });

  const text = [
    `${username} requested access to your Inner Circle.`,
    "",
    `Username:  ${username}`,
    `Email:     ${email}`,
    `Timestamp: ${now.toISOString()} (UTC) · ${skopje} (Skopje)`,
    `IP:        ${ip || "unavailable"}`,
    "",
    "— lukarajhl.com invite form (reply to answer the requester directly)",
  ].join("\n");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.INVITE_FROM || "Inner Circle <onboarding@resend.dev>",
      to: notifyTo,
      replyTo: email,
      subject: `${username} would like to join your Inner Circle`,
      text,
    });
    if (error) {
      console.error("requestInvite: Resend error", error);
      return { ok: false, error: "Could not send your request — please try again later." };
    }
  } catch (err) {
    console.error("requestInvite: send failed", err);
    return { ok: false, error: "Could not send your request — please try again later." };
  }

  return { ok: true };
}
