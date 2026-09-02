"use client";

/**
 * Explore control: the hand-off from the hero into the page. A real button
 * rather than a decorative cue, so it is focusable and keyboard-operable.
 * Scrolls to the next content section by id.
 */
export function SectionCue({ label = "Explore", targetId = "channels" }: { label?: string; targetId?: string }) {
  function jump() {
    const el = document.getElementById(targetId);
    if (!el) return;
    // Honour the OS setting: smooth for everyone else, instant for reduce.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <div className="cue">
      <button type="button" className="cue-btn" onClick={jump}>
        <span className="cue-label">{label}</span>
        <span className="cue-rule" aria-hidden="true">
          <i />
        </span>
      </button>
    </div>
  );
}
