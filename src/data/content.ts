/**
 * Site content for the Luka Rajhl retro landing.
 *
 * Beats & kits are a real BeatStars snapshot: `src/data/beatstars-catalogue.json`
 * (regenerate with `node scripts/fetch-beatstars.mjs`; auto-refreshed on a schedule
 * by .github/workflows/refresh-catalogue.yml). Everything else is authored here
 * until it moves to Payload CMS.
 */
import catalogue from "./beatstars-catalogue.json";

export type Beat = {
  n: string;
  title: string;
  time: string;
  plays: number;
  buyUrl: string;
  playing?: boolean;
};

export type Kit = {
  file: string;
  meta: string;
  price: string;
  buyUrl: string;
};

export type SocialKind = "youtube" | "instagram" | "telegram" | "beatstars";

export type Social = {
  name: string;
  sub: string;
  handle: string;
  url: string;
  icon: SocialKind;
};

export const marqueeItems: string[] = [
  "NEW BEATS EVERY FRIDAY",
  "NOW BOOKING CUSTOM WORK",
  "FREE LOOPS ON TELEGRAM",
  "LEASES FROM $25",
  "MADE IN SKOPJE",
];

/** BeatStars store root + private Telegram group. */
export const beatstarsStore = catalogue.store;
export const telegramInvite = "https://t.me/+nfPjj9ktvsYwMWVk";
export const telegramMembers = "1,230+";

/** Real BeatStars catalogue (top-10 snapshot — see scripts/fetch-beatstars.mjs). */
export const beats: Beat[] = catalogue.beats;
export const kits: Kit[] = catalogue.kits;
/** Full store totals (the page shows the most-popular subset). */
export const catalogueTotals = catalogue.totals;
export const catalogueShown = catalogue.shown;
export const hasMoreBeats = catalogueTotals.beats > catalogueShown.beats;
export const hasMoreKits = catalogueTotals.kits > catalogueShown.kits;

export const socials: Social[] = [
  { name: "BeatStars", sub: "Beats, leases & exclusives", handle: "beatstars.com/rajhl", url: beatstarsStore, icon: "beatstars" },
  { name: "YouTube", sub: "Type beats & breakdowns", handle: "@lukarajhl", url: "https://www.youtube.com/@lukarajhl", icon: "youtube" },
  { name: "Instagram", sub: "Studio & snippets", handle: "@luka.rajhl", url: "https://www.instagram.com/luka.rajhl/", icon: "instagram" },
  { name: "Telegram", sub: `Free loops · ${telegramMembers} subscribers`, handle: "Private group", url: telegramInvite, icon: "telegram" },
];

/** The four Channels-tab badges (subscribe / follow / join / store). */
export const channelBadges: { label: string; url: string }[] = [
  { label: "SUBSCRIBE ►", url: "https://www.youtube.com/@lukarajhl?sub_confirmation=1" },
  { label: "FOLLOW ★", url: "https://www.instagram.com/luka.rajhl/" },
  { label: "JOIN ✈", url: telegramInvite },
  { label: "BEATSTARS ♪", url: beatstarsStore },
];

/** Spotify playlist embedded next to the invite form (official embed iframe). */
export const spotifyPlaylist = {
  id: "7JRpQCqP4BIrO0Wk35MaMD",
  embedUrl: "https://open.spotify.com/embed/playlist/7JRpQCqP4BIrO0Wk35MaMD?utm_source=generator&theme=0",
  openUrl: "https://open.spotify.com/playlist/7JRpQCqP4BIrO0Wk35MaMD",
};

/**
 * Browser transport player. Primary source = the most-popular beat streamed from
 * BeatStars (a client-side preview, embed-like). `fallbackSrc` is a self-contained
 * retro loop used if the stream fails to load, so the player always works.
 */
const top = catalogue.topBeat;
export const nowPlaying = {
  title: top?.title ?? "Retro Test Loop",
  artist: top?.artist ?? "Luka Rajhl",
  src: top?.stream ?? "/audio/placeholder-loop.wav",
  fallbackSrc: "/audio/placeholder-loop.wav",
  total: top?.total || "0:15",
  buyUrl: top?.buyUrl ?? beatstarsStore,
};

export const about = {
  specs: [
    { k: "Artist", v: "Luka Rajhl" },
    { k: "Location", v: "Skopje, Macedonia" },
    { k: "Genre", v: "Trap · Ambient · Lo-fi" },
    { k: "Since", v: "2018" },
    { k: "Setup", v: "FL Studio · analog outboard" },
  ] as { k: string; v: string }[],
  status: "Available for work",
  bio:
    "Producer and beatmaker out of Skopje, crafting dust-warm 808s, cinematic keys and " +
    "hard-swinging drums. Beats and kits ship worldwide through BeatStars — from bedroom " +
    "demos to placements. Slide into the DMs for custom work.",
};
