import { Reveal } from "./Reveal";
import { BeatStarsIcon } from "./icons";
import { kits, beatstarsStore, hasMoreKits } from "@/data/content";

/**
 * Ruled list, the same shape the Top 10 and the channel columns use: a row per
 * kit, a hairline between them, one white tint on hover. The artwork carries
 * the section, so it is the only thing on the row with any weight; the price
 * takes the amber readout the iPod's license line uses.
 *
 * This replaced a horizontal rail of gradient cards. The rail hid four of five
 * kits off the right edge and the cards fought the artwork they framed.
 */
export function KitsSection() {
  return (
    <section className="section shell" id="kits">
      <Reveal>
        <div className="sec-head">
          <h2 className="sec-title">Sound Kits</h2>
          <p className="sec-note">
            Instant download after checkout. The same sounds used across the catalogue.
          </p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <ul className="kits">
          {kits.map((k) => (
            <li key={k.file}>
              <a className="kit-row" href={k.buyUrl} target="_blank" rel="noopener noreferrer">
                <span className="kit-art">
                  {k.image ? (
                    // Plain <img>, not next/image: the optimizer would refetch the
                    // asset from BeatStars server-side. Loading it directly keeps
                    // this as plain cross-origin media, like the audio stream (P2).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={k.image} alt="" width={400} height={400} loading="lazy" decoding="async" />
                  ) : (
                    <BeatStarsIcon aria-hidden="true" />
                  )}
                </span>
                <span className="kit-text">
                  <h3 className="kit-name">{k.file}</h3>
                  <span className="kit-meta">{k.meta}</span>
                </span>
                <span className="kit-price">{k.price}</span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>

      {hasMoreKits ? (
        <Reveal delay={140}>
          <div className="kits-foot">
            <a className="btn" href={beatstarsStore} target="_blank" rel="noopener noreferrer">
              Browse all kits ↗
            </a>
          </div>
        </Reveal>
      ) : null}
    </section>
  );
}
