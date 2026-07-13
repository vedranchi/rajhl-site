import type { CollectionConfig } from "payload";

/**
 * Users — Payload admin auth. This is the login the client (Luka) uses at
 * /admin, and the same auth layer the Phase-2 analytics dashboard builds on.
 */
export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
    group: "System",
  },
  auth: true,
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
