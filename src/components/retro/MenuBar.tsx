"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { beatstarsStore, telegramInvite, spotifyPlaylist, catalogueTotals } from "@/data/content";

type Item =
  | { kind: "link"; label: ReactNode; href: string }
  | { kind: "action"; label: ReactNode; run: () => void; checked?: boolean }
  | { kind: "sep" };

const YEAR = new Date().getFullYear();

/**
 * Interactive desktop menu bar. Each menu actually does something: open the store,
 * copy links, toggle the CRT scanlines / vaporwave grid, drive the transport, and
 * pop a retro About dialog. Hidden on mobile (see globals.css).
 */
export function MenuBar() {
  const [open, setOpen] = useState<string | null>(null);
  const [scanlines, setScanlines] = useState(true);
  const [grid, setGrid] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [about, setAbout] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  function flash(msg: string) {
    setToast(msg);
  }

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(`Copied ${what} ✓`);
    } catch {
      flash("Copy failed — long-press to copy");
    }
  }

  function toggleBodyClass(cls: string, on: boolean) {
    document.body.classList.toggle(cls, !on);
  }

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open && !about) return;
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setAbout(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, about]);

  const menus: { id: string; label: ReactNode; items: Item[] }[] = [
    {
      id: "file",
      label: (
        <>
          <u>F</u>ile
        </>
      ),
      items: [
        { kind: "link", label: "Open BeatStars store ↗", href: beatstarsStore },
        { kind: "link", label: "Open Spotify playlist ↗", href: spotifyPlaylist.openUrl },
        { kind: "sep" },
        { kind: "action", label: "Exit", run: () => flash("There's no escape from the beats ♪") },
      ],
    },
    {
      id: "edit",
      label: (
        <>
          <u>E</u>dit
        </>
      ),
      items: [
        { kind: "action", label: "Copy store link", run: () => copy(beatstarsStore, "store link") },
        { kind: "action", label: "Copy Telegram invite", run: () => copy(telegramInvite, "invite link") },
      ],
    },
    {
      id: "view",
      label: (
        <>
          <u>V</u>iew
        </>
      ),
      items: [
        {
          kind: "action",
          label: "CRT scanlines",
          checked: scanlines,
          run: () => {
            const next = !scanlines;
            setScanlines(next);
            toggleBodyClass("no-scanlines", next);
          },
        },
        {
          kind: "action",
          label: "Vaporwave grid",
          checked: grid,
          run: () => {
            const next = !grid;
            setGrid(next);
            toggleBodyClass("no-grid", next);
          },
        },
      ],
    },
    {
      id: "play",
      label: (
        <>
          <u>P</u>lay
        </>
      ),
      items: [
        { kind: "action", label: "Play / Pause  ⏯", run: () => window.dispatchEvent(new CustomEvent("lr:toggle-play")) },
        { kind: "link", label: "Open Spotify ↗", href: spotifyPlaylist.openUrl },
      ],
    },
    {
      id: "help",
      label: (
        <>
          <u>H</u>elp
        </>
      ),
      items: [
        { kind: "action", label: "About Luka Rajhl…", run: () => setAbout(true) },
        { kind: "action", label: "Tip: ← → switch tabs", run: () => flash("Use ← → to move between tabs ⌨") },
      ],
    },
  ];

  return (
    <>
      <div className="menubar" role="menubar" ref={barRef}>
        {menus.map((m) => (
          <div
            className="menu"
            key={m.id}
            onMouseEnter={() => open && setOpen(m.id)}
          >
            <button
              type="button"
              className={`menu-top ${open === m.id ? "open" : ""}`}
              aria-haspopup="true"
              aria-expanded={open === m.id}
              onClick={() => setOpen(open === m.id ? null : m.id)}
            >
              {m.label}
            </button>
            {open === m.id ? (
              <div className="menu-pop" role="menu">
                {m.items.map((it, i) => {
                  if (it.kind === "sep") return <div className="menu-sep" key={i} role="separator" />;
                  if (it.kind === "link") {
                    return (
                      <a
                        key={i}
                        className="menu-item"
                        href={it.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        onClick={() => setOpen(null)}
                      >
                        {it.label}
                      </a>
                    );
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      className="menu-item"
                      role="menuitemcheckbox"
                      aria-checked={it.checked}
                      onClick={() => {
                        it.run();
                        if (it.checked === undefined) setOpen(null);
                      }}
                    >
                      <span className="menu-check" aria-hidden="true">
                        {it.checked === undefined ? "" : it.checked ? "✓" : ""}
                      </span>
                      {it.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}

      {about ? (
        <div className="modal-scrim" onClick={() => setAbout(false)}>
          <div className="modal-win" role="dialog" aria-label="About" onClick={(e) => e.stopPropagation()}>
            <div className="titlebar">
              <span className="ico" aria-hidden="true" />
              <span className="title">About — LUKA_RAJHL.exe</span>
              <span className="spacer" />
              <button type="button" className="winbtn" aria-label="Close" onClick={() => setAbout(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-name">LUKA RAJHL</p>
              <p className="modal-sub">Beat Producer · Skopje, MK</p>
              <p className="modal-p">
                {catalogueTotals.beats.toLocaleString()} beats &amp; {catalogueTotals.kits} sound kits on
                BeatStars. Nostalgic 2016-flavoured type beats, made in FL Studio.
              </p>
              <p className="modal-fine">© {YEAR} · built retro on purpose ♪</p>
              <button type="button" className="btn accent modal-ok" onClick={() => setAbout(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
