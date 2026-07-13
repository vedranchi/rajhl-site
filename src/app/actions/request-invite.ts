"use server";

import { headers } from "next/headers";
import { validateInvite } from "@/lib/validate-invite";
import { getPayloadClient } from "@/lib/payload";

/**
 * Server action for the private-group invite form.
 *
 * Flow: honeypot + time-gate (silent drop) → validation → durable IP rate
 * limit (Postgres, via the invite-requests collection) → persist the lead. CSRF
 * is covered by Next server actions (POST-only + same-origin enforcement).
 *
 * The owner email + status lifecycle (emailed/email_failed/duplicate) now live
 * in the collection's `afterChange` hook, which runs synchronously inside
 * `payload.create` — so a lead is always stored (even if the send later fails,
 * it's marked `email_failed` for admin resend) and the action never sends email
 * itself. The env guard below stays only to surface a friendlier "temporarily
 * unavailable" message when Resend is unconfigured. See §5/§15.1 of
 * docs/plans/private-group-invite-payload-plan.md.
 */

export type InviteResult = { ok: true } | { ok: false; error: string };

const MIN_FILL_MS = 3_000; // submissions faster than this are bots
const RATE_LIMIT = Number(process.env.INVITE_RATE_LIMIT) || 3; // creates per IP…
const RATE_WINDOW_MS = Number(process.env.INVITE_RATE_WINDOW_MS) || 60 * 60 * 1_000; // …per hour

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
  let elapsedMs: number | undefined;
  if (typeof elapsedRaw === "string" && elapsedRaw.trim() !== "") {
    const parsed = Number(elapsedRaw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      if (parsed < MIN_FILL_MS) return { ok: true };
      elapsedMs = parsed;
    }
  }

  const validated = validateInvite(formData.get("username"), formData.get("email"));
  if (!validated.ok) return { ok: false, error: validated.error };
  const { username, email } = validated;

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "";
  const userAgent = hdrs.get("user-agent")?.slice(0, 500) || "";

  const payload = await getPayloadClient();

  // Durable rate limit: Postgres-backed via the `ip` index, so it holds across
  // serverless instances and cold starts (unlike the previous in-memory Map).
  // No IP (proxy stripped it) ⇒ skip — honeypot + time-gate still carry the load.
  if (ip) {
    const { totalDocs } = await payload.count({
      collection: "invite-requests",
      where: {
        ip: { equals: ip },
        createdAt: { greater_than: new Date(Date.now() - RATE_WINDOW_MS).toISOString() },
      },
    });
    if (totalDocs >= RATE_LIMIT) {
      return { ok: false, error: "Too many requests from your connection — try again in an hour." };
    }
  }

  // Persist the lead. The afterChange hook runs synchronously here: it sends the
  // owner email and stamps status (emailed / email_failed), or skips the send for
  // a duplicate. The lead is stored regardless (plan §15.1), so a send failure
  // never loses it — it's marked email_failed for an admin resend.
  try {
    await payload.create({
      collection: "invite-requests",
      draft: false,
      data: {
        username,
        email,
        status: "new", // hooks refine this → duplicate / emailed / email_failed
        source: "invite-form",
        ...(ip ? { ip } : {}),
        ...(userAgent ? { userAgent } : {}),
        ...(elapsedMs !== undefined ? { elapsedMs } : {}),
      },
    });
  } catch (err) {
    console.error("requestInvite: persist failed", err);
    return { ok: false, error: "Could not send your request — please try again later." };
  }

  // The lead is saved; only the message differs when email delivery is down.
  // Distinct copy from a transport failure, so the visitor gets a useful nudge.
  if (!process.env.RESEND_API_KEY || !process.env.INVITE_NOTIFY_TO) {
    console.error("requestInvite: RESEND_API_KEY / INVITE_NOTIFY_TO not configured");
    return { ok: false, error: "Invite requests are temporarily unavailable — DM on Instagram instead." };
  }

  return { ok: true };
}
