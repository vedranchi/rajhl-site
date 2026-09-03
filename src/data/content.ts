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
  /** BeatStars cover art (400px webp), or null when the beat has none. */
  image: string | null;
  /** Derived from BeatStars price + free/exclusive flags. See the fetch script. */
  license: { label: string; price: string | null };
  buyUrl: string;
  stream: string;
  playing?: boolean;
};

export type Kit = {
  file: string;
  meta: string;
  price: string;
  /** BeatStars CDN artwork (400px webp), or null when the kit has none. */
  image: string | null;
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
/** BeatStars store root + private Telegram group. */
export const beatstarsStore = catalogue.store;
/** The two YouTube channels. The second is addressed by channel ID — stable even if
    its @rajhlski vanity handle changes. */
export const youtubeMain = "https://www.youtube.com/@lukarajhl";
export const youtubeSecond = "https://www.youtube.com/channel/UCU6-wec8KCUzF-qfDaq37oA";

export const telegramInvite = "https://t.me/+nfPjj9ktvsYwMWVk";

/** Real BeatStars catalogue (top-10 snapshot — see scripts/fetch-beatstars.mjs). */
export const beats: Beat[] = catalogue.beats;
export const kits: Kit[] = catalogue.kits;
/** Full store totals (the page shows the most-popular subset). */
export const catalogueTotals = catalogue.totals;
export const catalogueShown = catalogue.shown;
export const hasMoreBeats = catalogueTotals.beats > catalogueShown.beats;
export const hasMoreKits = catalogueTotals.kits > catalogueShown.kits;

/** Newest kit, featured beside the hero title. Matched by name so a catalogue
    refresh can't drop it; falls back to the first kit if it ever disappears. */
export const featuredKit: Kit | undefined =
  kits.find((k) => k.file.toUpperCase().includes("EXIMIA")) ?? kits[0];

export const socials: Social[] = [
  { name: "My Beat Store", sub: "Beats, leases & exclusives", handle: "beatstars.com/rajhl", url: beatstarsStore, icon: "beatstars" },
  { name: "YouTube", sub: "Type beats & breakdowns", handle: "@lukarajhl", url: youtubeMain, icon: "youtube" },
  { name: "YouTube", sub: "Second channel", handle: "@rajhlski", url: youtubeSecond, icon: "youtube" },
  { name: "Instagram", sub: "Studio & snippets", handle: "@luka.rajhl", url: "https://www.instagram.com/luka.rajhl/", icon: "instagram" },
  { name: "Telegram", sub: "Free loops & early demos", handle: "Private group", url: telegramInvite, icon: "telegram" },
];

/** The four Channels-tab badges (subscribe / follow / join / store). */
export const channelBadges: { label: string; url: string }[] = [
  { label: "SUBSCRIBE ►", url: `${youtubeMain}?sub_confirmation=1` },
  { label: "SUBSCRIBE 2 ►", url: `${youtubeSecond}?sub_confirmation=1` },
  { label: "FOLLOW ★", url: "https://www.instagram.com/luka.rajhl/" },
  { label: "JOIN ✈", url: telegramInvite },
  { label: "BEATSTARS ♪", url: beatstarsStore },
];

/** Spotify playlist embedded next to the invite form (official embed iframe). */
export const spotifyPlaylist = {
  id: "7JRpQCqP4BIrO0Wk35MaMD",
  /** Spotify IFrame API addresses content by URI, not embed URL. */
  uri: "spotify:playlist:7JRpQCqP4BIrO0Wk35MaMD",
  embedUrl: "https://open.spotify.com/embed/playlist/7JRpQCqP4BIrO0Wk35MaMD?utm_source=generator&theme=0",
  openUrl: "https://open.spotify.com/playlist/7JRpQCqP4BIrO0Wk35MaMD",
};

export type PlaylistTrack = {
  title: string;
  artist: string;
  src: string;
  total: string;
  plays: number;
  image: string | null;
  license: { label: string; price: string | null };
  buyUrl: string;
};

/**
 * Browser transport playlist — every beat shown on the front page (the top-10
 * snapshot), each streamed from BeatStars (a client-side preview, embed-like).
 * The Skip control shuffles across this list. Track 0 is the most-popular beat,
 * matching what the table shows as "now playing".
 */
export const playlist: PlaylistTrack[] = beats.map((b) => ({
  title: b.title,
  artist: "Luka Rajhl",
  src: b.stream,
  total: b.time || "0:00",
  plays: b.plays,
  image: b.image,
  license: b.license,
  buyUrl: b.buyUrl,
}));

/**
 * Initial transport state. `fallbackSrc` is a self-contained retro loop used if
 * a stream fails to load, so the player always works.
 */
const top = catalogue.topBeat;
export const nowPlaying = {
  title: top?.title ?? "Retro Test Loop",
  artist: top?.artist ?? "Luka Rajhl",
  image: top?.image ?? null,
  src: top?.stream ?? "/audio/placeholder-loop.wav",
  fallbackSrc: "/audio/placeholder-loop.wav",
  total: top?.total || "0:15",
  buyUrl: top?.buyUrl ?? beatstarsStore,
};
