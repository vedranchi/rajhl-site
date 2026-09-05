"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nowPlaying, playlist } from "@/data/content";
import { useSeekBar } from "./useSeekBar";

/**
 * Sticky bottom transport. Same behaviour as the previous in-window player:
 * primary source is the front-page playlist streamed from BeatStars, falling
 * back to the bundled loop if a stream fails, with a synthesized blip on each
 * control. Driven by, and broadcasting on, the same window events:
 *   in  - `lr:toggle-play`, `lr:play-track` ({ index }), `lr:pause-beat`,
 *         `lr:seek` ({ ratio })
 *   out - `lr:track-changed` ({ index, playing }), `lr:progress`,
 *         `lr:beat-started`
 *
 * `lr:pause-beat` is how the Spotify embed claims audio: only one of the two
 * may play at a time. Pausing is idempotent, so repeated switching is safe.
 *
 * `lr:beat-started` is the mirror claim, dispatched synchronously at the moment
 * play() is called. It deliberately does NOT ride on `lr:track-changed`: that
 * only fires when trackIndex or playing actually change, so restarting the
 * track already loaded emitted nothing and left Spotify running.
 */
export function PlayerDock() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [elapsed, setElapsed] = useState("0:00");
  const [trackIndex, setTrackIndex] = useState(0);
  const track = playlist[trackIndex] ?? null;
  const [total, setTotal] = useState(track?.total || nowPlaying.total);
  const [usingFallback, setUsingFallback] = useState(false);
  const seek = useSeekBar(progress);

  /** Tell the other audio source to stand down, now, on the same tick as play(). */
  const claimAudio = useCallback(() => {
    window.dispatchEvent(new CustomEvent("lr:beat-started"));
  }, []);

  const blip = useCallback((kind: "play" | "skip" | "stop") => {
    try {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = (acRef.current ??= new AC());
      if (ac.state === "suspended") void ac.resume();
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      const base = kind === "stop" ? 320 : kind === "skip" ? 660 : 480;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * (kind === "stop" ? 0.6 : 1.4), t + 0.07);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.07, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch {
      /* Web Audio unavailable — SFX is non-essential. */
    }
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (!a.duration || !isFinite(a.duration)) return;
      setProgress(a.currentTime / a.duration);
      const m = Math.floor(a.currentTime / 60);
      const s = Math.floor(a.currentTime % 60);
      setElapsed(`${m}:${String(s).padStart(2, "0")}`);
    };
    const onMeta = () => {
      if (a.duration && isFinite(a.duration)) {
        const m = Math.floor(a.duration / 60);
        const s = Math.floor(a.duration % 60);
        setTotal(`${m}:${String(s).padStart(2, "0")}`);
      }
    };
    const onEnd = () => setPlaying(false);
    // If the current BeatStars stream fails, swap to the bundled loop once.
    const onError = () => {
      if (!usingFallback && a.src !== location.origin + nowPlaying.fallbackSrc) {
        setUsingFallback(true);
        a.src = nowPlaying.fallbackSrc;
        a.load();
        if (playing) a.play().catch(() => {});
      }
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onError);
    };
  }, [playing, usingFallback]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      claimAudio();
      blip("play");
      a.play().catch(() => {});
      setPlaying(true);
    } else {
      blip("stop");
      a.pause();
      setPlaying(false);
    }
  }, [blip, claimAudio]);

  useEffect(() => {
    const h = () => toggle();
    window.addEventListener("lr:toggle-play", h);
    return () => window.removeEventListener("lr:toggle-play", h);
  }, [toggle]);

  // Another source (the Spotify embed) took over: stand down. Not routed
  // through toggle() so it can never accidentally *start* playback.
  useEffect(() => {
    const h = () => {
      const a = audioRef.current;
      if (!a || a.paused) return;
      a.pause();
      setPlaying(false);
    };
    window.addEventListener("lr:pause-beat", h);
    return () => window.removeEventListener("lr:pause-beat", h);
  }, []);

  // Load + play a specific playlist entry (explicit selection from a beat row).
  const playTrack = useCallback(
    (index: number) => {
      const a = audioRef.current;
      const nextTrack = playlist[index];
      if (!a || !nextTrack) return;
      claimAudio();
      blip("play");
      setTrackIndex(index);
      setUsingFallback(false);
      setProgress(0);
      setElapsed("0:00");
      setTotal(nextTrack.total || "0:00");
      a.src = nextTrack.src;
      a.load();
      a.play().catch(() => {});
      setPlaying(true);
    },
    [blip, claimAudio],
  );

  useEffect(() => {
    const h = (e: Event) => {
      const index = (e as CustomEvent<{ index: number }>).detail?.index;
      if (typeof index === "number") playTrack(index);
    };
    window.addEventListener("lr:play-track", h);
    return () => window.removeEventListener("lr:play-track", h);
  }, [playTrack]);

  // Seek requests from any timeline surface (dock bar, iPod scrubber).
  useEffect(() => {
    const h = (e: Event) => {
      const ratio = (e as CustomEvent<{ ratio: number }>).detail?.ratio;
      const a = audioRef.current;
      if (a == null || typeof ratio !== "number") return;
      if (!a.duration || !isFinite(a.duration)) return; // metadata not in yet
      const clamped = Math.min(1, Math.max(0, ratio));
      a.currentTime = clamped * a.duration;
      // Paint the new position immediately rather than waiting for timeupdate.
      setProgress(clamped);
      const secs = a.currentTime;
      setElapsed(`${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, "0")}`);
    };
    window.addEventListener("lr:seek", h);
    return () => window.removeEventListener("lr:seek", h);
  }, []);

  // Broadcast what's loaded/playing so the beats list and the iPod can mirror it.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("lr:track-changed", { detail: { index: trackIndex, playing } }));
  }, [trackIndex, playing]);

  // Position feed. This component owns the only <audio> on the page; anything
  // else that needs a progress readout listens rather than creating its own.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("lr:progress", { detail: { progress, elapsed, total, usingFallback } }),
    );
  }, [progress, elapsed, total, usingFallback]);

  function restart() {
    const a = audioRef.current;
    if (!a) return;
    blip("skip");
    a.currentTime = 0;
    if (!a.paused) a.play().catch(() => {});
  }

  // Jump to a random *other* beat from the front-page playlist.
  function skip() {
    const a = audioRef.current;
    if (!a || playlist.length === 0) return;
    blip("skip");
    let next = trackIndex;
    if (playlist.length > 1) {
      do {
        next = Math.floor(Math.random() * playlist.length);
      } while (next === trackIndex);
    }
    const nextTrack = playlist[next];
    const wasPlaying = !a.paused;
    if (wasPlaying) claimAudio();
    setTrackIndex(next);
    setUsingFallback(false);
    setProgress(0);
    setElapsed("0:00");
    setTotal(nextTrack.total || "0:00");
    a.src = nextTrack.src;
    a.load();
    if (wasPlaying) a.play().catch(() => {});
  }

  return (
    <div className="dock" aria-label="Audio player">
      {/* No crossOrigin: plain opaque cross-origin media, so the BeatStars→S3
          redirect streams without a CORS requirement (CLAUDE.md P2). src is
          static on purpose — track changes are driven imperatively below. */}
      <audio ref={audioRef} src={nowPlaying.src} preload="none" />

      <div className="dock-progress" {...seek}>
        <i style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="dock-btns">
        <button className="dock-btn" type="button" onClick={restart} aria-label="Restart">
          ⏮
        </button>
        <button
          className="dock-btn main"
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button className="dock-btn" type="button" onClick={skip} aria-label="Skip to a random beat">
          ⏭
        </button>
      </div>

      <div className="dock-now">
        <div className="dock-label">Now playing</div>
        <a
          className="dock-title"
          href={track?.buyUrl ?? nowPlaying.buyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {usingFallback ? "Retro Test Loop" : (track?.title ?? nowPlaying.title)}
        </a>
      </div>

      <span className="dock-time">
        {elapsed} / {total}
      </span>
    </div>
  );
}
