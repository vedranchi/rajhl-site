"use client";

import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from "react";

/**
 * Turns a progress bar into a seek control. Pointer events cover mouse, touch
 * and pen in one path, and pointer capture keeps a drag tracking even when the
 * finger leaves the (thin) bar. Seeking itself is performed by PlayerDock,
 * which owns the audio element; this only reports a 0..1 ratio.
 */
export function useSeekBar(progress: number) {
  const draggingRef = useRef(false);

  const emit = useCallback((el: HTMLElement, clientX: number) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    window.dispatchEvent(new CustomEvent("lr:seek", { detail: { ratio } }));
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const el = e.currentTarget;
      draggingRef.current = true;
      el.setPointerCapture?.(e.pointerId);
      emit(el, e.clientX);
    },
    [emit],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!draggingRef.current) return;
      emit(e.currentTarget, e.clientX);
    },
    [emit],
  );

  const onPointerUp = useCallback((e: PointerEvent<HTMLElement>) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const step =
        e.key === "ArrowRight" ? 0.05 : e.key === "ArrowLeft" ? -0.05 : e.key === "Home" ? -1 : e.key === "End" ? 1 : 0;
      if (step === 0) return;
      e.preventDefault();
      const next = e.key === "Home" ? 0 : e.key === "End" ? 1 : progress + step;
      window.dispatchEvent(
        new CustomEvent("lr:seek", { detail: { ratio: Math.min(1, Math.max(0, next)) } }),
      );
    },
    [progress],
  );

  return {
    role: "slider" as const,
    tabIndex: 0,
    "aria-label": "Seek",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(progress * 100),
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onKeyDown,
  };
}
