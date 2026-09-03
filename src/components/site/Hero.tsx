import { Reveal } from "./Reveal";
import { ScrollLink } from "./ScrollLink";
import { beatstarsStore, featuredKit } from "@/data/content";

export function Hero() {
  return (
    <header className="hero shell">
      <div className="hero-lede">
        <Reveal>
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
      </div>

      {/* Latest kit, sitting in the hero's empty right column rather than as a
          standalone card: no plate, just a hairline rule and the artwork. */}
      {featuredKit ? (
        <Reveal delay={320} className="hero-feature">
          <a
            className="hero-kit"
            href={featuredKit.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="hero-kit-label">Latest kit</span>
            {featuredKit.image ? (
              // Plain <img>, not next/image: the optimizer would refetch the asset
              // from BeatStars server-side. See KitsSection for the same note (P2).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="hero-kit-art"
                src={featuredKit.image}
                alt=""
                width={400}
                height={400}
                decoding="async"
              />
            ) : null}
            <span className="hero-kit-name">{featuredKit.file}</span>
            <span className="hero-kit-meta">{featuredKit.meta}</span>
            <span className="hero-kit-foot">
              <span className="hero-kit-price">{featuredKit.price}</span>
              <span className="hero-kit-go">Get the kit ↗</span>
            </span>
          </a>
        </Reveal>
      ) : null}
    </header>
  );
}
