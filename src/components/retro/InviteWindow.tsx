"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Window } from "./chrome";
import { TelegramIcon } from "./icons";
import { requestInvite, type InviteResult } from "@/app/actions/request-invite";
import { telegramInvite, telegramMembers } from "@/data/content";

/**
 * Invite form wired to the `requestInvite` server action (Task 3).
 * - `useActionState` gives us the pending flag + last result.
 * - Inputs are controlled so their values survive a validation error.
 * - Hidden anti-spam fields: honeypot `company` + `elapsedMs` time-gate.
 * - The action never throws on handled paths; the try/catch in the reducer
 *   turns an unexpected network/RSC failure into a friendly message.
 */
export function InviteWindow() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Mount time for the backend time-gate, kept in a ref (Date.now() in render
  // trips react-hooks/purity; setState-in-effect is also flagged). The reducer
  // sends the *elapsed* fill time — both timestamps come from the client clock,
  // so a visitor with a skewed device clock can't be mistaken for a bot.
  const mountedAt = useRef(0);
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const [state, formAction, isPending] = useActionState<InviteResult | null, FormData>(
    async (_prev, formData) => {
      if (mountedAt.current > 0) formData.set("elapsedMs", String(Date.now() - mountedAt.current));
      try {
        return await requestInvite(formData);
      } catch {
        return { ok: false, error: "Network error — check your connection and try again." };
      }
    },
    null,
  );

  const succeeded = state?.ok === true;
  const errorMsg = state && !state.ok ? state.error : null;

  // On success the form (holding focus) unmounts — move focus to the panel so
  // keyboard/AT users aren't dropped on <body>.
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (succeeded) successRef.current?.focus();
  }, [succeeded]);

  return (
    <Window
      title="PRIVATE_GROUP — Invite Request"
      icon="tg"
      className="formwin"
      ariaLabel="Private Telegram group invite"
    >
      <div className="formbody">
        <div className="formhead">
          <span className="tgbig" aria-hidden="true">
            <TelegramIcon />
          </span>
          <div>
            <h2 className="formtitle">Join the inner circle</h2>
            <p className="formsub">
              Private Telegram group — early beats, free loops &amp; subscriber-only discounts.
              {succeeded ? "" : " Request your invite:"}
            </p>
          </div>
        </div>

        {succeeded ? (
          <div className="form-success" role="status" tabIndex={-1} ref={successRef}>
            <p className="fs-title">✓ Request received</p>
            <p className="fs-body">
              Nice — you&apos;re on the list. Jump straight into the group while you wait:
            </p>
            <a className="btn accent invitebtn" href={telegramInvite} target="_blank" rel="noopener noreferrer">
              OPEN TELEGRAM ►
            </a>
          </div>
        ) : (
          <form className="invite" action={formAction} aria-label="Request a Telegram invite" aria-busy={isPending}>
            <div className="field">
              <label htmlFor="inv-user">
                Username <b>*</b>
              </label>
              <input
                id="inv-user"
                name="username"
                type="text"
                placeholder="@yourhandle"
                autoComplete="off"
                maxLength={33}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                readOnly={isPending}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="inv-mail">
                Email <b>*</b>
              </label>
              <input
                id="inv-mail"
                name="email"
                type="email"
                placeholder="you@email.com"
                autoComplete="off"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={isPending}
                required
              />
            </div>

            {/* Honeypot: off-screen + aria-hidden; humans never fill it, bots do. */}
            <div className="hp" aria-hidden="true">
              <label htmlFor="inv-company">Company</label>
              <input id="inv-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {errorMsg ? (
              <p className="form-msg error" role="alert">
                ⚠ {errorMsg}
              </p>
            ) : null}

            <button type="submit" className="btn accent invitebtn" disabled={isPending} aria-busy={isPending}>
              {isPending ? "SENDING…" : "REQUEST INVITE ►"}
            </button>
            <p className="formfine">✓ No spam · your invite arrives by email · unsubscribe anytime</p>
          </form>
        )}

        <a className="online" href={telegramInvite} target="_blank" rel="noopener noreferrer">
          <span className="odot" aria-hidden="true" /> {telegramMembers} subscribers inside — open Telegram ↗
        </a>
      </div>
    </Window>
  );
}
