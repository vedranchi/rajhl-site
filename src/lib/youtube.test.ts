import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  decodeEntities,
  fetchLatestVideo,
  fetchLatestVideos,
  formatPublished,
  mapPlaylistItems,
  uploadsPlaylistId,
} from "./youtube";

/** Captured before any test stubs the env, so the live contract test below can
    tell "no key configured" from "a test stubbed one in". */
const LIVE_KEY = process.env.YOUTUBE_API_KEY;

const TUTORIALS_CHANNEL = "UCMcvYZ58vysUkGQbBfalkxQ";

/** Trimmed copy of a real `playlistItems.list?part=snippet,contentDetails`
    response — three rows, so the mapper has to prove it keeps feed order, and
    the middle one is a private-video placeholder it has to drop. */
const PLAYLIST = {
  kind: "youtube#playlistItemListResponse",
  items: [
    {
      snippet: {
        // The API hands back HTML-escaped titles even in JSON.
        title: "The Most UNDERRATED Instrument &amp; &quot;Sound&quot;",
        // Deliberately different from videoPublishedAt: this is the playlist
        // insertion time, which is not what we want to display.
        publishedAt: "2026-09-01T12:00:00Z",
        resourceId: { kind: "youtube#video", videoId: "GAb5lT1zNiE" },
      },
      contentDetails: {
        videoId: "GAb5lT1zNiE",
        videoPublishedAt: "2026-08-30T01:28:21Z",
      },
    },
    {
      snippet: { title: "Private video", publishedAt: "2026-08-25T00:00:00Z" },
      contentDetails: { videoId: "PRIVATE1234" },
    },
    {
      snippet: {
        title: "How to LARP HOUSE Beats",
        resourceId: { kind: "youtube#video", videoId: "OLDER123456" },
      },
      contentDetails: {
        videoId: "OLDER123456",
        videoPublishedAt: "2026-08-21T22:27:45Z",
      },
    },
  ],
};

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

/** A healthy fetch: one playlistItems call, and deliberately no second one. */
function stubHappyPath() {
  const fetchMock = vi.fn().mockResolvedValue(ok(PLAYLIST));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("YOUTUBE_API_KEY", "test-key");
  // The module logs every giving-up path on purpose; keep the run readable.
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("uploadsPlaylistId", () => {
  it("swaps the UC channel prefix for the UU uploads prefix", () => {
    expect(uploadsPlaylistId(TUTORIALS_CHANNEL)).toBe("UUMcvYZ58vysUkGQbBfalkxQ");
  });

  it("leaves an id that is already a playlist id alone", () => {
    expect(uploadsPlaylistId("UUMcvYZ58vysUkGQbBfalkxQ")).toBe("UUMcvYZ58vysUkGQbBfalkxQ");
  });
});

describe("mapPlaylistItems", () => {
  it("keeps feed order, newest first", () => {
    expect(mapPlaylistItems(PLAYLIST, 3).map((v) => v.id)).toEqual([
      "GAb5lT1zNiE",
      "OLDER123456",
    ]);
  });

  it("drops private and deleted placeholders instead of rendering them", () => {
    expect(mapPlaylistItems(PLAYLIST, 3).map((v) => v.id)).not.toContain("PRIVATE1234");
  });

  it("decodes HTML entities in the title", () => {
    expect(mapPlaylistItems(PLAYLIST, 1)[0].title).toBe(
      'The Most UNDERRATED Instrument & "Sound"',
    );
  });

  it("prefers the upload time over the playlist insertion time", () => {
    const video = mapPlaylistItems(PLAYLIST, 1)[0];
    expect(video.publishedAt).toBe("2026-08-30T01:28:21Z");
    expect(video.publishedLabel).toBe("30 Aug 2026");
  });

  it("falls back to snippet.publishedAt when the upload time is absent", () => {
    const body = { items: [{ snippet: { title: "T", publishedAt: "2026-08-21T22:27:45Z" }, contentDetails: { videoId: "abc" } }] };
    expect(mapPlaylistItems(body, 1)[0].publishedAt).toBe("2026-08-21T22:27:45Z");
  });

  it("pins the thumbnail to the stable ytimg host", () => {
    expect(mapPlaylistItems(PLAYLIST, 1)[0].thumbnail).toBe(
      "https://i.ytimg.com/vi/GAb5lT1zNiE/hqdefault.jpg",
    );
  });

  it("builds the canonical watch url", () => {
    expect(mapPlaylistItems(PLAYLIST, 1)[0].url).toBe(
      "https://www.youtube.com/watch?v=GAb5lT1zNiE",
    );
  });

  it("caps at the limit", () => {
    expect(mapPlaylistItems(PLAYLIST, 1)).toHaveLength(1);
  });

  it("asks for more than the playlist holds without padding the list", () => {
    expect(mapPlaylistItems(PLAYLIST, 10)).toHaveLength(2);
  });

  it("skips an unmappable row instead of dropping the rest", () => {
    const body = { items: [{ snippet: { title: "No id" } }, ...PLAYLIST.items] };
    expect(mapPlaylistItems(body, 3).map((v) => v.id)).toEqual(["GAb5lT1zNiE", "OLDER123456"]);
  });

  it("returns an empty list for an empty or malformed body", () => {
    expect(mapPlaylistItems({ items: [] }, 3)).toEqual([]);
    expect(mapPlaylistItems({}, 3)).toEqual([]);
    expect(mapPlaylistItems(null, 3)).toEqual([]);
    expect(mapPlaylistItems({ items: "not an array" }, 3)).toEqual([]);
  });

});

describe("fetchLatestVideos", () => {
  it("requests the uploads playlist and makes no second call for stats", async () => {
    const fetchMock = stubHappyPath();

    const videos = await fetchLatestVideos(TUTORIALS_CHANNEL, 3);

    // View counts are off the site, so a videos.list leg would be pure waste.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const playlistUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(playlistUrl.origin + playlistUrl.pathname).toBe(
      "https://www.googleapis.com/youtube/v3/playlistItems",
    );
    expect(playlistUrl.searchParams.get("part")).toBe("snippet,contentDetails");
    expect(playlistUrl.searchParams.get("playlistId")).toBe("UUMcvYZ58vysUkGQbBfalkxQ");
    expect(playlistUrl.searchParams.get("key")).toBe("test-key");
    // Over-fetches so dropped placeholders cannot shrink the list below 3.
    expect(Number(playlistUrl.searchParams.get("maxResults"))).toBeGreaterThan(3);

    expect(videos.map((v) => v.id)).toEqual(["GAb5lT1zNiE", "OLDER123456"]);
  });

  it("caches the call for an hour", async () => {
    const fetchMock = stubHappyPath();
    await fetchLatestVideos(TUTORIALS_CHANNEL, 3);
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ next: { revalidate: 3600 } }),
    );
  });

  it("never asks for more than the API's 50-row page", async () => {
    const fetchMock = stubHappyPath();
    await fetchLatestVideos(TUTORIALS_CHANNEL, 50);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(Number(url.searchParams.get("maxResults"))).toBeLessThanOrEqual(50);
  });

  it("returns an empty list and warns when no API key is configured", async () => {
    vi.stubEnv("YOUTUBE_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchLatestVideos(TUTORIALS_CHANNEL, 3)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("YOUTUBE_API_KEY"));
  });

  it("warns loudly on a non-OK response instead of failing silently", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    );

    expect(await fetchLatestVideos(TUTORIALS_CHANNEL, 3)).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("404"));
  });

  it("warns when the response parses but yields nothing renderable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok({ items: [] })));

    expect(await fetchLatestVideos(TUTORIALS_CHANNEL, 3)).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("no renderable uploads"));
  });

  it("returns an empty list when the request throws, so a plate can still render", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await fetchLatestVideos(TUTORIALS_CHANNEL, 3)).toEqual([]);
  });
});

describe("fetchLatestVideo", () => {
  it("returns just the newest upload", async () => {
    stubHappyPath();
    const video = await fetchLatestVideo(TUTORIALS_CHANNEL);
    expect(video?.id).toBe("GAb5lT1zNiE");
    expect(video?.publishedLabel).toBe("30 Aug 2026");
  });

  it("returns null on failure, so the hero can fall back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await fetchLatestVideo(TUTORIALS_CHANNEL)).toBeNull();
  });
});

describe("decodeEntities", () => {
  it("decodes named, decimal and hex entities", () => {
    expect(decodeEntities("a &amp; b")).toBe("a & b");
    expect(decodeEntities("it&#39;s")).toBe("it's");
    expect(decodeEntities("&#x2764;")).toBe("❤");
  });

  it("leaves an unknown entity untouched rather than mangling it", () => {
    expect(decodeEntities("100&nope; ok")).toBe("100&nope; ok");
  });
});

describe("formatPublished", () => {
  it("formats an ISO date in UTC", () => {
    expect(formatPublished("2026-08-30T01:28:21Z")).toBe("30 Aug 2026");
  });

  it("returns null for an unparseable date", () => {
    expect(formatPublished("not a date")).toBeNull();
  });
});

/**
 * The regression this module exists because of was upstream going away while
 * every fixture-backed test stayed green. This one talks to the real API, so a
 * retired endpoint or a changed response shape fails here instead of quietly
 * emptying the deployed page.
 *
 * Skipped when no YOUTUBE_API_KEY is configured, so it never flakes a CI run
 * that has no credentials.
 */
describe.skipIf(!LIVE_KEY)("live Data API contract", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubEnv("YOUTUBE_API_KEY", LIVE_KEY!);
  });

  it("returns real uploads for the tutorials channel", async () => {
    const videos = await fetchLatestVideos(TUTORIALS_CHANNEL, 3);

    expect(videos.length).toBeGreaterThan(0);
    for (const video of videos) {
      expect(video.id).toMatch(/^[\w-]{11}$/);
      expect(video.title.length).toBeGreaterThan(0);
      expect(video.title).not.toMatch(/&(amp|quot|#\d+);/);
      expect(video.publishedAt).not.toBeNull();
      expect(video.publishedLabel).not.toBeNull();
    }
  }, 20_000);
});
