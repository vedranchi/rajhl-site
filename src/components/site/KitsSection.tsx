import { Reveal } from "./Reveal";
import { BeatStarsIcon } from "./icons";
import { kits, beatstarsStore, hasMoreKits } from "@/data/content";

/** Horizontal scroll-snap rail — kits scroll sideways instead of stacking in a grid. */
export function KitsSection() {
  return (
    <section className="section shell" id="kits">
      <Reveal>
        <div className="sec-head">
          <div>
            <h2 className="sec-title">Sound Kits</h2>
          </div>
          <p className="sec-note">
            Instant download after checkout. The same sounds used across the catalogue.
          </p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="rail" role="list" aria-label="Sound kits">
          {kits.map((k) => (
            <article className="kit" role="listitem" key={k.file}>
              <div className="kit-art">
                {k.image ? (
                  // Plain <img>, not next/image: the optimizer would refetch the
                  // asset from BeatStars server-side. Loading it directly keeps
                  // this as plain cross-origin media, like the audio stream (P2).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={k.image} alt="" width={400} height={400} loading="lazy" decoding="async" />
                ) : (
                  <BeatStarsIcon aria-hidden="true" />
                )}
              </div>
              <h3 className="kit-name">{k.file}</h3>
              <p className="kit-meta">{k.meta}</p>
              <div className="kit-foot">
                <span className="kit-price">{k.price}</span>
                <a className="btn primary" href={k.buyUrl} target="_blank" rel="noopener noreferrer">
                  Get
                </a>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      {hasMoreKits ? (
        <Reveal delay={140}>
          <div className="hero-cta">
            <a className="btn" href={beatstarsStore} target="_blank" rel="noopener noreferrer">
              Browse all kits ↗
            </a>
          </div>
        </Reveal>
      ) : null}
    </section>
  );
}
