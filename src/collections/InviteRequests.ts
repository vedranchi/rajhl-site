import type { CollectionConfig } from "payload";
import {
  inviteAfterChange,
  inviteAfterOperation,
  inviteBeforeChange,
  inviteBeforeValidate,
} from "./hooks/invite-requests";

const adminOnly = ({ req: { user } }: { req: { user: unknown } }) => Boolean(user);

/**
 * InviteRequests — leads from the Private Telegram request form.
 * The public never writes here directly: `create` is closed and the vetted
 * server action (`requestInvite`) uses the Payload Local API, which bypasses
 * access control by design. See docs/plans/private-group-invite-payload-plan.md.
 */
export const InviteRequests: CollectionConfig = {
  slug: "invite-requests",
  labels: { singular: "Invite Request", plural: "Invite Requests" },
  admin: {
    group: "Leads",
    useAsTitle: "instagram",
    defaultColumns: ["instagram", "status", "createdAt"],
    // `tracks` deliberately absent from defaultColumns: an array column renders
    // as a count, which tells a reviewer nothing. Open the row for the links.
    listSearchableFields: ["instagram", "username", "email"],
    description: "Inbound Private Telegram requests. Read-only leads; edit status/notes only.",
    pagination: { defaultLimit: 25 },
  },
  access: {
    create: () => false, // no public REST/GraphQL create — the server action uses the Local API
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  defaultSort: "-createdAt",
  timestamps: true,
  hooks: {
    beforeValidate: [inviteBeforeValidate],
    beforeChange: [inviteBeforeChange],
    afterChange: [inviteAfterChange],
    afterOperation: [inviteAfterOperation],
  },
  fields: [
    {
      name: "instagram",
      type: "text",
      // Not `required` at the schema level on purpose: the table already holds
      // leads from the old email form, and a NOT NULL column cannot be added to
      // them without inventing data. The server action and the collection's
      // beforeValidate hook both reject a create without a valid handle, so
      // nothing malformed can land.
      index: true,
      admin: { readOnly: true, description: "Applicant's Instagram handle. Reply here with the group invite." },
    },
    {
      name: "username",
      type: "text",
      // Legacy: the Telegram handle the old form collected. Kept so the leads
      // already in the table keep their contact details; nothing writes it now.
      admin: { readOnly: true, description: "Legacy field from the old invite form." },
    },
    {
      name: "email",
      type: "email",
      // Legacy, as above. The form no longer asks applicants for an email.
      index: true,
      admin: { readOnly: true, description: "Legacy field from the old invite form." },
    },
    {
      name: "tracks",
      type: "array",
      // The applicant's three best solo beats, stored in a private Supabase
      // bucket. Only the path is authoritative; `url` is a long-lived signed
      // link so the beats are playable straight from this row, which is what
      // makes a request reviewable in one place. Both are written by the server
      // action, never by a form post.
      admin: {
        readOnly: true,
        description: "The three solo beats attached to this request.",
      },
      fields: [
        { name: "path", type: "text", required: true },
        { name: "originalName", type: "text" },
        { name: "sizeBytes", type: "number" },
        { name: "url", type: "text", admin: { description: "Signed link, valid for a year." } },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      index: true,
      admin: {
        position: "sidebar",
        description:
          "Lifecycle, set automatically. Filter by 'Email failed' to find leads whose owner notification didn't send; mark 'Spam' to flag abuse.",
      },
      options: [
        { label: "New", value: "new" },
        { label: "Emailed owner", value: "emailed" },
        { label: "Email failed", value: "email_failed" },
        { label: "Duplicate", value: "duplicate" },
        { label: "Spam", value: "spam" },
      ],
    },
    {
      name: "source",
      type: "text",
      defaultValue: "invite-form",
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "ip",
      label: "IP address",
      type: "text",
      index: true,
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "userAgent",
      label: "User agent",
      type: "text",
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "elapsedMs",
      label: "Time on form (ms)",
      type: "number",
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "emailSentAt",
      label: "Email sent at",
      type: "date",
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "emailError",
      label: "Email error",
      type: "text",
      admin: { readOnly: true, position: "sidebar" },
    },
    {
      name: "notes",
      type: "textarea",
      admin: { description: "Your private notes on this lead." },
    },
  ],
};
