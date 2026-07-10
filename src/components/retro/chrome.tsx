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

