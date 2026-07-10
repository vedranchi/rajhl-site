import type { GlobalConfig } from "payload";

/**
 * SiteSettings — the single-record "About / chrome" content: artist bio,
 * spec sheet, marquee ticker lines, and the now-playing label. Mirrors the
 * `about`, `marqueeItems`, and `nowPlaying` exports in src/data/content.ts.
 */
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  admin: { group: "Content" },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "status",
      label: "Availability status",
      type: "text",
      defaultValue: "Available for work",
    },
    {
      name: "bio",
      label: "Artist bio",
      type: "textarea",
    },
    {
      name: "specs",
      label: "Spec sheet",
      type: "array",
      admin: { description: "The Artist / Location / Genre / … rows in the About tab." },
      fields: [
        { name: "k", label: "Label", type: "text", required: true },
        { name: "v", label: "Value", type: "text", required: true },
      ],
    },
    {
      name: "marquee",
      label: "Marquee ticker lines",
      type: "array",
      admin: { description: "Scrolling headlines at the top of the window." },
      fields: [{ name: "text", type: "text", required: true }],
    },
    {
      name: "nowPlaying",
      label: "Now playing (transport bar)",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        { name: "artist", type: "text" },
        { name: "elapsed", type: "text", admin: { placeholder: "01:12" } },
        { name: "total", type: "text", admin: { placeholder: "02:38" } },
      ],
    },
  ],
};
