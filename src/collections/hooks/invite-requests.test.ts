import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// afterChange delegates the send to sendInviteEmail — mock it so the hook tests
// stay pure (no Resend). Hoisted so the vi.mock factory can reference it.
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock("@/lib/invite-email", () => ({ sendInviteEmail: sendMock }));

import {
  inviteAfterChange,
  inviteAfterOperation,
  inviteBeforeChange,
  inviteBeforeValidate,
} from "./invite-requests";

type HookArg = Parameters<typeof inviteBeforeValidate>[0];

// The hook reads `data` + `operation`; cast a minimal arg for the unit test.
function run(data: Record<string, unknown> | undefined, operation = "create") {
  return inviteBeforeValidate({ data, operation } as unknown as HookArg);
}

describe("inviteBeforeValidate", () => {
  it("normalises username to a canonical @handle and lowercases the email", () => {
    const out = run({ username: "Luka", email: "Fan@Example.COM" });
    expect(out).toMatchObject({ username: "@Luka", email: "fan@example.com" });
  });

  it("keeps an already-@-prefixed username single-@", () => {
    const out = run({ username: "@luka", email: "a@b.co" });
    expect(out?.username).toBe("@luka");
  });

  it("throws the validator message on a bad username", () => {
    expect(() => run({ username: "ab", email: "a@b.co" })).toThrow(/3–32 characters/);
  });

  it("throws the validator message on a bad email", () => {
    expect(() => run({ username: "luka", email: "not-an-email" })).toThrow(/doesn't look valid/);
  });

  it("skips identity validation on a partial update that omits username/email", () => {
    const out = run({ status: "emailed", emailSentAt: "2026-07-12T10:00:00.000Z" });
    expect(out).toMatchObject({ status: "emailed" });
    expect(out?.username).toBeUndefined();
  });

  it("caps an over-long user agent at 500 chars", () => {
    const out = run({ username: "luka", email: "a@b.co", userAgent: "x".repeat(900) });
    expect((out?.userAgent as string).length).toBe(500);
  });

  it("defaults source to invite-form when absent", () => {
    const out = run({ username: "luka", email: "a@b.co" });
    expect(out?.source).toBe("invite-form");
  });

  it("leaves an explicit source untouched", () => {
    const out = run({ username: "luka", email: "a@b.co", source: "second-cta" });
    expect(out?.source).toBe("second-cta");
  });

  it("does not default source on an update (avoids clobbering the afterChange pass)", () => {
    const out = run({ status: "emailed" }, "update");
    expect(out?.source).toBeUndefined();
  });
});

type ChangeArg = Parameters<typeof inviteBeforeChange>[0];

function changeArg(data: Record<string, unknown>, operation: string, countResult: number) {
  const count = vi.fn().mockResolvedValue({ totalDocs: countResult });
  const arg = { data, operation, req: { payload: { count } } } as unknown as ChangeArg;
  return { arg, count };
}

describe("inviteBeforeChange (dedupe)", () => {
  const OLD_ENV = process.env;
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("does not query or change anything on a non-create operation", async () => {
    const { arg, count } = changeArg({ email: "a@b.co", status: "new" }, "update", 1);
    const out = await inviteBeforeChange(arg);
    expect(count).not.toHaveBeenCalled();
    expect(out?.status).toBe("new");
  });

  it("leaves status untouched when no prior lead exists in the window", async () => {
    const { arg } = changeArg({ email: "a@b.co", status: "new" }, "create", 0);
    const out = await inviteBeforeChange(arg);
    expect(out?.status).toBe("new");
  });

  it("marks status=duplicate when a prior same-email lead exists", async () => {
    const { arg, count } = changeArg({ email: "a@b.co", status: "new" }, "create", 1);
    const out = await inviteBeforeChange(arg);
    expect(out?.status).toBe("duplicate");
    const where = count.mock.calls[0][0].where;
    expect(where.email).toEqual({ equals: "a@b.co" });
    expect(where.createdAt.greater_than).toBeTypeOf("string");
  });

  it("skips the check (no query) for an already-spam row", async () => {
    const { arg, count } = changeArg({ email: "a@b.co", status: "spam" }, "create", 1);
    const out = await inviteBeforeChange(arg);
    expect(count).not.toHaveBeenCalled();
    expect(out?.status).toBe("spam");
  });

  it("skips when email is missing", async () => {
    const { arg, count } = changeArg({ status: "new" }, "create", 1);
    const out = await inviteBeforeChange(arg);
    expect(count).not.toHaveBeenCalled();
    expect(out?.status).toBe("new");
  });

  it("honours INVITE_DEDUPE_WINDOW_MS for the lookback window", async () => {
    process.env = { ...OLD_ENV, INVITE_DEDUPE_WINDOW_MS: "1000" };
    const { arg, count } = changeArg({ email: "a@b.co", status: "new" }, "create", 0);
    const before = Date.now();
    await inviteBeforeChange(arg);
    const since = new Date(count.mock.calls[0][0].where.createdAt.greater_than).getTime();
    // window is 1s, so `since` should sit ~1s before now (generous tolerance)
    expect(before - since).toBeGreaterThanOrEqual(900);
    expect(before - since).toBeLessThan(2000);
  });
});

type AfterArg = Parameters<typeof inviteAfterChange>[0];

function afterArg(
  doc: Record<string, unknown>,
  operation: string,
  context: Record<string, unknown> = {},
) {
  const update = vi.fn().mockResolvedValue({});
  const arg = { doc, operation, req: { payload: { update }, context } } as unknown as AfterArg;
  return { arg, update };
}

const lead = { id: 7, username: "@luka", email: "fan@example.com", status: "new", createdAt: "x" };

describe("inviteAfterChange (email + lifecycle)", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ ok: true });
  });

  it("does nothing on a non-create operation", async () => {
    const { arg, update } = afterArg(lead, "update");
    await inviteAfterChange(arg);
    expect(sendMock).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("no-ops on its own recursion-guarded status pass", async () => {
    const { arg, update } = afterArg(lead, "create", { skipInviteEmail: true });
    await inviteAfterChange(arg);
    expect(sendMock).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("skips the send for a duplicate row", async () => {
    const { arg, update } = afterArg({ ...lead, status: "duplicate" }, "create");
    await inviteAfterChange(arg);
    expect(sendMock).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("skips the send for a spam row", async () => {
    const { arg, update } = afterArg({ ...lead, status: "spam" }, "create");
    await inviteAfterChange(arg);
    expect(sendMock).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("sends then stamps status=emailed on success, with the recursion guard", async () => {
    const { arg, update } = afterArg(lead, "create");
    await inviteAfterChange(arg);

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toMatchObject({ email: "fan@example.com" });

    const opts = update.mock.calls[0][0];
    expect(opts.id).toBe(7);
    expect(opts.data.status).toBe("emailed");
    expect(opts.data.emailSentAt).toBeTypeOf("string");
    expect(opts.data.emailError).toBeNull();
    expect(opts.context).toEqual({ skipInviteEmail: true });
    expect(opts.overrideAccess).toBe(true);
  });

  it("stamps status=email_failed with the error on a send failure", async () => {
    sendMock.mockResolvedValue({ ok: false, error: "domain not verified" });
    const { arg, update } = afterArg(lead, "create");
    await inviteAfterChange(arg);

    const opts = update.mock.calls[0][0];
    expect(opts.data.status).toBe("email_failed");
    expect(opts.data.emailError).toBe("domain not verified");
  });

  it("never throws when the self-update rejects", async () => {
    const { arg } = afterArg(lead, "create");
    arg.req.payload.update = vi.fn().mockRejectedValue(new Error("db gone"));
    await expect(inviteAfterChange(arg)).resolves.toBeDefined();
  });
});

type OpArg = Parameters<typeof inviteAfterOperation>[0];

function opArg(result: Record<string, unknown>, operation: string) {
  return { result, operation } as unknown as OpArg;
}

describe("inviteAfterOperation (logging)", () => {
  let info: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    info = vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => {
    info.mockRestore();
  });

  it("logs one structured line on create", () => {
    inviteAfterOperation(opArg({ ...lead, ip: "203.0.113.5", elapsedMs: 4200 }, "create"));
    expect(info).toHaveBeenCalledTimes(1);
    expect(JSON.parse(info.mock.calls[0][0] as string)).toEqual({
      evt: "invite_request",
      id: 7,
      status: "new",
      ip: "203.0.113.5",
      elapsedMs: 4200,
    });
  });

  it("nulls out missing ip/elapsedMs (never the email body)", () => {
    inviteAfterOperation(opArg(lead, "create"));
    const logged = JSON.parse(info.mock.calls[0][0] as string);
    expect(logged.ip).toBeNull();
    expect(logged.elapsedMs).toBeNull();
    expect(logged).not.toHaveProperty("email");
  });

  it("does not log on non-create operations", () => {
    inviteAfterOperation(opArg(lead, "update"));
    expect(info).not.toHaveBeenCalled();
  });
});
