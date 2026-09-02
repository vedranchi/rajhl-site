import { Reveal } from "./Reveal";
import { ScrollLink } from "./ScrollLink";
import { beatstarsStore } from "@/data/content";

export function Hero() {
  return (
    <header className="hero shell">
      <Reveal>
        <span className="eyebrow">Beat Producer · Skopje, MK</span>
        <h1 className="hero-name">LUKA RAJHL</h1>
        <p className="hero-sub">Trap, ambient and lo-fi</p>
      </Reveal>

      <Reveal delay={120}>
        <p className="hero-bio">
          Dust-warm 808s, cinematic keys and hard-swinging drums. Beats and kits ship worldwide
          through BeatStars, from bedroom demos to placements.
        </p>
      </Reveal>

      {/* One primary action. The store lives in the beat-store card further down,
          so it isn't repeated here as a competing CTA. */}
      <Reveal delay={220}>
        <div className="hero-cta">
          <ScrollLink className="btn primary" targetId="top10">
            Hear the beats
          </ScrollLink>
          <a className="quietlink" href={beatstarsStore} target="_blank" rel="noopener noreferrer">
            Open the store ↗
          </a>
        </div>
      </Reveal>
    </header>
  );
}
