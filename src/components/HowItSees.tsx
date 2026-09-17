"use client";

import { useEffect, useRef } from "react";
import { drawStep1, drawStep2, drawStep3 } from "@/lib/viz/hex-eye";

export function HowItSees({ light }: { light: boolean }) {
  const s1 = useRef<HTMLCanvasElement | null>(null);
  const s2 = useRef<HTMLCanvasElement | null>(null);
  const s3 = useRef<HTMLCanvasElement | null>(null);

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
            它是怎么
            <br />
            看你的
          </h2>
          <p className="mb-2 max-w-[60ch] font-[family-name:var(--sans)] text-[15px] leading-[1.75] text-[color:var(--ink-2)]">
            三步，全部发生在你的浏览器里。每一步都对应果蝇视觉系统中一个已被完整重建的真实结构。
          </p>
        </div>
        <div className="fv-steps">
          <article className="fv-step">
            <div className="flex items-baseline justify-between">
              <span className="font-[family-name:var(--mono)] text-[11px] tracking-[0.2em] text-[color:var(--verde)]">
                01 / 复眼
              </span>
              <span className="font-[family-name:var(--mono)] text-[10px] tracking-[0.16em] text-[color:var(--ink-3)]">
                COMPOUND EYE
              </span>
            </div>
            <canvas ref={s1} className="block aspect-[16/10] w-full" />
            <h3>
              约 800 个小眼，
              <br />
              每个只报告一个亮度值
            </h3>
            <p>你的脸先被投到一张球面的六边形网格上。它看到的不是一张脸，是 800 个明暗读数。</p>
            <div className="border-t border-[color:var(--line)] pt-3.5 font-[family-name:var(--mono)] text-[10.5px] tracking-[0.08em] text-[color:var(--ink-3)]">
              ommatidia ≈ 800 · R1–R8 photoreceptors · 每眼
            </div>
          </article>
          <article className="fv-step">
            <div className="flex items-baseline justify-between">
              <span className="font-[family-name:var(--mono)] text-[11px] tracking-[0.2em] text-[color:var(--iris)]">
                02 / 神经元
              </span>
              <span className="font-[family-name:var(--mono)] text-[10px] tracking-[0.16em] text-[color:var(--ink-3)]">
                LPLC2
              </span>
            </div>
            <canvas ref={s2} className="block aspect-[16/10] w-full" />
            <h3>
              77 个神经元
              <br />
              只找一件事：放大的黑影
            </h3>
            <p>信号进入视叶。LPLC2 是逼近检测神经元，一张正在靠近的脸，对它来说和一只掠过的鸟没有本质区别。</p>
            <div className="border-t border-[color:var(--line)] pt-3.5 font-[family-name:var(--mono)] text-[10.5px] tracking-[0.08em] text-[color:var(--ink-3)]">
              LPLC2 · n=77 · looming detection
            </div>
          </article>
          <article className="fv-step">
            <div className="flex items-baseline justify-between">
              <span className="font-[family-name:var(--mono)] text-[11px] tracking-[0.2em] text-[color:var(--amber)]">
                03 / 反射
              </span>
              <span className="font-[family-name:var(--mono)] text-[10px] tracking-[0.16em] text-[color:var(--ink-3)]">
                DNp09
              </span>
            </div>
            <canvas ref={s3} className="block aspect-[16/10] w-full" />
            <h3>
              两条下行通路
              <br />
              争夺同一副肌肉
            </h3>
            <p>逃逸回路和转向靠近回路同时收到消息，谁的放电更强，就决定这只果蝇走还是留。</p>
            <div className="border-t border-[color:var(--line)] pt-3.5 font-[family-name:var(--mono)] text-[10.5px] tracking-[0.08em] text-[color:var(--ink-3)]">
              escape latency ≈ 212 ms · descending neurons
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
