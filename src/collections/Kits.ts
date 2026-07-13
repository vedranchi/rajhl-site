import type { CollectionConfig } from "payload";

/**
 * Kits — sample packs / drum kits. Like Beats, the actual purchase happens
 * off-site (BeatStars or wherever the client sells); this stores the listing.
 */
export const Kits: CollectionConfig = {
  slug: "kits",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "price", "published", "order"],
    group: "Catalogue",
  },
  access: {
    read: () => true,
  },
  defaultSort: "order",
  fields: [
    {
      name: "name",
      label: "Kit name",
      type: "text",
      required: true,
      admin: { placeholder: "Vardar Drums Vol.1" },
    },
    {
      name: "meta",
      label: "Details line",
      type: "text",
      required: true,
      admin: {
        placeholder: "60 one-shots · 148 MB · royalty-free",
        description: "Short spec line shown under the kit name.",
      },
    },
    {
      name: "price",
      type: "text",
      required: true,
      admin: {
        placeholder: "$24",
        description: "Display price only — charged on the store, not here.",
      },
    },
    {
      name: "buyUrl",
      label: "Buy / download link",
      type: "text",
      required: true,
    },
    {
      name: "cover",
      label: "Cover art",
      type: "upload",
      relationTo: "media",
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
      admin: { position: "sidebar", description: "Lower numbers appear first." },
    },
  ],
};
