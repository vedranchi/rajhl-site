import { Window } from "./chrome";
import { spotifyPlaylist } from "@/data/content";

/**
 * Spotify playlist as its own retro window, sitting beside the invite form.
 * Uses Spotify's official embed iframe — no API key, fully interactive.
 */
export function SpotifyWindow() {
  return (
    <Window
      title="NOW_SPINNING — Spotify.pls"
      className="spotifywin"
      ariaLabel="Spotify playlist"
    >
      <div className="spotifybody">
        <div className="spotifybox">
          <iframe
            title="Spotify playlist — Luka Rajhl"
            src={spotifyPlaylist.embedUrl}
            width="100%"
            height="380"
            style={{ border: 0, display: "block" }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
        <p className="formfine">
          ♫ Streaming via Spotify ·{" "}
          <a className="hintlink" href={spotifyPlaylist.openUrl} target="_blank" rel="noopener noreferrer">
            open full playlist ↗
          </a>
        </p>
      </div>
    </Window>
  );
}
