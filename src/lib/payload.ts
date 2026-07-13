import { getPayload, type Payload } from "payload";
import config from "@payload-config";

let cached: Promise<Payload> | null = null;

/** Cached Payload Local API client — reuse across server actions / hooks within a process. */
export function getPayloadClient(): Promise<Payload> {
  if (!cached) {
    // Don't cache a rejected init (e.g. a transient cold-start DB failure) — it
    // would poison every later request on this warm instance. Clear it so the
    // next call retries; a resolved client is still cached for reuse.
    cached = getPayload({ config }).catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}
