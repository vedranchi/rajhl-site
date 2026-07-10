/**
 * Site content for the Luka Rajhl retro landing.
 *
 * Beats & kits are a real BeatStars snapshot: `src/data/beatstars-catalogue.json`
 * (regenerate with `node scripts/fetch-beatstars.mjs`). Everything else is authored
 * here until it moves to Payload CMS.
 */
import catalogue from "./beatstars-catalogue.json";

export type Beat = {
  n: string;
  title: string;
  bpm: number;
  key: string;
  time: string;
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

/** BeatStars store root + private Telegram group invite. */
export const beatstarsStore = catalogue.store;
export const telegramInvite = "https://t.me/+nfPjj9ktvsYwMWVk";

/** Real BeatStars catalogue (snapshot — see scripts/fetch-beatstars.mjs). */
export const beats: Beat[] = catalogue.beats;
export const kits: Kit[] = catalogue.kits;
/** Full store totals (the tabs show a featured subset). */
export const catalogueTotals = catalogue.totals;

export const socials: Social[] = [
  { name: "BeatStars", sub: "Beats, leases & exclusives", handle: "beatstars.com/rajhl", url: beatstarsStore, icon: "beatstars" },
  { name: "YouTube", sub: "Type beats & breakdowns", handle: "@lukarajhl", url: "https://www.youtube.com/@lukarajhl", icon: "youtube" },
  { name: "Instagram", sub: "Studio & snippets", handle: "@luka.rajhl", url: "https://www.instagram.com/luka.rajhl/", icon: "instagram" },
  { name: "Telegram", sub: "Free loops + first listens", handle: "Private group", url: telegramInvite, icon: "telegram" },
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
 * Placeholder audio for the transport player — a self-contained retro loop so the
 * controls are testable offline. TODO: swap for an NCS track or Luka's own preview
 * by dropping a file in /public/audio and updating `src`/`title`/`total`.
 */
export const nowPlaying = {
  title: "Retro Test Loop",
  artist: "Placeholder — swap for NCS",
  src: "/audio/placeholder-loop.wav",
  total: "0:15",
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
