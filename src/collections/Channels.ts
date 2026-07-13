import type { CollectionConfig } from "payload";

/**
 * Channels — the social/link hub (YouTube, Instagram, Telegram, …).
 * The `icon` select maps to the retro link-button icons in the UI.
 */
export const Channels: CollectionConfig = {
  slug: "channels",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "icon", "handle", "order"],
    group: "Content",
  },
  access: {
    read: () => true,
  },
  defaultSort: "order",
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: { placeholder: "YouTube" },
    },
    {
      name: "icon",
      type: "select",
      required: true,
      defaultValue: "youtube",
      options: [
        { label: "YouTube", value: "youtube" },
        { label: "Instagram", value: "instagram" },
        { label: "Telegram", value: "telegram" },
        { label: "BeatStars", value: "beatstars" },
      ],
    },
    {
      name: "sub",
      label: "Subtitle",
      type: "text",
      admin: { placeholder: "Type beats & breakdowns" },
    },
    {
      name: "handle",
      type: "text",
      admin: { placeholder: "@lukarajhl" },
    },
    {
      name: "url",
      type: "text",
      required: true,
    },
    {
      name: "order",
      label: "Sort order",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar", description: "Lower numbers appear first." },
    },
  ],
};
