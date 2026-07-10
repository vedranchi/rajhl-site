/**
 * One-off BeatStars catalogue fetcher for the Luka Rajhl site.
 *
 * WHY THIS EXISTS (and why it is NOT a runtime dependency):
 * BeatStars has no documented public API. This script reads two undocumented but
 * public, unauthenticated endpoints — their Algolia search index and their v2
 * read API — the same ones their own web player calls. We run it MANUALLY to bake
 * a snapshot into `src/data/beatstars-catalogue.json`. The production site never
 * calls BeatStars, so a bundle/key change on their side can never break the live
 * site (it just means "re-run this to refresh"). This respects the CLAUDE.md rule
 * against runtime scraping while still giving real per-beat deep links.
 *
 * Refresh:  node scripts/fetch-beatstars.mjs
 * Then commit the regenerated JSON.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const MEMBER_ID = "MR1947497"; // Luka Rajhl (beatstars.com/rajhl)
const ALGOLIA_APP = "NMMGZJQ6QI";
const ALGOLIA_KEY = "b3513eb709fe8f444b4d5c191b63ea47"; // public search key, from BeatStars' own web bundle
const BEATS_COUNT = 6;
const REFERER = "https://www.beatstars.com/";

const KEY_MAP = {
  A_MAJOR: "A maj", A_MINOR: "A min", A_SHARP_MAJOR: "A# maj", A_SHARP_MINOR: "A# min",
  B_MAJOR: "B maj", B_MINOR: "B min", C_MAJOR: "C maj", C_MINOR: "C min",
  C_SHARP_MAJOR: "C# maj", C_SHARP_MINOR: "C# min", D_MAJOR: "D maj", D_MINOR: "D min",
  D_SHARP_MAJOR: "D# maj", D_SHARP_MINOR: "D# min", E_MAJOR: "E maj", E_MINOR: "E min",
  F_MAJOR: "F maj", F_MINOR: "F min", F_SHARP_MAJOR: "F# maj", F_SHARP_MINOR: "F# min",
  G_MAJOR: "G maj", G_MINOR: "G min", G_SHARP_MAJOR: "G# maj", G_SHARP_MINOR: "G# min",
};

const j = (r) => r.json();
const money = (n) => `$${Number(n).toFixed(0)}`;
const secs = (s) => {
  if (!s || Number.isNaN(+s)) return "";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.round(s % 60)).padStart(2, "0")}`;
};

async function algolia(index, params) {
  const r = await fetch(`https://${ALGOLIA_APP}-dsn.algolia.net/1/indexes/${index}/query`, {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": ALGOLIA_APP,
      "X-Algolia-API-Key": ALGOLIA_KEY,
      "Content-Type": "application/json",
      Referer: REFERER,
    },
    body: JSON.stringify(params),
  });
  return j(r);
}

async function detail(kind, id) {
  const r = await fetch(`https://main.v2.beatstars.com/${kind}?id=${id}`, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });
  return (await j(r))?.response?.data?.details ?? {};
}

// Strip HTML + collapse whitespace, then clip to a short one-line descriptor.
function blurb(html, max = 58) {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  const clipped = text.length > max ? text.slice(0, max).replace(/\s+\S*$/, "") + "…" : text;
  // Title-case-ish: keep as-is but soften the all-caps BeatStars copy.
  return clipped.charAt(0).toUpperCase() + clipped.slice(1).toLowerCase();
}

async function main() {
  // --- Beats: newest first from the public inventory index ---
  const beatHits = await algolia("public_prod_inventory_track_index", {
    query: "",
    filters: `memberId:${MEMBER_ID}`,
    hitsPerPage: BEATS_COUNT,
  });

  const beats = [];
  for (const [i, h] of beatHits.hits.entries()) {
    const d = await detail("track", h.v2Id ?? h.id.replace(/^TK/, ""));
    beats.push({
      n: i === 0 ? "▶" : String(i + 1).padStart(2, "0"),
      title: h.title,
      bpm: h.metadata?.bpm ?? d.bpm ?? 0,
      key: KEY_MAP[h.metadata?.keyNote] ?? "",
      // v2 `duration` is already "MM:SS"; fall back to a numeric length if needed.
      time: d.duration ?? secs(d.length),
      price: money(h.price ?? d.price ?? 0),
      buyUrl: d.beatstars_uri ?? `https://www.beatstars.com/beat/${d.title_uri}`,
      playing: i === 0,
    });
  }

  // --- Kits: soundkit index → canonical /sound-kits/<title_uri> public URL ---
  const kitHits = await algolia("public_prod_inventory_soundkit_index", {
    query: "",
    filters: `memberId:${MEMBER_ID}`,
    hitsPerPage: 8,
  });
  const kits = [];
  for (const h of kitHits.hits) {
    const d = await detail("soundkit", String(h.id).replace(/^SK/, ""));
    const desc = blurb(d.description);
    kits.push({
      file: h.title,
      meta: desc ? `${desc} · royalty-free` : "Sound kit · royalty-free",
      price: money(h.price ?? d.price ?? 0),
      buyUrl: d.relative_uri
        ? `https://www.beatstars.com${d.relative_uri}`
        : `https://www.beatstars.com/sound-kits/${d.title_uri}`,
    });
  }

  const out = {
    _generatedAt: new Date().toISOString(),
    _source: "BeatStars public Algolia index + v2 read API (see scripts/fetch-beatstars.mjs)",
    store: "https://www.beatstars.com/rajhl",
    totals: { beats: beatHits.nbHits ?? beats.length, kits: kitHits.nbHits ?? kits.length },
    beats,
    kits,
  };

  const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "beatstars-catalogue.json");
  writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${beats.length} beats + ${kits.length} kits -> ${dest}`);
}

main().catch((e) => {
  console.error("BeatStars fetch failed:", e);
  process.exit(1);
});
