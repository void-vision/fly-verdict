"use client";

import { useEffect, useState } from "react";
import { flyTier } from "@/lib/fly-score.mjs";

/** Colour per tier, highest first: green for the top, amber only for the bottom tier. */
export const TIER_COLOR = ["var(--verde)", "var(--verde)", "var(--iris)", "var(--iris)", "var(--amber)"];

const SWEEP_MS = 1100;
const SWEEP_DELAY_MS = 120;
const R = 88;

/** Close to --ease-snappy on the arc, so the count lands with it. */
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - 2 ** (-10 * t);
}

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now() + (still ? 0 : SWEEP_DELAY_MS);
    const tick = (now: number) => {
      const t = still ? 1 : Math.max(0, Math.min(1, (now - start) / SWEEP_MS));
      setValue(Math.round(target * easeOutExpo(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

export function ScoreRing({
  score,
  label,
  unit,
  tier,
  reaction,
}: {
  score: number;
  label: string;
  unit: string;
  tier: string;
  reaction: string;
}) {
  const shown = useCountUp(score);
  const color = TIER_COLOR[flyTier(score)];

  return (
    <div className="flex flex-col items-center">
      <div className="font-[family-name:var(--mono)] text-[10px] tracking-[0.2em] whitespace-nowrap text-[color:var(--ink-3)]">
        {label}
      </div>
      <div className="fv-ring-in relative mt-4 aspect-square w-[min(300px,64vw)]">
        <svg viewBox="0 0 200 200" className="block size-full -rotate-90 overflow-visible">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--line)" strokeWidth="6" />
          <circle
            className="fv-ring-arc"
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100 100"
            style={{ strokeDashoffset: 100 - score, filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-baseline justify-center pt-[33%] font-[family-name:var(--serif)] leading-none">
          <span className="text-[88px] tabular-nums" style={{ color }}>
            {shown}
          </span>
          <span className="ml-1.5 text-[20px] text-[color:var(--ink-2)]">{unit}</span>
        </div>
      </div>
      <div
        className="fv-tier-in mt-5 rounded-full border px-4 py-1.5 font-[family-name:var(--serif)] text-[17px] whitespace-nowrap"
        style={{ borderColor: color, color }}
      >
        {tier}
      </div>
      <div className="fv-tier-in mt-4 font-[family-name:var(--mono)] text-[10.5px] tracking-[0.1em] text-[color:var(--ink-3)] [animation-delay:1300ms]">
        {reaction}
      </div>
    </div>
  );
}
