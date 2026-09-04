import { describe, it, expect, vi, afterEach } from "vitest";

import {
  fetchLatestVideo,
  formatPublished,
  formatViews,
  parseLatestVideo,
} from "./youtube";

/** Trimmed copy of a real response from
    youtube.com/feeds/videos.xml?channel_id=UCMcvYZ58vysUkGQbBfalkxQ — two
    entries, so the parser has to prove it takes the first. */
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
 <title>Luka Rajhl</title>
 <entry>
  <id>yt:video:GAb5lT1zNiE</id>
  <yt:videoId>GAb5lT1zNiE</yt:videoId>
  <title>The Most UNDERRATED Instrument &amp; &quot;Sound&quot;</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=GAb5lT1zNiE"/>
  <published>2026-08-30T01:28:21+00:00</published>
  <media:group>
   <media:title>The Most UNDERRATED Instrument</media:title>
   <media:thumbnail url="https://i4.ytimg.com/vi/GAb5lT1zNiE/hqdefault.jpg" width="480" height="360"/>
   <media:community>
    <media:starRating count="33" average="5.00" min="1" max="5"/>
    <media:statistics views="593"/>
   </media:community>
  </media:group>
 </entry>
 <entry>
  <yt:videoId>OLDER123456</yt:videoId>
  <title>How to LARP HOUSE Beats</title>
  <published>2026-08-21T22:27:45+00:00</published>
 </entry>
</feed>`;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseLatestVideo", () => {
  it("reads the newest entry, not a later one", () => {
    const video = parseLatestVideo(FEED);
    expect(video?.id).toBe("GAb5lT1zNiE");
    expect(video?.url).toBe("https://www.youtube.com/watch?v=GAb5lT1zNiE");
  });

  it("decodes XML entities in the title", () => {
    expect(parseLatestVideo(FEED)?.title).toBe('The Most UNDERRATED Instrument & "Sound"');
  });

  it("does not mistake <media:title> for the video title", () => {
    expect(parseLatestVideo(FEED)?.title).not.toBe("The Most UNDERRATED Instrument");
  });

  it("pins the thumbnail to the stable ytimg host", () => {
    expect(parseLatestVideo(FEED)?.thumbnail).toBe(
      "https://i.ytimg.com/vi/GAb5lT1zNiE/hqdefault.jpg",
    );
  });

  it("formats the publish date and view count for display", () => {
    const video = parseLatestVideo(FEED);
    expect(video?.publishedAt).toBe("2026-08-30T01:28:21+00:00");
    expect(video?.publishedLabel).toBe("30 Aug 2026");
    expect(video?.viewsLabel).toBe("593 views");
  });

  it("returns null for a feed with no entries", () => {
    expect(parseLatestVideo("<feed><title>Luka Rajhl</title></feed>")).toBeNull();
  });

  it("returns null when the entry has no video id", () => {
    expect(parseLatestVideo("<feed><entry><title>Broken</title></entry></feed>")).toBeNull();
  });

  it("survives a missing statistics block", () => {
    const video = parseLatestVideo(
      "<feed><entry><yt:videoId>abc</yt:videoId><title>No stats</title></entry></feed>",
    );
    expect(video?.viewsLabel).toBeNull();
    expect(video?.publishedLabel).toBeNull();
  });
});

describe("formatViews", () => {
  it("keeps small counts exact and singular-aware", () => {
    expect(formatViews(1)).toBe("1 view");
    expect(formatViews(0)).toBe("0 views");
    expect(formatViews(593)).toBe("593 views");
  });

  it("abbreviates thousands and millions", () => {
    expect(formatViews(1500)).toBe("1.5K views");
    expect(formatViews(12_400)).toBe("12K views");
    expect(formatViews(1_250_000)).toBe("1.3M views");
    expect(formatViews(24_000_000)).toBe("24M views");
  });
});

describe("formatPublished", () => {
  it("formats an ISO date in UTC", () => {
    expect(formatPublished("2026-08-30T01:28:21+00:00")).toBe("30 Aug 2026");
  });

  it("returns null for an unparseable date", () => {
    expect(formatPublished("not a date")).toBeNull();
  });
});

describe("fetchLatestVideo", () => {
  it("requests the channel's feed and parses it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => FEED });
    vi.stubGlobal("fetch", fetchMock);

    const video = await fetchLatestVideo("UCMcvYZ58vysUkGQbBfalkxQ");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCMcvYZ58vysUkGQbBfalkxQ",
      expect.objectContaining({ next: { revalidate: 3600 } }),
    );
    expect(video?.id).toBe("GAb5lT1zNiE");
  });

  it("returns null on a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, text: async () => "" }));
    expect(await fetchLatestVideo("UC123")).toBeNull();
  });

  it("returns null when the request throws, so the hero can fall back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await fetchLatestVideo("UC123")).toBeNull();
  });
});
