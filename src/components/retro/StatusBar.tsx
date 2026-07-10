"use client";

import { useEffect, useState } from "react";

export function StatusBar({ beats, kits }: { beats: number; kits: number }) {
  const [n, setN] = useState(13290);

  useEffect(() => {
    const target = 13337;
    let cur = 13290;
    const t = setInterval(() => {
      cur += Math.ceil((target - cur) / 6);
      if (cur >= target) {
        cur = target;
        clearInterval(t);
      }
      setN(cur);
    }, 90);
    return () => clearInterval(t);
  }, []);

  const pad = (x: number) => ("0000000" + x).slice(-7);

  return (
    <div className="statusbar">
      <span className="cell">
        <span className="led">●</span> Ready
      </span>
      <span className="cell">
        ♪ {beats} beats · {kits} kits
      </span>
      <span className="spacer" />
      <span className="cell">EST. 2018</span>
      <span className="cell">
        VISITORS: <span className="counter">{pad(n)}</span>
      </span>
    </div>
  );
}
