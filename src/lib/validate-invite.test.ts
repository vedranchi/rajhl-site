import { describe, it, expect } from "vitest";

import { validateInvite } from "./validate-invite";

describe("validateInvite", () => {
  it("accepts a plain handle and returns a canonical lowercased @handle", () => {
    expect(validateInvite("Luka")).toEqual({ ok: true, instagram: "@luka" });
  });

  it("keeps an already-@-prefixed handle single-@", () => {
    expect(validateInvite("@luka.rajhl")).toEqual({ ok: true, instagram: "@luka.rajhl" });
  });

  it("allows periods and underscores, which Instagram does", () => {
    expect(validateInvite("luka_rajhl.beats")).toEqual({ ok: true, instagram: "@luka_rajhl.beats" });
  });

  it("trims surrounding whitespace", () => {
    expect(validateInvite("  luka  ")).toEqual({ ok: true, instagram: "@luka" });
  });

  it("reduces a pasted profile URL to the handle", () => {
    for (const url of [
      "https://www.instagram.com/luka.rajhl/",
      "http://instagram.com/luka.rajhl",
      "instagram.com/luka.rajhl?hl=en",
      "https://www.instagram.com/luka.rajhl/reels/",
    ]) {
      expect(validateInvite(url)).toEqual({ ok: true, instagram: "@luka.rajhl" });
    }
  });

  it("accepts the maximum length Instagram allows", () => {
    const handle = "a".repeat(30);
    expect(validateInvite(handle)).toEqual({ ok: true, instagram: `@${handle}` });
  });

  it("rejects a handle over 30 characters", () => {
    expect(validateInvite("a".repeat(31)).ok).toBe(false);
  });

  it("rejects spaces and characters Instagram does not allow", () => {
    for (const bad of ["luka rajhl", "luka-rajhl", "luka@rajhl", "luka/rajhl", "<script>"]) {
      expect(validateInvite(bad).ok).toBe(false);
    }
  });

  it("rejects a leading or trailing period", () => {
    expect(validateInvite(".luka").ok).toBe(false);
    expect(validateInvite("luka.").ok).toBe(false);
  });

  it("rejects empty, whitespace-only and bare-@ input", () => {
    for (const bad of ["", "   ", "@"]) {
      const res = validateInvite(bad);
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.error).toMatch(/required/);
    }
  });

  it("rejects a non-string, so a malformed POST cannot reach the database", () => {
    for (const bad of [undefined, null, 42, {}, [], new File([], "x.mp3")]) {
      expect(validateInvite(bad).ok).toBe(false);
    }
  });
});
