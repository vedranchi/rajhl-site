/**
 * BeatStars catalogue fetcher for the Luka Rajhl site.
 *
 * WHY THIS EXISTS (and why it is NOT a runtime dependency):
 * BeatStars has no documented public API. This script reads two undocumented but
 * public, unauthenticated endpoints — their Algolia search index and their v2
 * read API — the same ones their own web player calls. It runs on a schedule
 * (GitHub Actions, see .github/workflows/refresh-catalogue.yml) or by hand and
 * bakes a snapshot into `src/data/beatstars-catalogue.json`. The rendered site
 * never calls BeatStars for catalogue data, so a bundle/key change on their side
 * can only break this script, never the live site. The one client-side call is
 * the audio-preview stream of the single most-popular beat (embed-like, optional).
 *
 * Popularity = play count (`activities.play`). We publish the TOP 10 beats and up
 * to 10 kits; the UI links out to BeatStars for the rest.
 *
 * Refresh:  node scripts/fetch-beatstars.mjs   (then commit the JSON)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const MEMBER_ID = "MR1947497"; // Luka Rajhl (beatstars.com/rajhl)
const ALGOLIA_APP = "NMMGZJQ6QI";
const ALGOLIA_KEY = "b3513eb709fe8f444b4d5c191b63ea47"; // public search key, from BeatStars' own web bundle
const REFERER = "https://www.beatstars.com/";
const MAX_ITEMS = 10; // publish at most this many beats / kits; link out for the rest

// Sanity gates. The refresh workflow auto-merges this file to `main` and
// redeploys production unattended, so a degraded fetch must fail loudly rather
// than quietly publish a smaller (or empty) catalogue. These endpoints are
// undocumented: an index rename, a dropped Referer, or a changed memberId all
// return HTTP 200 with zero hits, which would otherwise look like "the artist
// deleted everything".
const MIN_BEATS = 1; // never publish an empty catalogue
const MAX_SHRINK = 0.2; // refuse a >20% drop in total beats vs the committed snapshot

const j = (r) => r.json();
const money = (n) => `$${Number(n).toFixed(0)}`;
const secs = (s) => {
  if (!s || Number.isNaN(+s)) return "";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.round(s % 60)).padStart(2, "0")}`;
};

// Pull every hit for an index (Algolia caps hitsPerPage at 100 → paginate).
async function algoliaAll(index) {
  const hits = [];
  let page = 0;
  let nbHits = 0;
  for (;;) {
    const r = await fetch(`https://${ALGOLIA_APP}-dsn.algolia.net/1/indexes/${index}/query`, {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": ALGOLIA_APP,
        "X-Algolia-API-Key": ALGOLIA_KEY,
        "Content-Type": "application/json",
        Referer: REFERER,
      },
      body: JSON.stringify({ query: "", filters: `memberId:${MEMBER_ID}`, hitsPerPage: 100, page }),
    });
    const d = await j(r);
    hits.push(...(d.hits ?? []));
    nbHits = d.nbHits ?? hits.length;
    if (page >= (d.nbPages ?? 1) - 1) break;
    page += 1;
  }
  return { hits, nbHits };
}

async function detail(kind, id) {
  const r = await fetch(`https://main.v2.beatstars.com/${kind}?id=${id}`, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });
  return (await j(r))?.response?.data?.details ?? {};
}

const plays = (h) => h?.activities?.play ?? 0;
const numericId = (h) => h.v2Id ?? String(h.id).replace(/^[A-Z]+/, "");

// Strip HTML + collapse whitespace, then clip to a short one-line descriptor.
function blurb(html, max = 58) {
  const text = String(html || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const clipped = text.length > max ? text.slice(0, max).replace(/\s+\S*$/, "") + "…" : text;
  return clipped.charAt(0).toUpperCase() + clipped.slice(1).toLowerCase();
}

/** Previously committed snapshot, or null when missing/unreadable (first run). */
function readPrevious(dest) {
  try {
    return JSON.parse(readFileSync(dest, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Refuse to overwrite a good catalogue with a degraded one. Throws (→ exit 1 →
 * a red workflow run) instead of writing, so the stale-but-correct JSON stays
 * live. `ALLOW_CATALOGUE_SHRINK=1` overrides when the drop is genuinely real.
 */
function assertSane({ beats, beatsTotal, kitsTotal }, previous) {
  const fail = (why) => {
    throw new Error(
      `${why} — refusing to overwrite the committed catalogue. ` +
        `Re-run; if the drop is real, set ALLOW_CATALOGUE_SHRINK=1.`,
    );
  };

  if (beats.length < MIN_BEATS || beatsTotal < MIN_BEATS) {
    fail(`Fetched ${beatsTotal} total beats / ${beats.length} publishable`);
  }
  if (process.env.ALLOW_CATALOGUE_SHRINK === "1" || !previous) return;

  const beatsBefore = previous.totals?.beats ?? 0;
  if (beatsBefore > 0 && beatsTotal < beatsBefore * (1 - MAX_SHRINK)) {
    fail(`Total beats fell ${beatsBefore} → ${beatsTotal} (>${MAX_SHRINK * 100}%)`);
  }
  // Kit counts are small enough that a percentage gate would be noise; only
  // guard the all-or-nothing case.
  if ((previous.totals?.kits ?? 0) > 0 && kitsTotal === 0) {
    fail(`Total kits fell ${previous.totals.kits} → 0`);
  }
}

/** Everything except the run timestamp — the part worth committing. */
function content(snapshot) {
  const rest = { ...snapshot };
  delete rest._generatedAt;
  return JSON.stringify(rest);
}

async function main() {
  // --- Beats: rank ALL by plays, keep the top MAX_ITEMS ---
  const { hits: beatHits, nbHits: beatsTotal } = await algoliaAll("public_prod_inventory_track_index");
  const topBeats = [...beatHits].sort((a, b) => plays(b) - plays(a) || (b.activities?.sale ?? 0) - (a.activities?.sale ?? 0)).slice(0, MAX_ITEMS);

  const beats = [];
  for (const [i, h] of topBeats.entries()) {
    const id = numericId(h);
    const d = await detail("track", id);
    beats.push({
      n: i === 0 ? "▶" : String(i + 1).padStart(2, "0"),
      title: h.title,
      time: d.duration ?? secs(d.length),
      plays: plays(h),
      buyUrl: d.beatstars_uri ?? `https://www.beatstars.com/beat/${d.title_uri}`,
      // Stable redirect endpoint → fresh signed S3 mp3 on each play (never expires).
      // Same client-side preview exception as topBeat below — lets the transport's
      // skip button shuffle across all 10 front-page beats, not just the first.
      stream: `https://main.v2.beatstars.com/stream?id=${id}&return=audio`,
      playing: i === 0,
    });
  }

  // The single most-popular beat is what the player loads first.
  const topBeatEntry = beats[0];
  const topBeat = topBeatEntry
    ? {
        title: topBeatEntry.title,
        artist: "Luka Rajhl",
        stream: topBeatEntry.stream,
        total: topBeatEntry.time,
        buyUrl: topBeatEntry.buyUrl,
      }
    : null;

  // --- Kits: rank by plays too, keep up to MAX_ITEMS, canonical /sound-kits/ URL ---
  const { hits: kitHits, nbHits: kitsTotal } = await algoliaAll("public_prod_inventory_soundkit_index");
  const topKits = [...kitHits].sort((a, b) => plays(b) - plays(a)).slice(0, MAX_ITEMS);
  const kits = [];
  for (const h of topKits) {
    const d = await detail("soundkit", numericId(h));
    const desc = blurb(d.description);
    kits.push({
      file: h.title,
      meta: desc ? `${desc} · royalty-free` : "Sound kit · royalty-free",
      price: money(h.price ?? d.price ?? 0),
      buyUrl: d.relative_uri ? `https://www.beatstars.com${d.relative_uri}` : `https://www.beatstars.com/sound-kits/${d.title_uri}`,
    });
  }

  const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "beatstars-catalogue.json");
  const previous = readPrevious(dest);

  assertSane({ beats, beatsTotal, kitsTotal }, previous);

  const out = {
    _generatedAt: new Date().toISOString(),
    _source: "BeatStars public Algolia index + v2 read API (see scripts/fetch-beatstars.mjs)",
    _popularityMetric: "activities.play (BeatStars play count)",
    store: "https://www.beatstars.com/rajhl",
    totals: { beats: beatsTotal, kits: kitsTotal },
    shown: { beats: beats.length, kits: kits.length },
    topBeat,
    beats,
    kits,
  };

  // Leave the file alone when only the timestamp would change. `_generatedAt`
  // moves on every run, so writing unconditionally made the refresh workflow's
  // `git diff --quiet` gate never short-circuit — it would open, merge, and
  // redeploy production twice a day even when the ranking hadn't moved.
  if (previous && content(previous) === content(out)) {
    console.log(`Catalogue unchanged (${beatsTotal} beats, ${kitsTotal} kits) — left ${dest} as-is.`);
    return;
  }

  writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote top ${beats.length}/${beatsTotal} beats + ${kits.length}/${kitsTotal} kits -> ${dest}`);
  console.log(`Now-playing: ${topBeat?.title}`);
}

main().catch((e) => {
  console.error("BeatStars fetch failed:", e);
  process.exit(1);
});
