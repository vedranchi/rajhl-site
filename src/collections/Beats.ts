import type { CollectionConfig } from "payload";

/**
 * Beats — display metadata + a BeatStars deep-link per track.
 * Commerce (price tiers, leases, checkout, payouts) stays on BeatStars;
 * this collection is the source of truth ONLY for how a beat is shown.
 */
export const Beats: CollectionConfig = {
  slug: "beats",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "bpm", "key", "published", "order"],
    group: "Catalogue",
  },
  access: {
    read: () => true, // public site reads beats
  },
  defaultSort: "order",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "bpm",
      label: "BPM",
      type: "number",
      required: true,
      min: 1,
      max: 400,
    },
    {
      name: "key",
      label: "Musical key",
      type: "text",
      required: true,
      admin: { placeholder: "F# min" },
    },
    {
      name: "duration",
      label: "Duration (mm:ss)",
      type: "text",
      admin: { placeholder: "2:38" },
    },
    {
      name: "buyUrl",
      label: "BeatStars link",
      type: "text",
      required: true,
      admin: {
        description: "Deep-link to this beat on BeatStars (checkout happens there).",
      },
    },
    {
      name: "cover",
      label: "Cover art",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "preview",
      label: "Audio preview",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optional short MP3 preview. The full track is sold on BeatStars.",
      },
    },
    {
      name: "featured",
      label: "Featured (highlight in the player)",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "published",
      type: "checkbox",
      defaultValue: true,
      admin: { position: "sidebar" },
    },
    {
      name: "order",
      label: "Sort order",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Lower numbers appear first.",
      },
    },
  ],
};
