"use client";

import { useEffect, useRef, useState } from "react";
import { nowPlaying } from "@/data/content";

/**
 * Working transport: drives a real <audio> element and plays a short synthesized
 * "retro blip" (Web Audio) on every control press — no audio asset needed for the
 * SFX. Play/Pause toggles; ⏮ restarts; ⏭ jumps near the end (enough to test the
 * controls against the placeholder loop).
 */
export function Player() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [elapsed, setElapsed] = useState("0:00");

  // Lazily create a shared AudioContext (needs a user gesture on most browsers).
  function blip(kind: "play" | "skip" | "stop") {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = (acRef.current ??= new AC());
      if (ac.state === "suspended") void ac.resume();
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      // Square wave = chiptune timbre; a tiny pitch move per action.
      osc.type = "square";
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
  }

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (!a.duration) return;
      setProgress(a.currentTime / a.duration);
      const m = Math.floor(a.currentTime / 60);
      const s = Math.floor(a.currentTime % 60);
      setElapsed(`${m}:${String(s).padStart(2, "0")}`);
    };
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      blip("play");
      void a.play();
      setPlaying(true);
    } else {
      blip("stop");
      a.pause();
      setPlaying(false);
    }
  }

  function restart() {
    const a = audioRef.current;
    if (!a) return;
    blip("skip");
    a.currentTime = 0;
    if (!a.paused) void a.play();
  }

  function skip() {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    blip("skip");
    a.currentTime = Math.max(0, a.duration - 2);
    if (!a.paused) void a.play();
  }

  return (
    <div className="transport" aria-label="Audio player">
      <audio ref={audioRef} src={nowPlaying.src} preload="auto" />
      <div className="tbtns">
        <button className="tbtn" type="button" onClick={restart} aria-label="Restart">
          ⏮
        </button>
        <button className="tbtn" type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "⏸" : "▶"}
        </button>
        <button className="tbtn" type="button" onClick={skip} aria-label="Skip to end">
          ⏭
        </button>
      </div>
      <div className="nowbox">
        <div className="nowlabel">
          NOW PLAYING: <b>{nowPlaying.title}</b> — {nowPlaying.artist}
        </div>
        <div className="seek" aria-hidden="true">
          <div className="fill" style={{ inset: `0 ${100 - progress * 100}% 0 0` }} />
          <div className="knob" style={{ left: `${progress * 100}%` }} />
        </div>
      </div>
      <span className="ttime">
        {elapsed} / {nowPlaying.total}
      </span>
      <div className={`teq ${playing ? "on" : ""}`} aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <i key={i} />
        ))}
      </div>
    </div>
  );
}
