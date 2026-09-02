"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";
import { spotifyPlaylist } from "@/data/content";

/**
 * Spotify playlist, wired into the page's single-audio rule.
 *
 * A bare embed iframe reports nothing, so there is no way to know the visitor
 * pressed play inside it. This uses Spotify's official IFrame API (still the
 * official embed, per CLAUDE.md P6) purely to observe and control playback:
 *   - Spotify starts  -> dispatch `lr:pause-beat`, PlayerDock pauses the beat.
 *   - a beat starts   -> `lr:beat-started` arrives, we pause Spotify.
 *
 * `playback_update` only fires once Spotify has finished buffering and is
 * actually producing sound, which is far too late to stop the beat: both played
 * together for the whole load. So the beat is stood down at *interaction* time
 * instead, when focus moves into the embed, with `playback_update` still acting
 * as the backstop.
 *
 * The API replaces the element it is handed. We hand it the real iframe, so if
 * the script is blocked or fails the embed still plays; only the sync is lost.
 */

type SpotifyController = {
  pause: () => void;
  addListener: (name: string, cb: (e: { data?: { isPaused?: boolean } }) => void) => void;
  destroy?: () => void;
};
type SpotifyIFrameApi = {
  createController: (
    el: Element,
    opts: Record<string, unknown>,
    cb: (c: SpotifyController) => void,
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameApi) => void;
  }
}

export function SpotifySection() {
  const hostRef = useRef<HTMLIFrameElement | null>(null);
  const controllerRef = useRef<SpotifyController | null>(null);
  // Set while we pause Spotify ourselves, so its own paused callback is not
  // mistaken for visitor intent.
  const selfPausing = useRef(false);
  // Whether Spotify currently holds audio. Calling pause() on a controller that
  // has never played throws "no list was loaded", so this gates the call.
  const spotifyPlaying = useRef(false);
  const [synced, setSynced] = useState(false);
  const frameWrapRef = useRef<HTMLDivElement | null>(null);
  // Mirrors the beat transport so the pre-emptive pause only fires when there
  // is actually something to stop.
  const beatPlaying = useRef(false);

  const attach = useCallback((api: SpotifyIFrameApi) => {
    const el = hostRef.current;
    if (!el || controllerRef.current) return;
    try {
      api.createController(el, { uri: spotifyPlaylist.uri }, (controller) => {
        controllerRef.current = controller;
        setSynced(true);
        controller.addListener("playback_update", (e) => {
          const paused = e?.data?.isPaused;
          if (paused === undefined) return;
          spotifyPlaying.current = !paused;
          if (paused) {
            // Our own pause landing: clear the guard deterministically instead
            // of racing a timer.
            selfPausing.current = false;
            return;
          }
          if (selfPausing.current) {
            // A genuine restart arrived before our pause did; the guard is spent.
            selfPausing.current = false;
          }
          // Backstop for the focus claim below (keyboard, autoplay, restore).
          window.dispatchEvent(new CustomEvent("lr:pause-beat"));
        });
      });
    } catch {
      /* Sync unavailable; the embed below still plays on its own. */
    }
  }, []);

  // The script may already have run (client nav), so accept both paths.
  useEffect(() => {
    window.onSpotifyIframeApiReady = attach;
    return () => {
      window.onSpotifyIframeApiReady = undefined;
      controllerRef.current?.destroy?.();
      controllerRef.current = null;
    };
  }, [attach]);

  // A beat started: stop Spotify. Driven by the transport's synchronous claim,
  // not by `lr:track-changed`, which is a state-change effect and stays silent
  // when the already-loaded track is restarted.
  useEffect(() => {
    const onBeat = () => {
      beatPlaying.current = true;
      // Only pause a controller that is actually playing; pausing one that has
      // never loaded a list throws inside Spotify's own code.
      if (!controllerRef.current || !spotifyPlaying.current) return;
      selfPausing.current = true;
      try {
        controllerRef.current.pause();
      } catch {
        selfPausing.current = false;
      }
    };
    const onTrack = (e: Event) => {
      beatPlaying.current = Boolean((e as CustomEvent<{ playing: boolean }>).detail?.playing);
    };
    window.addEventListener("lr:beat-started", onBeat);
    window.addEventListener("lr:track-changed", onTrack);
    return () => {
      window.removeEventListener("lr:beat-started", onBeat);
      window.removeEventListener("lr:track-changed", onTrack);
    };
  }, []);

  // Focus entering the embed is the earliest reliable signal that the visitor
  // is driving Spotify. Clicking a cross-origin iframe blurs the parent window
  // and makes that iframe document.activeElement, so the beat can be stopped at
  // click time rather than after Spotify finishes buffering.
  useEffect(() => {
    const onBlur = () => {
      if (!beatPlaying.current) return;
      const active = document.activeElement;
      if (!active || !frameWrapRef.current?.contains(active)) return;
      window.dispatchEvent(new CustomEvent("lr:pause-beat"));
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  return (
    <section className="section shell" id="spotify">
      <Script src="https://open.spotify.com/embed/iframe-api/v1" strategy="afterInteractive" />

      <Reveal>
        <div className="sec-head">
          <div>
            <h2 className="sec-title">On Spotify</h2>
          </div>
          <p className="sec-note">The official playlist, updated as new beats land.</p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="spotify-frame" ref={frameWrapRef} data-synced={synced || undefined}>
          <iframe
            ref={hostRef}
            title="Spotify playlist by Luka Rajhl"
            src={spotifyPlaylist.embedUrl}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </Reveal>
    </section>
  );
}
