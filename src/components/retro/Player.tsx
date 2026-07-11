"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nowPlaying, playlist } from "@/data/content";

/**
 * Working transport. Primary source is the front-page playlist (the 10 beats
 * shown in the table), streamed from BeatStars; if the current track fails to
 * load it falls back to a self-contained retro loop, so the player always
 * plays something. Skip picks a random other track from that same 10. Every
 * control also emits a synthesized "retro blip" (Web Audio) — no audio asset
 * needed for the SFX. The File/Play menu can drive it via the `lr:toggle-play`
 * window event; the Beats table's per-row play buttons drive it via
 * `lr:play-track` (detail: `{ index }`) and read the transport's state back
 * via the `lr:track-changed` broadcast (detail: `{ index, playing }`) so the
 * playing row can be highlighted — see `BeatsPanel` in `panels.tsx`.
 */
export function Player() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [elapsed, setElapsed] = useState("0:00");
  // Index into `playlist` for the track currently loaded (0 = the most-popular
  // beat, matching the table's "now playing" row).
  const [trackIndex, setTrackIndex] = useState(0);
  const track = playlist[trackIndex] ?? null;
  const [total, setTotal] = useState(track?.total || nowPlaying.total);
  const [usingFallback, setUsingFallback] = useState(false);

  const blip = useCallback((kind: "play" | "skip" | "stop") => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = (acRef.current ??= new AC());
      if (ac.state === "suspended") void ac.resume();
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "square"; // chiptune timbre
      const base = kind === "stop" ? 220 : kind === "skip" ? 660 : 440;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * (kind === "stop" ? 0.5 : 1.5), t + 0.08);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.14, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.14);
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
      blip("play");
      a.play().catch(() => {});
      setPlaying(true);
    } else {
      blip("stop");
      a.pause();
      setPlaying(false);
    }
  }, [blip]);

  // Let the menu bar's Play command drive the transport.
  useEffect(() => {
    const h = () => toggle();
    window.addEventListener("lr:toggle-play", h);
    return () => window.removeEventListener("lr:toggle-play", h);
  }, [toggle]);

  // Load + play a specific playlist entry (explicit selection, e.g. a Beats
  // table row) — always starts playback, unlike skip() which preserves the
  // prior paused/playing state.
  const playTrack = useCallback(
    (index: number) => {
      const a = audioRef.current;
      const nextTrack = playlist[index];
      if (!a || !nextTrack) return;
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
    [blip],
  );

  // Let the Beats table's row play buttons pick a specific track.
  useEffect(() => {
    const h = (e: Event) => {
      const index = (e as CustomEvent<{ index: number }>).detail?.index;
      if (typeof index === "number") playTrack(index);
    };
    window.addEventListener("lr:play-track", h);
    return () => window.removeEventListener("lr:play-track", h);
  }, [playTrack]);

  // Broadcast what's currently loaded/playing so the Beats table can
  // highlight the matching row and swap its icon.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("lr:track-changed", { detail: { index: trackIndex, playing } }));
  }, [trackIndex, playing]);

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
    <div className="transport" aria-label="Audio player">
      {/* No crossOrigin: we only need plain playback, so the browser can stream the
          BeatStars→S3 redirect as opaque cross-origin media (no CORS requirement).
          src is intentionally static (set once): track changes are driven purely
          imperatively (skip/onError set a.src + a.load() themselves) — binding
          this to `track` would make React re-apply the src attribute on every
          re-render, which re-triggers the browser's load algorithm and aborts
          the play() call skip() just started. */}
      <audio ref={audioRef} src={nowPlaying.src} preload="none" />
      <div className="tbtns">
        <button className="tbtn" type="button" onClick={restart} aria-label="Restart">
          ⏮
        </button>
        <button className="tbtn" type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "⏸" : "▶"}
        </button>
        <button className="tbtn" type="button" onClick={skip} aria-label="Skip to a random beat">
          ⏭
        </button>
      </div>
      <div className="nowbox">
        <div className="nowlabel">
          NOW PLAYING:{" "}
          <a href={track?.buyUrl ?? nowPlaying.buyUrl} target="_blank" rel="noopener noreferrer" className="nowlink">
            <b>{usingFallback ? "Retro Test Loop" : (track?.title ?? nowPlaying.title)}</b>
          </a>{" "}
          — {usingFallback ? "Placeholder" : (track?.artist ?? nowPlaying.artist)}
        </div>
        <div className="seek" aria-hidden="true">
          <div className="fill" style={{ inset: `0 ${100 - progress * 100}% 0 0` }} />
          <div className="knob" style={{ left: `${progress * 100}%` }} />
        </div>
      </div>
      <span className="ttime">
        {elapsed} / {total}
      </span>
      <div className={`teq ${playing ? "on" : ""}`} aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>
    </div>
  );
}
