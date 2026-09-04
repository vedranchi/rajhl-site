"use client";

import { useEffect, useState } from "react";
import { ScrollLink } from "./ScrollLink";

/**
 * Fixed section nav. Order follows the page, so the bar reads in the same
 * direction the visitor scrolls. Links reuse ScrollLink, so they stay real
 * anchors: focusable, Enter-activated, middle-clickable, and still functional
 * without JS.
 *
 * The active item is derived from which section currently owns the viewport
 * band just under the bar, rather than from raw scroll offsets, so it stays
 * correct at any section height and on any viewport.
 */
/** `short` is what the phone bar shows: four full labels plus the wordmark do
    not fit under about 500px, and shortening beats scrolling or wrapping. */
const ITEMS = [
  { id: "channels", label: "Channels", short: "Channels" },
  { id: "top10", label: "My beats", short: "Beats" },
  { id: "join", label: "Private Telegram", short: "Telegram" },
  { id: "spotify", label: "Produced by me", short: "Playlist" },
] as const;

export function SiteNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = ITEMS.map((i) => document.getElementById(i.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Several sections can straddle the band; take the one furthest down
        // the page that is still intersecting, which is the one being entered.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement);
        if (visible.length > 0) {
          const last = visible.reduce((a, b) => (a.offsetTop > b.offsetTop ? a : b));
          setActive(last.id);
        }
      },
      // A band just below the bar: a section counts as active once its top
      // reaches the bar and until it has scrolled most of the way past.
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="nav" aria-label="Sections">
      <div className="nav-inner">
        {/* Home. A real link to "/" so it works from anywhere, upgraded to a
            scroll to the top of the page when already here. The name shortens
            to initials on a phone rather than disappearing, which used to
            leave the mobile bar with no way back to the top. */}
        <ScrollLink className="nav-mark" targetId="top" href="/" aria-label="Luka Rajhl, home">
          <span className="nav-mark-full">Luka Rajhl</span>
          <span className="nav-mark-short">LR</span>
        </ScrollLink>

        <ul className="nav-list">
          {ITEMS.map((item) => (
            <li key={item.id}>
              <ScrollLink
                className={`nav-link${active === item.id ? " is-active" : ""}`}
                targetId={item.id}
                aria-current={active === item.id ? "true" : undefined}
              >
                <span className="nav-label-full">{item.label}</span>
                <span className="nav-label-short">{item.short}</span>
              </ScrollLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
