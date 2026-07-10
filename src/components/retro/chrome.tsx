import type { ReactNode } from "react";

type WindowProps = {
  title: string;
  icon?: "note" | "tg";
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

export function Window({ title, icon = "note", className, ariaLabel, children }: WindowProps) {
  return (
    <div className={`window${className ? " " + className : ""}`} aria-label={ariaLabel}>
      <div className="titlebar">
        <span className={`ico${icon === "tg" ? " tg" : ""}`} aria-hidden="true" />
        <span className="title">{title}</span>
        <span className="spacer" />
        <span className="winbtns" aria-hidden="true">
          <span className="winbtn">_</span>
          <span className="winbtn">▢</span>
          <span className="winbtn">✕</span>
        </span>
      </div>
      {children}
    </div>
  );
}

export function MenuBar() {
  return (
    <div className="menubar" aria-hidden="true">
      <span>
        <u>F</u>ile
      </span>
      <span>
        <u>E</u>dit
      </span>
      <span>
        <u>V</u>iew
      </span>
      <span>
        <u>P</u>lay
      </span>
      <span>
        <u>H</u>elp
      </span>
    </div>
  );
}

export function Marquee({ items }: { items: string[] }) {
  return (
    <div className="marquee" aria-hidden="true">
      <span>
        {"★ "}
        {items.map((it, i) => (
          <span key={it}>
            {it}
            {i < items.length - 1 ? <b>{" // "}</b> : null}
          </span>
        ))}
        {" ★"}
      </span>
    </div>
  );
}

type TransportProps = { title: string; artist: string; elapsed: string; total: string };

export function Transport({ title, artist, elapsed, total }: TransportProps) {
  return (
    <div className="transport" aria-label="Player (decorative)">
      <div className="tbtns">
        <span className="tbtn" aria-hidden="true">
          ⏮
        </span>
        <span className="tbtn" aria-hidden="true">
          ⏯
        </span>
        <span className="tbtn" aria-hidden="true">
          ⏭
        </span>
      </div>
      <div className="nowbox">
        <div className="nowlabel">
          NOW PLAYING: <b>{title}</b> — {artist}
        </div>
        <div className="seek" aria-hidden="true">
          <div className="fill" />
          <div className="knob" />
        </div>
      </div>
      <span className="ttime">
        {elapsed} / {total}
      </span>
      <div className="teq" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>
    </div>
  );
}
