"use client";

import { useEffect, useState } from "react";
import {
  beats,
  kits,
  socials,
  about,
  channelBadges,
  beatstarsStore,
  catalogueTotals,
  catalogueShown,
  hasMoreBeats,
  hasMoreKits,
} from "@/data/content";
import { SocialIcon } from "./icons";

/** Real external links open in a new tab; "#" placeholders stay in-page. */
function ext(url: string) {
  return url.startsWith("http")
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}

export function BeatsPanel() {
  // Mirrors the transport's state (see Player.tsx) so the row for whatever
  // is actually loaded/playing gets highlighted, even when playback started
  // from the transport itself or the Play menu, not a row click.
  const [current, setCurrent] = useState({ index: 0, playing: false });

  useEffect(() => {
    const h = (e: Event) => {
      const detail = (e as CustomEvent<{ index: number; playing: boolean }>).detail;
      if (detail) setCurrent(detail);
    };
    window.addEventListener("lr:track-changed", h);
    return () => window.removeEventListener("lr:track-changed", h);
  }, []);

  // Clicking the currently-playing row's button toggles it; any other row
  // loads and starts playing that beat.
  function handleRowPlay(index: number) {
    if (index === current.index) {
      window.dispatchEvent(new CustomEvent("lr:toggle-play"));
    } else {
      window.dispatchEvent(new CustomEvent("lr:play-track", { detail: { index } }));
    }
  }

  return (
    <>
      <div className="lcd">
        <div>
          <h1 className="name">
            LUKA RAJHL
            <span className="cursor" aria-hidden="true">
              {" "}
            </span>
          </h1>
          <p className="sub">BEAT PRODUCER // SKOPJE, MK</p>
        </div>
        <div className="eq" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <div className="listbox">
        <div className="lhead">
          <span>#</span>
          <span>Title</span>
          <span className="h-plays">Plays</span>
          <span>Time</span>
          <span className="h-buy">License</span>
        </div>
        {beats.map((b, i) => {
          const isCurrent = i === current.index;
          const isPlaying = isCurrent && current.playing;
          return (
          <div className={`row ${isPlaying ? "playing" : ""}`} key={b.title}>
            <button
              type="button"
              className="num"
              onClick={() => handleRowPlay(i)}
              aria-label={isPlaying ? `Pause ${b.title}` : `Play ${b.title}`}
            >
              {isCurrent ? (isPlaying ? "⏸" : "▶") : String(i + 1).padStart(2, "0")}
            </button>
            <span className="ttl">{b.title}</span>
            <span className="mut r-plays">▶ {b.plays.toLocaleString()}</span>
            <span className="mut">{b.time}</span>
            <a className="buy" href={b.buyUrl} {...ext(b.buyUrl)}>
              [BUY ↗]
            </a>
          </div>
          );
        })}
      </div>
      <p className="listhint">
        » Top {catalogueShown.beats} by plays · checkout &amp; licensing handled on BeatStars
      </p>
      {hasMoreBeats ? (
        <a className="browseall" href={beatstarsStore} target="_blank" rel="noopener noreferrer">
          <span>Browse all {catalogueTotals.beats.toLocaleString()} beats on BeatStars</span>
          <span className="arr">↗</span>
        </a>
      ) : null}
    </>
  );
}

export function KitsPanel() {
  return (
    <>
      <h2 className="blocktitle">C:\ Downloads \ Kits</h2>
      <div className="dl">
        {kits.map((k) => (
          <div className="dlrow" key={k.file}>
            <span className="folder" aria-hidden="true" />
            <div>
              <div className="knm">{k.file}</div>
              <div className="kmeta">{k.meta}</div>
            </div>
            <span className="spacer" />
            <span className="kmeta">{k.price}</span>
            <a className="btn accent" href={k.buyUrl} {...ext(k.buyUrl)}>
              GET
            </a>
          </div>
        ))}
      </div>
      <p className="listhint">» Instant download after checkout · same sounds used across the catalogue</p>
      {hasMoreKits ? (
        <a className="browseall" href={beatstarsStore} target="_blank" rel="noopener noreferrer">
          <span>Browse all {catalogueTotals.kits.toLocaleString()} kits on BeatStars</span>
          <span className="arr">↗</span>
        </a>
      ) : null}
    </>
  );
}

export function ChannelsPanel() {
  return (
    <>
      <h2 className="blocktitle">&gt; My Links</h2>
      <div className="links">
        {socials.map((s) => (
          <a className="linkbtn" href={s.url} key={s.name} {...ext(s.url)}>
            <span className="g">
              <SocialIcon kind={s.icon} />
            </span>
            <div>
              <div className="lt">{s.name}</div>
              <div className="ls">{s.sub}</div>
            </div>
            <span className="arr">↗</span>
          </a>
        ))}
      </div>
      <div className="badges">
        {channelBadges.map((b) => (
          <a className="badge88" href={b.url} key={b.label} target="_blank" rel="noopener noreferrer">
            {b.label}
          </a>
        ))}
      </div>
    </>
  );
}

export function AboutPanel() {
  return (
    <>
      <h2 className="blocktitle">System Info</h2>
      <div className="about">
        <div className="portrait" aria-label="portrait placeholder">
          <b>LR</b>
        </div>
        <div>
          <div className="specs">
            {about.specs.map((s) => (
              <div className="srow" key={s.k}>
                <span className="sk">{s.k}</span>
                <span className="sv">{s.v}</span>
              </div>
            ))}
            <div className="srow">
              <span className="sk">Status</span>
              <span className="sv" style={{ color: "var(--led)" }}>
                ● {about.status}
              </span>
            </div>
          </div>
          <p className="bio">{about.bio}</p>
        </div>
      </div>
    </>
  );
}
