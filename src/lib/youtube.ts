/**
 * Latest upload from a YouTube channel, read from the channel's public Atom
 * feed (`/feeds/videos.xml`). No API key, no SDK, no committed snapshot: the
 * feed is public, cheap, and always current.
 *
 * The feed carries everything the hero card needs — video id, title, thumbnail,
 * publish date and a view count — so there is no second request for stats.
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
  /** Pre-formatted for display, e.g. "12K views". Null when the feed omits it. */
  viewsLabel: string | null;
};

const FEED_BASE = "https://www.youtube.com/feeds/videos.xml?channel_id=";

/** One hour: the tutorials channel posts roughly monthly, so anything tighter
    is wasted revalidation. */
export const LATEST_VIDEO_REVALIDATE_SECONDS = 3600;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeXml(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCodePoint(parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) return String.fromCodePoint(Number(entity.slice(1)));
    return NAMED_ENTITIES[entity] ?? match;
  });
}

/** "5.0K" reads like a rounding artefact, so a whole thousand loses the ".0". */
function trimZero(value: string): string {
  return value.endsWith(".0") ? value.slice(0, -2) : value;
}

export function formatViews(views: number): string {
  if (!Number.isFinite(views) || views < 0) return "";
  if (views >= 1_000_000) {
    return `${trimZero((views / 1_000_000).toFixed(views >= 10_000_000 ? 0 : 1))}M views`;
  }
  if (views >= 10_000) return `${Math.round(views / 1000)}K views`;
  if (views >= 1000) return `${trimZero((views / 1000).toFixed(1))}K views`;
  return `${views} ${views === 1 ? "view" : "views"}`;
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

/** Pull the newest entries out of a channel feed, newest first. Pure, so it is
    unit-tested against a real feed fixture rather than only over the network. */
export function parseVideos(xml: string, limit = 1): LatestVideo[] {
  const videos: LatestVideo[] = [];
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    if (videos.length >= limit) break;
    const video = parseEntry(match[1]);
    if (video) videos.push(video);
  }
  return videos;
}

export function parseLatestVideo(xml: string): LatestVideo | null {
  return parseVideos(xml, 1)[0] ?? null;
}

function parseEntry(entry: string): LatestVideo | null {
  const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
  const rawTitle = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  if (!id || !rawTitle) return null;

  const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1]?.trim() ?? null;
  const views = entry.match(/<media:statistics[^>]*\bviews="(\d+)"/)?.[1];

  return {
    id,
    title: decodeXml(rawTitle).trim(),
    url: `https://www.youtube.com/watch?v=${id}`,
    // The feed's own thumbnail host varies (i2/i4.ytimg.com); i.ytimg.com is the
    // stable one and always has hqdefault.
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    publishedAt,
    publishedLabel: publishedAt ? formatPublished(publishedAt) : null,
    viewsLabel: views ? formatViews(Number(views)) : null,
  };
}

/**
 * Fetch a channel's newest uploads, newest first. Returns an empty list on any
 * failure: every caller renders a fallback rather than an empty hole, so a
 * YouTube outage can never break the homepage.
 */
export async function fetchLatestVideos(channelId: string, limit = 1): Promise<LatestVideo[]> {
  try {
    const res = await fetch(`${FEED_BASE}${encodeURIComponent(channelId)}`, {
      next: { revalidate: LATEST_VIDEO_REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    return parseVideos(await res.text(), limit);
  } catch {
    return [];
  }
}

export async function fetchLatestVideo(channelId: string): Promise<LatestVideo | null> {
  return (await fetchLatestVideos(channelId, 1))[0] ?? null;
}
