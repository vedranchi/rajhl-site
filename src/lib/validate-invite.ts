/**
 * Pure validation for the private-group invite form (no framework imports so it
 * can be unit-tested standalone). Rules per docs/handoffs/private-group-invite-task-1.md:
 * Telegram-style username, RFC-lite email, hard length caps, trim everything.
 */

export type InviteValidation =
  | { ok: true; username: string; email: string }
  | { ok: false; error: string };

// Telegram usernames are a-z, 0-9, underscore. Telegram enforces 5–32; we allow
// 3–32 to be lenient with people typing display names, and accept a leading @.
const USERNAME_RE = /^@?[a-zA-Z0-9_]{3,32}$/;

// RFC-lite: something@something.tld, no whitespace, sane lengths.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_MAX = 254;

export function validateInvite(usernameRaw: unknown, emailRaw: unknown): InviteValidation {
  if (typeof usernameRaw !== "string" || typeof emailRaw !== "string") {
    return { ok: false, error: "Username and email are required." };
  }

  const usernameTrimmed = usernameRaw.trim();
  const email = emailRaw.trim().toLowerCase();

  if (!usernameTrimmed) return { ok: false, error: "Username is required." };
  if (!email) return { ok: false, error: "Email is required." };

  if (!USERNAME_RE.test(usernameTrimmed)) {
    return {
      ok: false,
      error: "Username must be 3–32 characters — letters, numbers or underscores (a leading @ is fine).",
    };
  }

  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    return { ok: false, error: "That email address doesn't look valid." };
  }

  // Normalise to a single canonical @handle for the notification email.
  const username = `@${usernameTrimmed.replace(/^@/, "")}`;

  return { ok: true, username, email };
}
