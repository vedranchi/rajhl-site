import type {
  CollectionAfterChangeHook,
  CollectionAfterOperationHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from "payload";
import type { InviteRequest } from "@/payload-types";
import { validateInvite } from "@/lib/validate-invite";
import { sendInviteEmail } from "@/lib/invite-email";

/**
 * Collection hooks for `invite-requests`. Data-integrity and side-effect logic
 * lives here (not only in the server action) so it fires no matter how a row is
 * created — action, admin, import, or a raw Local API call — and can't be
 * bypassed. See docs/plans/private-group-invite-payload-plan.md §5.
 */

/** Match the action's cap so a stored user-agent can never balloon a row. */
const USER_AGENT_MAX = 500;

/** How far back a same-email lead counts as a duplicate (default 24h, env-tunable). */
const DEFAULT_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1_000;
function dedupeWindowMs(): number {
  return Number(process.env.INVITE_DEDUPE_WINDOW_MS) || DEFAULT_DEDUPE_WINDOW_MS;
}

/**
 * beforeValidate — canonicalise + defend (defense in depth). The action already
 * validates, but this guarantees no malformed lead can ever land, even from a
 * future admin/import/Local-API path. Re-runs the pure validator, normalises to
 * a canonical `@handle` + lowercased email, caps the user-agent, defaults source.
 */
export const inviteBeforeValidate: CollectionBeforeValidateHook<InviteRequest> = ({
  data,
  operation,
}) => {
  if (!data) return data;

  // Only validate the identity fields when both are present. Partial updates
  // (e.g. the afterChange status write in a later step) legitimately omit them —
  // skip rather than reject. Creates always carry both, so no malformed lead
  // can land.
  if (typeof data.username === "string" && typeof data.email === "string") {
    const result = validateInvite(data.username, data.email);
    if (!result.ok) throw new Error(result.error);
    data.username = result.username; // canonical @handle
    data.email = result.email; // lowercased
  }

  if (typeof data.userAgent === "string" && data.userAgent.length > USER_AGENT_MAX) {
    data.userAgent = data.userAgent.slice(0, USER_AGENT_MAX);
  }

  // Default source on create only. A partial update (e.g. the afterChange status
  // write) omits source; defaulting there would clobber a custom provenance.
  if (operation === "create" && !data.source) data.source = "invite-form";

  return data;
};

/**
 * beforeChange — duplicate detection (create only). Looks up a prior lead with
 * the same email inside the dedupe window; if found, marks this row
 * `status: "duplicate"` so the afterChange email hook (later step) can skip the
 * owner notification. The row is still stored — repeat interest stays visible
 * in admin. Does not reject. See §3.6.
 */
export const inviteBeforeChange: CollectionBeforeChangeHook<InviteRequest> = async ({
  data,
  req,
  operation,
}) => {
  if (operation !== "create") return data;
  if (typeof data.email !== "string" || !data.email) return data;
  // Don't clobber a stronger, explicitly-set terminal status.
  if (data.status === "spam") return data;

  const since = new Date(Date.now() - dedupeWindowMs()).toISOString();
  const { totalDocs } = await req.payload.count({
    collection: "invite-requests",
    where: {
      email: { equals: data.email },
      createdAt: { greater_than: since },
    },
    req, // share the current transaction; the not-yet-written row can't self-match
  });

  if (totalDocs > 0) data.status = "duplicate";

  return data;
};

/**
 * afterChange — side effect: owner email + lifecycle status (create only).
 *
 * Sends the notification for genuinely new leads (skips duplicate/spam), then
 * self-updates the row's status to `emailed` (+ `emailSentAt`) or `email_failed`
 * (+ `emailError`). Guarded against re-entrancy by `req.context.skipInviteEmail`
 * so the self-update's own afterChange pass no-ops. **Never throws** — the lead
 * is already persisted; a send/update failure must not roll the create back.
 */
export const inviteAfterChange: CollectionAfterChangeHook<InviteRequest> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== "create") return doc;
  if (req.context?.skipInviteEmail) return doc; // our own status-update pass
  if (doc.status === "duplicate" || doc.status === "spam") return doc;

  const result = await sendInviteEmail(doc);

  const data: Partial<InviteRequest> = result.ok
    ? { status: "emailed", emailSentAt: new Date().toISOString(), emailError: null }
    : { status: "email_failed", emailError: result.error };

  if (!result.ok) {
    console.error(JSON.stringify({ evt: "invite_email_failed", id: doc.id, error: result.error }));
  }

  try {
    await req.payload.update({
      collection: "invite-requests",
      id: doc.id,
      data,
      context: { skipInviteEmail: true }, // prevents the infinite afterChange loop
      overrideAccess: true,
      req, // share the create's transaction
    });
  } catch (err) {
    // Swallow — the lead row exists; only the status stamp failed.
    console.error(
      JSON.stringify({ evt: "invite_status_update_failed", id: doc.id, error: String(err) }),
    );
  }

  return doc;
};

/**
 * afterOperation — observability only (no business logic). Emits one structured
 * line per create for metrics/triage (a natural seam for the Phase 2 dashboard).
 * `status` here is the create-time value (new / duplicate); the email outcome is
 * logged separately by afterChange. Logs no PII beyond ip/status — never the
 * email body. See §3.7.
 */
export const inviteAfterOperation: CollectionAfterOperationHook<"invite-requests"> = ({
  operation,
  result,
}) => {
  if (operation !== "create") return result;
  const doc = result as InviteRequest;
  console.info(
    JSON.stringify({
      evt: "invite_request",
      id: doc.id,
      status: doc.status,
      ip: doc.ip ?? null,
      elapsedMs: doc.elapsedMs ?? null,
    }),
  );
  return result;
};
