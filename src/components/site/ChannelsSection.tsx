import { Reveal } from "./Reveal";
import { SocialIcon } from "./icons";
import { socials } from "@/data/content";

/**
 * Prominent band — a step below the Inner Circle in the page's hierarchy.
 * It gets its own full-bleed plate and larger cards, but stays left-aligned on
 * a flat surface, where the Inner Circle is centred on a lit one. That keeps
 * the ranking readable: Inner Circle > Channels > Beats.
 */
export function ChannelsSection() {
  return (
    <section className="band" id="channels">
      <div className="shell">
        <Reveal>
          <div className="sec-head">
            <div>
              <span className="eyebrow">Elsewhere</span>
              <h2 className="sec-title">Channels</h2>
            </div>
            <p className="sec-note">
              Two YouTube channels, studio snippets on Instagram, and free loops on Telegram.
            </p>
          </div>
        </Reveal>

        <div className="channels">
          {socials.map((s, i) => (
            <Reveal key={s.name + s.handle} delay={Math.min(i * 70, 350)}>
              <a className="channel" href={s.url} target="_blank" rel="noopener noreferrer">
                <span className="channel-ico">
                  <SocialIcon kind={s.icon} />
                </span>
                <span className="channel-body">
                  <span className="channel-name">{s.name}</span>
                  <span className="channel-sub">{s.sub}</span>
                  <span className="channel-handle">{s.handle}</span>
                </span>
                <span className="channel-arr" aria-hidden="true">
                  ↗
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
