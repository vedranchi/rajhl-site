"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";
import { prepareTrackUploads, requestInvite, type InviteResult } from "@/app/actions/request-invite";
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
/** Kept in step with the server: src/lib/track-uploads.ts owns the real rules. */
const TRACK_COUNT = 3;
const MAX_TRACK_MB = 20;

function describeFiles(list: FileList | null): { files: File[]; error: string | null } {
  const files = list ? Array.from(list) : [];
  if (files.length === 0) return { files: [], error: null };
  if (files.length !== TRACK_COUNT) {
    return { files, error: `Pick exactly ${TRACK_COUNT} beats. You picked ${files.length}.` };
  }
  for (const f of files) {
    if (!f.name.toLowerCase().endsWith(".mp3")) return { files, error: `"${f.name}" is not an mp3.` };
    if (f.size > MAX_TRACK_MB * 1024 * 1024) return { files, error: `"${f.name}" is over ${MAX_TRACK_MB} MB.` };
    if (f.size < 1024) return { files, error: `"${f.name}" looks empty.` };
  }
  return { files, error: null };
}

export function InnerCircle() {
  const [instagram, setInstagram] = useState("");
  const [tracks, setTracks] = useState<File[]>([]);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

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

      // The audio never goes through the server action: Next caps action bodies
      // at 1 MB. The files are read out of the form, uploaded straight to
      // Supabase with per-object signed URLs, and only their paths are posted.
      const picked = formData.getAll("tracks").filter((f): f is File => f instanceof File && f.size > 0);
      formData.delete("tracks");

      try {
        const prepared = await prepareTrackUploads(
          picked.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        );
        if (!prepared.ok) return { ok: false, error: prepared.error };

        for (const [i, target] of prepared.prepared.targets.entries()) {
          setUploadNote(`Uploading beat ${i + 1} of ${TRACK_COUNT}…`);
          const res = await fetch(target.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "audio/mpeg" },
            body: picked[i],
          });
          if (!res.ok) {
            return { ok: false, error: "One of your beats didn't upload. Check your connection and try again." };
          }
        }
        setUploadNote(null);

        formData.set("trackPaths", JSON.stringify(prepared.prepared.targets.map((t) => t.path)));
        formData.set("trackClaim", prepared.prepared.claim);
        for (const f of picked) formData.append("trackNames", f.name);

        return await requestInvite(formData);
      } catch {
        return { ok: false, error: "Network error. Check your connection and try again." };
      } finally {
        setUploadNote(null);
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
                <label htmlFor="inv-ig">Instagram username</label>
                <input
                  id="inv-ig"
                  name="instagram"
                  type="text"
                  inputMode="text"
                  placeholder="@yourhandle"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  /* 30 handle characters, a leading @, and enough room to paste
                     a profile URL, which the validator reduces to the handle. */
                  maxLength={80}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  readOnly={isPending}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="inv-tracks">Your 3 best solo beats</label>
                <input
                  id="inv-tracks"
                  name="tracks"
                  type="file"
                  className="file-input"
                  accept="audio/mpeg,.mp3"
                  multiple
                  required
                  disabled={isPending}
                  onChange={(e) => {
                    const picked = describeFiles(e.target.files);
                    setTracks(picked.files);
                    setTrackError(picked.error);
                  }}
                />
                <p className="field-hint">
                  Exactly {TRACK_COUNT} mp3s, solo productions only, up to {MAX_TRACK_MB} MB each.
                </p>
                {tracks.length > 0 ? (
                  <ul className="file-list">
                    {tracks.map((f) => (
                      <li key={f.name + f.size}>
                        <span className="file-name">{f.name}</span>
                        <span className="file-size">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {trackError ? (
                  <p className="form-msg error" role="alert">
                    {trackError}
                  </p>
                ) : null}
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

              <button
                type="submit"
                className="btn primary circle-submit"
                // Blocked until the client-side rules pass, but the server
                // re-checks every one of them: this is convenience, not control.
                disabled={isPending || tracks.length !== TRACK_COUNT || trackError !== null}
                aria-busy={isPending}
              >
                {isPending ? uploadNote ?? "Sending…" : "Request to join"}
              </button>
              <p className="form-fine">
                Luka replies on Instagram. No email needed, no list, no spam.
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
