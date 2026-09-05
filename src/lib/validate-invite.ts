/**
 * Pure validation for the Private Telegram request form (no framework imports,
 * so it can be unit-tested standalone).
 *
 * The form collects one contact detail: an Instagram handle. Luka replies there
 * with the group invite, so a wrong handle means an unreachable applicant, but
 * an over-strict rule means a rejected one. The rules below follow Instagram's
 * own: 1-30 characters of letters, digits, periods and underscores, not
 * starting or ending with a period. A pasted profile URL is accepted and
 * reduced to the handle, because people paste those.
 */

export type InviteValidation =
  | { ok: true; instagram: string }
  | { ok: false; error: string };

const HANDLE_RE = /^[A-Za-z0-9._]{1,30}$/;
const PROFILE_URL_RE = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i;

const INVALID =
  "That doesn't look like an Instagram username. Letters, numbers, periods and underscores, up to 30 characters.";

/** "https://instagram.com/luka.rajhl/" and "@luka.rajhl" both reduce to "luka.rajhl". */
function toHandle(raw: string): string {
  const trimmed = raw.trim();
  const fromUrl = trimmed.match(PROFILE_URL_RE)?.[1];
  return (fromUrl ?? trimmed).replace(/^@/, "").replace(/\/+$/, "").trim();
}

export function validateInvite(instagramRaw: unknown): InviteValidation {
  if (typeof instagramRaw !== "string") {
    return { ok: false, error: "Your Instagram username is required." };
  }

  const handle = toHandle(instagramRaw);
  if (!handle) return { ok: false, error: "Your Instagram username is required." };
  if (!HANDLE_RE.test(handle)) return { ok: false, error: INVALID };
  if (handle.startsWith(".") || handle.endsWith(".")) return { ok: false, error: INVALID };

  // Canonical @handle, lowercased: Instagram handles are case-insensitive, and
  // the duplicate check compares this value.
  return { ok: true, instagram: `@${handle.toLowerCase()}` };
}
