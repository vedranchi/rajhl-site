"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";
import { requestInvite, type InviteResult } from "@/app/actions/request-invite";
import { telegramPublic } from "@/data/content";

/**
 * The Private Telegram request form. The page's signature section: a
 * full-bleed, vignetted panel that breaks the rhythm of the sections above it. Weight comes from space, contrast and a
 * narrow measure — not from badges, counters or louder colour.
 *
 * Form behaviour is unchanged: `useActionState`, controlled inputs so values
 * survive a validation error, and the two hidden anti-spam fields (honeypot
 * `company` + the `elapsedMs` time-gate).
 */
export function InnerCircle() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Mount time for the backend time-gate, kept in a ref (Date.now() in render
  // trips react-hooks/purity). The reducer sends the *elapsed* fill time, so a
  // visitor with a skewed device clock can't be mistaken for a bot.
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
        return { ok: false, error: "Network error. Check your connection and try again." };
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
    <section className="circle" id="join">
      <div className="shell circle-inner">
        <Reveal>
          <h2 className="circle-title">Private Telegram</h2>
          <p className="circle-lede">
            I&apos;m only adding the best producers. When I need loops / beats for the artists I
            work with, this is who I go to first — plus more loops than the public channel and
            free sounds along the way.
          </p>
          <p className="circle-apply">Drop your IG and send 3 solo tracks to apply.</p>
        </Reveal>

        <Reveal delay={140}>
          {succeeded ? (
            <div className="circle-form form-success" role="status" tabIndex={-1} ref={successRef}>
              <p className="fs-title">Request received</p>
              {/* No invite link here. Handing the private group's link to
                  everyone who submits the form would make the application
                  pointless; the link goes out once Luka has approved someone. */}
              <p className="fs-body">
                Luka goes through these by hand. If it&apos;s a fit, you&apos;ll get the invite.
                The free loops channel is open to everyone in the meantime.
              </p>
              <a className="btn" href={telegramPublic} target="_blank" rel="noopener noreferrer">
                Free loops channel ↗
              </a>
            </div>
          ) : (
            <form className="circle-form" action={formAction} aria-label="Request to join the private Telegram group" aria-busy={isPending}>
              <div className="field">
                <label htmlFor="inv-user">Telegram username</label>
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
                <label htmlFor="inv-mail">Email</label>
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
                  {errorMsg}
                </p>
              ) : null}

              <button type="submit" className="btn primary circle-submit" disabled={isPending} aria-busy={isPending}>
                {isPending ? "Sending…" : "Request to join"}
              </button>
              <p className="form-fine">Invites go out by email. No spam, unsubscribe anytime.</p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
