"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/hooks/useLang";
import { drawStep1, drawStep2, drawStep3 } from "@/lib/viz/hex-eye";

const STEP_COLORS = ["var(--verde)", "var(--iris)", "var(--amber)"];

export function HowItSees({ light }: { light: boolean }) {
  const s1 = useRef<HTMLCanvasElement | null>(null);
  const s2 = useRef<HTMLCanvasElement | null>(null);
  const s3 = useRef<HTMLCanvasElement | null>(null);
  const canvases = [s1, s2, s3];
  const { t } = useLang();

  useEffect(() => {
    if (s1.current) drawStep1(s1.current, light);
    if (s2.current) drawStep2(s2.current, light);
    if (s3.current) drawStep3(s3.current, light);
  }, [light]);

  return (
    <section className="fv-section fv-section-alt">
      <div className="fv-inner">
        <div className="mb-[74px] grid items-end gap-[60px] max-[980px]:gap-8 min-[981px]:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
          <h2 className="fv-h2">
            {t.how.h2a}
            <br />
            {t.how.h2b}
          </h2>
          <p className="mb-2 max-w-[60ch] font-[family-name:var(--sans)] text-[15px] leading-[1.75] text-[color:var(--ink-2)]">
            {t.how.intro}
          </p>
        </div>
        <div className="fv-steps">
          {t.how.steps.map((step, i) => (
            <article key={i} className="fv-step">
              <div className="flex items-baseline justify-between">
                <span
                  className="font-[family-name:var(--mono)] text-[11px] tracking-[0.2em]"
                  style={{ color: STEP_COLORS[i] }}
                >
                  {step.num}
                </span>
                <span className="font-[family-name:var(--mono)] text-[10px] tracking-[0.16em] text-[color:var(--ink-3)]">
                  {step.tag}
                </span>
              </div>
              <canvas ref={canvases[i]} className="block aspect-[16/10] w-full" />
              <h3>
                {step.h3a}
                <br />
                {step.h3b}
              </h3>
              <p>{step.p}</p>
              <div className="border-t border-[color:var(--line)] pt-3.5 font-[family-name:var(--mono)] text-[10.5px] tracking-[0.08em] text-[color:var(--ink-3)]">
                {step.foot}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
