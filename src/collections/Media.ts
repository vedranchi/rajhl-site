import type { CollectionConfig } from "payload";

/**
 * Media — uploads (cover art, audio previews). On Vercel (serverless, no
 * local disk) these are stored via the S3/Supabase Storage adapter wired in
 * payload.config.ts; locally they fall back to disk under /media.
 */
export const Media: CollectionConfig = {
  slug: "media",
  admin: { group: "Content" },
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ["image/*", "audio/*"],
  },
  fields: [
    {
      name: "alt",
      label: "Alt text",
      type: "text",
    },
  ],
};
