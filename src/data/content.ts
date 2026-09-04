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
  /** What the destination is *for*, not which platform it is — the two YouTube
      channels are told apart here, and the icon carries the platform. */
  name: string;
  sub: string;
  handle: string;
  url: string;
  icon: SocialKind;
};
/** BeatStars store root + private Telegram group. */
export const beatstarsStore = catalogue.store;
/** The two YouTube channels, which serve different purposes: the tutorials
    channel ("Luka Rajhl") publishes production breakdowns and how-tos; the
    type-beat channel ("lukarajhl", @rajhlski) publishes free type beats.
    Verified against both channels' upload feeds, so don't swap them.

    Both are keyed by channel ID because that is the only form the Atom feed
    accepts (`/feeds/videos.xml?channel_id=`), and it survives a vanity-handle
    change. The tutorials channel keeps its @handle URL for humans, since that
    is the link the client shares. */
export const youtubeTutorialsChannelId = "UCMcvYZ58vysUkGQbBfalkxQ";
export const youtubeTypeBeatsChannelId = "UCU6-wec8KCUzF-qfDaq37oA";
export const youtubeTutorials = "https://www.youtube.com/@lukarajhl";
export const youtubeTypeBeats = `https://www.youtube.com/channel/${youtubeTypeBeatsChannelId}`;

export type YoutubeChannel = {
  /** React key and CSS hook. */
  key: string;
  /** What the channel is for. It is the card's title: the platform is obvious
      from the icon, the purpose is not. */
  name: string;
  /** What a visitor gets if they subscribe. One sentence. */
  blurb: string;
  handle: string;
  channelId: string;
  url: string;
  /** `?sub_confirmation=1` opens YouTube with the subscribe prompt already up. */
  subscribeUrl: string;
};

export const youtubeChannels: YoutubeChannel[] = [
  {
    key: "tutorials",
    name: "Tutorials",
    blurb: "How I make the beats, song breakdowns and producer tips",
    handle: "@lukarajhl",
    channelId: youtubeTutorialsChannelId,
    url: youtubeTutorials,
    subscribeUrl: `${youtubeTutorials}?sub_confirmation=1`,
  },
  {
    key: "type-beats",
    name: "Type Beats",
    blurb: "Free beats to write and record over. New ones most weeks.",
    handle: "@rajhlski",
    channelId: youtubeTypeBeatsChannelId,
    url: youtubeTypeBeats,
    subscribeUrl: `${youtubeTypeBeats}?sub_confirmation=1`,
  },
];

export const telegramInvite = "https://t.me/+nfPjj9ktvsYwMWVk";

/** Real BeatStars catalogue (top-10 snapshot — see scripts/fetch-beatstars.mjs). */
export const beats: Beat[] = catalogue.beats;

/**
 * Client-authored kit descriptions, matched on the kit title. BeatStars' own
 * blurbs are marketing prose that the fetch script has to truncate; these say
 * what is actually in the box. They live here, not in
 * `beatstars-catalogue.json`, because the scheduled refresh rewrites that file
 * (CLAUDE.md P3/G6). Kits with no entry keep their BeatStars blurb.
 */
const kitDescriptions: { match: string; meta: string }[] = [
  { match: "EXIMIA", meta: "100 vocal chops" },
  { match: "SEPIA", meta: "70 VOCAL CHOPS, 30 ONE SHOTS, 70 drum sounds" },
  {
    match: "BUNDLE",
    meta:
      "300+ SOUNDS INCLUDING 190 DRUM SOUNDS, 20 FREE LOOPS, 35 VOCAL CHOPS, " +
      "10 STARTERS, 35 ONE SHOTS AND 3 MIXER TRACKS",
  },
  // Must stay after BUNDLE: the bundle's title also contains "LUKARAJHL STASH
  // KIT", and the first match in this list wins.
  { match: "LUKARAJHL STASH", meta: "190 drum SOUNDS" },
];

export const kits: Kit[] = catalogue.kits.map((k) => {
  const override = kitDescriptions.find((d) => k.file.toUpperCase().includes(d.match));
  return override ? { ...k, meta: override.meta } : k;
});

/** Full store totals (the page shows the most-popular subset). */
export const catalogueTotals = catalogue.totals;
export const catalogueShown = catalogue.shown;
export const hasMoreBeats = catalogueTotals.beats > catalogueShown.beats;
export const hasMoreKits = catalogueTotals.kits > catalogueShown.kits;

/** The kit featured beside the Sound Kits list: the bundle, which is the most
    sounds for the money and the widest piece of artwork in the section. The
    rest of the kits fill the ruled list next to it. */
export const bundleKit: Kit | undefined =
  kits.find((k) => k.file.toUpperCase().includes("BUNDLE")) ?? kits[0];
export const listedKits: Kit[] = kits.filter((k) => k !== bundleKit);

/** Newest kit, featured beside the hero title. Matched by name so a catalogue
    refresh can't drop it; falls back to the first kit if it ever disappears. */
export const featuredKit: Kit | undefined =
  kits.find((k) => k.file.toUpperCase().includes("EXIMIA")) ?? kits[0];

/** Everywhere else, under the two channel plates. The YouTube channels are not
    in here: they are the section's subject, not one of its footnotes. */
export const socials: Social[] = [
  { name: "Beat Store", sub: "Leases and exclusives", handle: "beatstars.com/rajhl", url: beatstarsStore, icon: "beatstars" },
  { name: "Instagram", sub: "Studio and snippets", handle: "@luka.rajhl", url: "https://www.instagram.com/luka.rajhl/", icon: "instagram" },
  { name: "Telegram", sub: "Free loops and early demos", handle: "Private group", url: telegramInvite, icon: "telegram" },
];

/** The four Channels-tab badges (subscribe / follow / join / store). */
export const channelBadges: { label: string; url: string }[] = [
  { label: "TUTORIALS ►", url: `${youtubeTutorials}?sub_confirmation=1` },
  { label: "TYPE BEATS ►", url: `${youtubeTypeBeats}?sub_confirmation=1` },
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
