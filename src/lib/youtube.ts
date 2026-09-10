/**
 * Latest uploads from a YouTube channel, read from the YouTube Data API v3.
 *
 * This used to read the channel's public Atom feed
 * (`youtube.com/feeds/videos.xml?channel_id=…`). YouTube retired that endpoint:
 * it now 404s for every channel id — ours, and equally a control channel that is
 * very much alive — while the bare path still 400s, so the route survives and
 * only the content is gone. The Data API is the documented, supported
 * replacement (CLAUDE.md P6).
 *
 * Cost is negligible against the default 10,000 units/day: `playlistItems.list`
 * is 1 unit, so a channel costs 1 unit per revalidate — ~48/day for both
 * channels at the hourly window below. There is deliberately no `videos.list`
 * call for view counts: the client asked for view counts off the site, so
 * fetching them would be a second request per channel feeding nothing.
 *
 * Dates and counts are formatted here rather than in the component: React 19's
 * `react-hooks/purity` rule forbids `new Date()` inside render (CLAUDE.md DS5).
 */

export type LatestVideo = {
  id: string;
  title: string;
  /** Canonical watch URL. */
  url: string;
  thumbnail: string;
  /** ISO timestamp, kept for `<time dateTime>`. */
  publishedAt: string | null;
  /** Pre-formatted for display, e.g. "30 Aug 2026". */
  publishedLabel: string | null;
};

const API_BASE = "https://www.googleapis.com/youtube/v3";

/** One hour: the tutorials channel posts roughly monthly, so anything tighter
    is wasted revalidation. */
export const LATEST_VIDEO_REVALIDATE_SECONDS = 3600;

/** The API caps a page at 50 regardless of what we ask for. */
const MAX_PAGE = 50;

/** Uploads-playlist rows for videos that went private or were deleted keep their
    slot but lose their real title. They are not renderable, so they are skipped. */
const PLACEHOLDER_TITLES = new Set(["Private video", "Deleted video"]);

/**
 * The failure this module is guarding against is upstream going away quietly, so
 * every giving-up path says so in the server log rather than returning `[]` in
 * silence. The callers still render a fallback — the point is that the next
 * outage leaves a trace in Vercel's logs instead of an empty section nobody can
 * explain.
 */
function warn(message: string): void {
  console.warn(`[youtube] ${message}`);
}

/**
 * A channel's uploads playlist is its channel id with the `UC` prefix swapped
 * for `UU`. This is a documented, stable property of the id scheme and saves a
 * `channels.list` call (and a unit) per channel.
 */
export function uploadsPlaylistId(channelId: string): string {
  return channelId.startsWith("UC") ? `UU${channelId.slice(2)}` : channelId;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** The Data API returns titles HTML-escaped (`&amp;`, `&#39;`) even though the
    payload is JSON, so they still need decoding before they reach the DOM. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCodePoint(parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) return String.fromCodePoint(Number(entity.slice(1)));
    return NAMED_ENTITIES[entity] ?? match;
  });
}

export function formatPublished(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

type PlaylistItem = {
  snippet?: {
    title?: string;
    publishedAt?: string;
    resourceId?: { videoId?: string };
  };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
};

/**
 * Map a `playlistItems.list` body to renderable videos, newest first. Pure, so
 * the response shape is unit-tested against a real payload rather than only over
 * the network.
 */
export function mapPlaylistItems(body: unknown, limit = 1): LatestVideo[] {
  const items = (body as { items?: unknown })?.items;
  if (!Array.isArray(items)) return [];

  const videos: LatestVideo[] = [];
  for (const item of items as PlaylistItem[]) {
    if (videos.length >= limit) break;
    const video = mapItem(item);
    if (video) videos.push(video);
  }
  return videos;
}

function mapItem(item: PlaylistItem): LatestVideo | null {
  const id = item?.contentDetails?.videoId ?? item?.snippet?.resourceId?.videoId;
  const rawTitle = item?.snippet?.title;
  if (!id || !rawTitle || PLACEHOLDER_TITLES.has(rawTitle)) return null;

  // `snippet.publishedAt` is when the video joined the playlist; the upload time
  // is `contentDetails.videoPublishedAt`. They differ, so prefer the real one.
  const publishedAt =
    item?.contentDetails?.videoPublishedAt ?? item?.snippet?.publishedAt ?? null;

  return {
    id,
    title: decodeEntities(rawTitle).trim(),
    url: `https://www.youtube.com/watch?v=${id}`,
    // The API returns several thumbnail sizes on shifting hosts; i.ytimg.com is
    // the stable one and always has hqdefault.
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    publishedAt,
    publishedLabel: publishedAt ? formatPublished(publishedAt) : null,
  };
}

async function getJson(url: string): Promise<unknown | null> {
  const res = await fetch(url, { next: { revalidate: LATEST_VIDEO_REVALIDATE_SECONDS } });
  if (!res.ok) {
    warn(`${new URL(url).pathname} responded ${res.status}`);
    return null;
  }
  return res.json();
}

/**
 * Fetch a channel's newest uploads, newest first. Returns an empty list on any
 * failure: every caller renders a fallback rather than an empty hole, so a
 * YouTube outage can never break the homepage.
 */
export async function fetchLatestVideos(channelId: string, limit = 1): Promise<LatestVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    warn("YOUTUBE_API_KEY is not set — channel uploads will not render");
    return [];
  }

  try {
    // Ask for a few extra rows so skipped private/deleted placeholders cannot
    // shrink the list below the requested limit.
    const playlistUrl = new URL(`${API_BASE}/playlistItems`);
    playlistUrl.searchParams.set("part", "snippet,contentDetails");
    playlistUrl.searchParams.set("playlistId", uploadsPlaylistId(channelId));
    playlistUrl.searchParams.set("maxResults", String(Math.min(MAX_PAGE, limit + 5)));
    playlistUrl.searchParams.set("key", key);

    const videos = mapPlaylistItems(await getJson(playlistUrl.toString()), limit);
    if (videos.length === 0) warn(`no renderable uploads for ${channelId}`);
    return videos;
  } catch (error) {
    warn(`request failed for ${channelId}: ${(error as Error).message}`);
    return [];
  }
}

export async function fetchLatestVideo(channelId: string): Promise<LatestVideo | null> {
  return (await fetchLatestVideos(channelId, 1))[0] ?? null;
}
