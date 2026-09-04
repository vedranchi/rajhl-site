"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * In-page navigation to a section. Stays an <a href="#id"> so it keeps native
 * link behaviour: focusable, Enter-activated, middle-click and "open in new
 * tab" still work, and it degrades to the browser's own jump without JS. The
 * handler only upgrades that jump to a smooth scroll.
 *
 * `href` overrides the anchor's destination while keeping the smooth scroll.
 * The wordmark uses it to point at "/" so it is a real link home from anywhere,
 * and still scrolls to the top when the target is already on the page.
 */
export function ScrollLink({
  targetId,
  href,
  className,
  children,
  ...rest
}: {
  targetId: string;
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"a">, "href" | "onClick" | "className" | "children">) {
  const destination = href ?? `#${targetId}`;
  return (
    <a
      {...rest}
      className={className}
      href={destination}
      onClick={(e) => {
        // Let modified clicks (new tab/window) behave normally.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const el = document.getElementById(targetId);
        if (!el) return; // no target: fall through to the native anchor jump
        e.preventDefault();
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        // Keep the URL and focus in step with where the reader now is.
        history.replaceState(null, "", destination);
        el.setAttribute("tabindex", "-1");
        (el as HTMLElement).focus({ preventScroll: true });
      }}
    >
      {children}
    </a>
  );
}
