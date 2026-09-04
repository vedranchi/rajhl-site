"use server";

import { headers } from "next/headers";
import { validateInvite } from "@/lib/validate-invite";
import { getPayloadClient } from "@/lib/payload";
import { envInt } from "@/lib/env";
import {
  TRACK_COUNT,
  prepareUploads,
  signDownloadUrl,
  statObject,
  validateTrackInputs,
  verifyClaim,
  type PreparedUploads,
  type StoredTrack,
} from "@/lib/track-uploads";

/**
 * Server action for the Private Telegram request form.
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
export type PrepareResult = { ok: true; prepared: PreparedUploads } | { ok: false; error: string };

const MIN_FILL_MS = 3_000; // submissions faster than this are bots
const RATE_LIMIT = envInt(process.env.INVITE_RATE_LIMIT, 3); // creates per IP…
const RATE_WINDOW_MS = envInt(process.env.INVITE_RATE_WINDOW_MS, 60 * 60 * 1_000); // …per hour

/** Edge-set true client IP. The leftmost x-forwarded-for hop is client-settable,
    so trusting it first let the per-IP rate limit be bypassed with a spoofed
    header; XFF is only a fallback when x-real-ip is absent. */
async function clientIp(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get("x-real-ip")?.trim() || hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
}

/** Durable, Postgres-backed per-IP limit shared by both steps of the flow, so
    minting upload URLs is gated by the same budget as creating a request. No IP
    (proxy stripped it) means skip; the honeypot and time-gate still apply. */
async function overRateLimit(ip: string): Promise<boolean> {
  if (!ip) return false;
  const payload = await getPayloadClient();
  const { totalDocs } = await payload.count({
    collection: "invite-requests",
    where: {
      ip: { equals: ip },
      createdAt: { greater_than: new Date(Date.now() - RATE_WINDOW_MS).toISOString() },
    },
  });
  return totalDocs >= RATE_LIMIT;
}

/**
 * Step 1 of the upload flow: validate what the browser claims about the three
 * files, then hand back one signed Supabase URL per track plus a claim binding
 * those exact object paths. The browser uploads directly; nothing large ever
 * passes through this action.
 */
export async function prepareTrackUploads(files: unknown): Promise<PrepareResult> {
  const validated = validateTrackInputs(files);
  if (!validated.ok) return { ok: false, error: validated.error };

  const ip = await clientIp();
  if (await overRateLimit(ip)) {
    return { ok: false, error: "Too many requests from your connection — try again in an hour." };
  }

  return prepareUploads(validated.files);
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
  let elapsedMs: number | undefined;
  if (typeof elapsedRaw === "string" && elapsedRaw.trim() !== "") {
    const parsed = Number(elapsedRaw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      if (parsed < MIN_FILL_MS) return { ok: true };
      elapsedMs = parsed;
    }
  }

  const validated = validateInvite(formData.get("instagram"));
  if (!validated.ok) return { ok: false, error: validated.error };
  const { instagram } = validated;

  // The three uploaded beats. `paths` and `claim` come back from
  // prepareTrackUploads; the claim is what proves this browser was issued these
  // exact paths, so a forged or borrowed path cannot be attached to a request.
  const pathsRaw = formData.get("trackPaths");
  const names = formData.getAll("trackNames").map((n) => String(n).slice(0, 120));
  let paths: string[];
  try {
    const parsed = JSON.parse(typeof pathsRaw === "string" ? pathsRaw : "[]");
    paths = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    paths = [];
  }

  if (paths.length !== TRACK_COUNT) {
    return { ok: false, error: `Attach exactly ${TRACK_COUNT} beats.` };
  }
  if (!verifyClaim(formData.get("trackClaim"), paths)) {
    return { ok: false, error: "Your uploads expired — pick your beats again." };
  }

  const hdrs = await headers();
  const ip = await clientIp();
  const userAgent = hdrs.get("user-agent")?.slice(0, 500) || "";

  const payload = await getPayloadClient();

  if (await overRateLimit(ip)) {
    return { ok: false, error: "Too many requests from your connection — try again in an hour." };
  }

  // Confirm each object actually landed at an accepted size and type, then mint
  // the review links. Checking storage rather than trusting the post is what
  // stops a request that claims uploads which never happened.
  const tracks: StoredTrack[] = [];
  for (const [i, path] of paths.entries()) {
    const stat = await statObject(path);
    if (!stat.ok) return { ok: false, error: stat.error };
    tracks.push({
      path,
      originalName: names[i] || `${i + 1}.mp3`,
      sizeBytes: stat.sizeBytes,
      url: (await signDownloadUrl(path)) ?? "",
    });
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
        instagram,
        tracks,
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
    return { ok: false, error: "Requests are temporarily unavailable — DM on Instagram instead." };
  }

  return { ok: true };
}
