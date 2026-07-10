import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig, type SharpDependency } from "payload";
import sharp from "sharp";

import { Beats } from "./collections/Beats";
import { Channels } from "./collections/Channels";
import { Kits } from "./collections/Kits";
import { Media } from "./collections/Media";
import { Users } from "./collections/Users";
import { SiteSettings } from "./globals/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Supabase Storage is S3-compatible. Only enable the storage adapter when the
 * bucket credentials are present, so local dev / preview builds without them
 * fall back to disk instead of throwing. On Vercel (no local disk) these env
 * vars MUST be set — see .env.example.
 */
const hasS3 =
  !!process.env.S3_BUCKET &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY &&
  !!process.env.S3_ENDPOINT;

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: "· Luka Rajhl",
    },
  },
  collections: [Beats, Kits, Channels, Media, Users],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),
  // Cast: sharp's overloaded default export isn't structurally assignable to
  // Payload's single-signature SharpDependency type (declaration-only friction;
  // the value is a valid sharp instance at runtime).
  sharp: sharp as unknown as SharpDependency,
  plugins: hasS3
    ? [
        s3Storage({
          collections: {
            media: true,
          },
          bucket: process.env.S3_BUCKET as string,
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || "us-east-1",
            forcePathStyle: true, // required for Supabase Storage
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
            },
          },
        }),
      ]
    : [],
});
