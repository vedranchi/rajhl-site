/**
 * Placeholder site content for the Luka Rajhl retro landing.
 * TODO: replace with real catalogue + links, and later source from Payload CMS.
 */

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
  "LEASES FROM $29",
  "MADE IN SKOPJE",
];

/** Store root — per-beat/per-kit deep links pending from the client. */
export const beatstarsStore = "https://www.beatstars.com/rajhl";

export const beats: Beat[] = [
  { n: "▶", title: "Nightbus", bpm: 142, key: "F# min", time: "2:38", buyUrl: beatstarsStore, playing: true },
  { n: "02", title: "Velvet Static", bpm: 88, key: "D min", time: "3:04", buyUrl: beatstarsStore },
  { n: "03", title: "Skopje 3AM", bpm: 130, key: "A min", time: "2:15", buyUrl: beatstarsStore },
  { n: "04", title: "Amber Room", bpm: 96, key: "C# min", time: "2:52", buyUrl: beatstarsStore },
  { n: "05", title: "Cassette Sunday", bpm: 74, key: "G min", time: "3:21", buyUrl: beatstarsStore },
];

export const kits: Kit[] = [
  { file: "Vardar_Drums_Vol.1.zip", meta: "60 one-shots · 148 MB · royalty-free", price: "$24", buyUrl: beatstarsStore },
  { file: "Analog_Dust_Textures.zip", meta: "42 loops · 96 MB · 24-bit WAV", price: "$19", buyUrl: beatstarsStore },
  { file: "808_Liturgy.zip", meta: "30 basses · 61 MB · tuned + labelled", price: "$15", buyUrl: beatstarsStore },
];

export const socials: Social[] = [
  { name: "BeatStars", sub: "Beats, leases & exclusives", handle: "beatstars.com/rajhl", url: "https://www.beatstars.com/rajhl", icon: "beatstars" },
  { name: "YouTube", sub: "Type beats & breakdowns", handle: "@lukarajhl", url: "https://www.youtube.com/@lukarajhl", icon: "youtube" },
  { name: "Instagram", sub: "Studio & snippets", handle: "@luka.rajhl", url: "https://www.instagram.com/luka.rajhl/", icon: "instagram" },
  { name: "Telegram", sub: "Free loops + first listens", handle: "t.me/lukarajhl", url: "#", icon: "telegram" },
];

/** Spotify playlist embedded in the Playlist tab (official embed iframe). */
export const spotifyPlaylist = {
  id: "7JRpQCqP4BIrO0Wk35MaMD",
  embedUrl: "https://open.spotify.com/embed/playlist/7JRpQCqP4BIrO0Wk35MaMD?utm_source=generator&theme=0",
  openUrl: "https://open.spotify.com/playlist/7JRpQCqP4BIrO0Wk35MaMD",
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

export const nowPlaying = {
  title: "Nightbus",
  artist: "Luka Rajhl",
  elapsed: "01:12",
  total: "02:38",
};
