import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted so the vi.mock factory (which is itself hoisted above imports) can
// reference it. Every test drives the fake Resend transport through this.
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return { emails: { send: sendMock } };
  }),
}));

import { sendInviteEmail } from "./invite-email";

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV, RESEND_API_KEY: "re_test", INVITE_NOTIFY_TO: "owner@example.com" };
  delete process.env.INVITE_FROM;
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });
});

afterEach(() => {
  process.env = OLD_ENV;
});

const doc = {
  instagram: "@luka",
  ip: "203.0.113.5",
  createdAt: "2026-07-12T10:00:00.000Z",
};

describe("sendInviteEmail", () => {
  it("returns ok and sends with the correct payload shape", async () => {
    const res = await sendInviteEmail(doc);

    expect(res).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe("owner@example.com");
    // No applicant email is collected, so there is nothing to reply to.
    expect(payload.replyTo).toBeUndefined();
    expect(payload.from).toBe("Private Telegram <onboarding@resend.dev>"); // fallback
    expect(payload.subject).toBe("@luka would like to join your private Telegram group");
    expect(payload.text).toContain("@luka");
    expect(payload.text).toContain("203.0.113.5");
    expect(payload.text).toContain("2026-07-12T10:00:00.000Z");
  });

  it("uses INVITE_FROM when set", async () => {
    process.env.INVITE_FROM = "Luka <hi@lukarajhl.com>";
    await sendInviteEmail(doc);
    expect(sendMock.mock.calls[0][0].from).toBe("Luka <hi@lukarajhl.com>");
  });

  it("returns {ok:false} without sending when env is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await sendInviteEmail(doc);
    expect(res.ok).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns {ok:false} (never throws) when Resend returns an error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    const res = await sendInviteEmail(doc);
    expect(res).toEqual({ ok: false, error: "domain not verified" });
  });

  it("returns {ok:false} (never throws) when the transport throws", async () => {
    sendMock.mockRejectedValue(new Error("network down"));
    const res = await sendInviteEmail(doc);
    expect(res).toEqual({ ok: false, error: "network down" });
  });

  it("falls back to the current time when createdAt is absent", async () => {
    const res = await sendInviteEmail({ username: "@x", email: "y@z.com" });
    expect(res).toEqual({ ok: true });
    expect(sendMock.mock.calls[0][0].text).toContain("IP Address\n----------\nunavailable");
  });
});
