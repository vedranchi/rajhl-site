import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig, type SharpDependency } from "payload";
import sharp from "sharp";

import { Beats } from "./collections/Beats";
import { Channels } from "./collections/Channels";
import { InviteRequests } from "./collections/InviteRequests";
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

/**
 * Postgres connection string. Local dev sets DATABASE_URL by hand; on Vercel the
 * Supabase integration injects POSTGRES_URL instead (it never creates
 * DATABASE_URL), so fall back to it — this keeps the app working against a stock
 * Supabase↔Vercel setup and survives credential rotation.
 *
 * The integration's URL carries `sslmode=require`, which recent node-postgres
 * coerces to `verify-full` and then rejects Supabase's self-signed cert chain —
 * and that string param overrides the pool's explicit `ssl` option. Strip
 * `sslmode` so our `ssl: { rejectUnauthorized: false }` governs (TLS stays on,
 * only the chain check is skipped).
 */
function pgConnectionString(): string {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("ssl");
    return url.toString();
  } catch {
    return raw;
  }
}

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
  collections: [Beats, Kits, Channels, Media, Users, InviteRequests],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      // See pgConnectionString() above: resolves DATABASE_URL → POSTGRES_URL and
      // strips `sslmode` so the explicit ssl option below is what applies.
      connectionString: pgConnectionString(),
      // TLS stays on; only Supabase's self-signed chain check is skipped.
      ssl: { rejectUnauthorized: false },
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
