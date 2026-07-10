import { beats, kits, socials, about, spotifyPlaylist } from "@/data/content";
import { SocialIcon } from "./icons";

/** Real external links open in a new tab; "#" placeholders stay in-page. */
function ext(url: string) {
  return url.startsWith("http")
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}

export function BeatsPanel() {
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
          <span>BPM</span>
          <span className="h-key">Key</span>
          <span>Time</span>
          <span className="h-buy">License</span>
        </div>
        {beats.map((b) => (
          <div className={`row ${b.playing ? "playing" : ""}`} key={b.title}>
            <span className="num">{b.n}</span>
            <span className="ttl">{b.title}</span>
            <span className="mut">{b.bpm}</span>
            <span className="mut r-key">{b.key}</span>
            <span className="mut">{b.time}</span>
            <a className="buy" href={b.buyUrl} {...ext(b.buyUrl)}>
              [BUY ↗]
            </a>
          </div>
        ))}
      </div>
      <p className="listhint">» Double-click a track to preview · checkout &amp; licensing handled on BeatStars</p>
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
      <div className="badges" aria-hidden="true">
        <span className="badge88">SUBSCRIBE ►</span>
        <span className="badge88">FOLLOW ★</span>
        <span className="badge88">JOIN ✈</span>
        <span className="badge88">BEATSTARS ♪</span>
      </div>
    </>
  );
}

export function PlaylistPanel() {
  return (
    <>
      <h2 className="blocktitle">♫ Now Spinning \ curated_rotation.pls</h2>
      <div className="spotifybox">
        <iframe
          title="Spotify playlist — Luka Rajhl"
          src={spotifyPlaylist.embedUrl}
          width="100%"
          height="420"
          style={{ border: 0, display: "block" }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
      <p className="listhint">
        » Streaming via Spotify ·{" "}
        <a className="hintlink" href={spotifyPlaylist.openUrl} {...ext(spotifyPlaylist.openUrl)}>
          open the full playlist ↗
        </a>
      </p>
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
