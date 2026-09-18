"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/hooks/useLang";
import { tierCopy, verdictLine } from "@/lib/copy";
import type { Verdict } from "@/lib/types";
import { drawShareMosaic } from "@/lib/viz/hex-eye";

const COLOR: Record<string, string> = {
  approach: "var(--verde)",
  hesitate: "var(--iris)",
  escape: "var(--amber)",
};

export function ShareCards({ light, verdict }: { light: boolean; verdict: Verdict | null }) {
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const { lang, t } = useLang();

  useEffect(() => {
    for (const card of t.share.cards) {
      const canvas = refs.current[card.kind];
      if (canvas) drawShareMosaic(canvas, card.kind, light);
    }
  }, [light, verdict, t]);

  return (
    <section className="fv-section fv-section-alt">
      <div className="fv-inner">
        <div className="mb-[52px] flex flex-wrap items-end justify-between gap-6">
          <h2 className="fv-h2" style={{ fontSize: "clamp(30px,3.2vw,46px)" }}>
            {t.share.h2}
          </h2>
          <div className="text-right font-[family-name:var(--mono)] text-[10.5px] leading-[1.8] tracking-[0.14em] text-[color:var(--ink-3)]">
            {t.share.note1}
            <br />
            {t.share.note2}
          </div>
        </div>
        <div className="fv-cards">
          {t.share.cards.map((card) => (
            <article key={card.code} className="fv-card">
              <div className="flex items-baseline justify-between">
                <span className="font-[family-name:var(--serif)] text-base tracking-[0.06em]">蝇审</span>
                <span className="font-[family-name:var(--mono)] text-[9px] tracking-[0.18em] text-[color:var(--ink-3)]">
                  {card.code}
                </span>
              </div>
              <canvas
                ref={(el) => {
                  refs.current[card.kind] = el;
                }}
                className="block min-h-0 w-full flex-1"
              />
              <div
                className="font-[family-name:var(--mono)] text-[9.5px] tracking-[0.18em]"
                style={{ color: COLOR[card.kind] }}
              >
                {card.headline}
              </div>
              {verdict?.kind === card.kind && (
                <div className="-mt-1 flex items-baseline gap-2 font-[family-name:var(--serif)] leading-none">
                  <span className="text-[34px] tabular-nums" style={{ color: COLOR[card.kind] }}>
                    {verdict.flyScore}
                  </span>
                  <span className="font-[family-name:var(--mono)] text-[9.5px] tracking-[0.14em] text-[color:var(--ink-3)]">
                    {tierCopy(lang, verdict).title}
                  </span>
                </div>
              )}
              <div className="-mt-1.5 font-[family-name:var(--serif)] text-[15.5px] leading-[1.38]">
                {verdict?.kind === card.kind ? verdictLine(lang, verdict) : card.line}
              </div>
              <div className="mt-auto grid grid-cols-[1fr_auto] gap-x-2.5 gap-y-1 border-t border-[color:var(--line)] pt-4 font-[family-name:var(--mono)] text-[9.5px] leading-[1.8] text-[color:var(--ink-3)]">
                <span>
                  {card.kind === "escape" && verdict
                    ? "escape latency"
                    : card.metricKey}
                </span>
                <span className="text-right" style={{ color: COLOR[card.kind] }}>
                  {card.kind === "escape" && verdict
                    ? `${verdict.readout.latencyMs} ms`
                    : card.kind === "approach" && verdict
                      ? `${verdict.readout.dna02} spikes/200ms`
                      : card.kind === "hesitate" && verdict
                        ? `${verdict.readout.lplc2} spikes/200ms`
                        : card.metricVal}
                </span>
                <span>flyverdict.xyz</span>
                <span className="text-right">MaleCNS · CC-BY</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
