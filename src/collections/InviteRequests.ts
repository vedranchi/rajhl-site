import type { CollectionConfig } from "payload";
import {
  inviteAfterChange,
  inviteAfterOperation,
  inviteBeforeChange,
  inviteBeforeValidate,
} from "./hooks/invite-requests";

const adminOnly = ({ req: { user } }: { req: { user: unknown } }) => Boolean(user);

/**
 * InviteRequests — leads from the private-group ("Inner Circle") invite form.
 * The public never writes here directly: `create` is closed and the vetted
 * server action (`requestInvite`) uses the Payload Local API, which bypasses
 * access control by design. See docs/plans/private-group-invite-payload-plan.md.
 */
export const InviteRequests: CollectionConfig = {
  slug: "invite-requests",
  labels: { singular: "Invite Request", plural: "Invite Requests" },
  admin: {
    group: "Leads",
    useAsTitle: "username",
    defaultColumns: ["username", "email", "status", "createdAt"],
    listSearchableFields: ["username", "email"],
    description: "Inbound private-group invite requests. Read-only leads; edit status/notes only.",
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
      name: "username",
      type: "text",
      required: true,
      admin: { readOnly: true },
    },
    {
      name: "email",
      type: "email",
      required: true,
      index: true,
      admin: { readOnly: true },
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
