"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { COPY, panelCopy, stageMeta, tierCopy, verdictLine } from "@/lib/copy";
import { downloadShareCard } from "@/lib/share-card";
import { drawOmmatidiaEye } from "@/lib/viz/hex-eye";
import type { FaceBox, OmmatidiaFrame, StageKey, Verdict } from "@/lib/types";
import type { RefObject } from "react";

type StageProps = {
  light: boolean;
  stage: StageKey;
  load: number;
  loadNote: string;
  scan: number;
  faces: FaceBox[];
  frame: OmmatidiaFrame | null;
  verdict: Verdict | null;
  error: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  startCamera: () => void;
  capture: () => void;
  ingestFile: (file: File) => void;
  pickFace: (id: number) => void;
  replay: () => void;
  reset: () => void;
};

const NEEDLE: Record<string, string> = {
  escape: "var(--amber)",
  approach: "var(--verde)",
  hesitate: "var(--iris)",
};

export function Stage({
  light,
  stage,
  load,
  loadNote,
  scan,
  faces,
  frame,
  verdict,
  error,
  videoRef,
  startCamera,
  capture,
  ingestFile,
  pickFace,
  replay,
  reset,
}: StageProps) {
  const eyeRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);
  const kind = verdict?.kind ?? "escape";
  const { lang, t } = useLang();
  const copy = panelCopy(lang, stage, kind);
  const meta = stageMeta(lang, stage);
  const b = t.stage.buttons;
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (eyeRef.current) {
        drawOmmatidiaEye(eyeRef.current, now, {
          light,
          reduced: reducedRef.current,
          stage: stage,
          scan: scan,
          kind,
          frame: frame,
          faceCount: faces.length,
        });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [kind, light, faces.length, frame, scan, stage]);

  const progress = stage === "loading" ? load : scan;
  const showProgress = stage === "loading" || stage === "scanning";

  return (
    <section id="stage" className="fv-section">
      <div className="fv-inner">
        <div className="fv-stage-head">
          <h2 className="fv-h2">{t.stage.h2}</h2>
          <div className="text-right font-[family-name:var(--mono)] text-[10.5px] leading-[1.9] tracking-[0.16em] text-[color:var(--ink-3)]">
            STAGE · {meta.code}
            <br />
            <span key={stage} className="fv-overlay-in text-[color:var(--verde)]">{meta.label}</span>
          </div>
        </div>

        <div
          className={`fv-stage-grid fv-drop ${over ? "is-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const file = e.dataTransfer.files[0];
            if (file) void ingestFile(file);
          }}
        >
          <div className="fv-eye-pane">
            <video
              ref={videoRef}
              className="pointer-events-none absolute inset-0 size-full opacity-0"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={eyeRef} className="block aspect-square w-full max-w-[460px]" />
            {stage !== "result" && (
              <>
                <div className="absolute top-[22px] left-6 font-[family-name:var(--mono)] text-[10px] tracking-[0.16em] text-[color:var(--ink-3)]">
                  OMMATIDIAL VIEWFINDER · 817 UNITS
                </div>
                <div className="absolute bottom-[22px] left-6 font-[family-name:var(--mono)] text-[10px] tracking-[0.1em] text-[color:var(--ink-3)]">
                  {copy.eye}
                </div>
              </>
            )}
            {stage === "result" && verdict && (
              <div className="fv-overlay-in absolute inset-0 flex flex-col items-center justify-center bg-[color-mix(in_oklab,var(--bg)_84%,transparent)] px-10 backdrop-blur-[2px]">
                <div className="mb-[18px] text-center">
                  <div className="font-[family-name:var(--mono)] text-[10px] tracking-[0.2em] whitespace-nowrap text-[color:var(--ink-3)]">
                    {COPY[lang].score.label}
                  </div>
                  <div className="mt-1 flex items-baseline justify-center gap-2 font-[family-name:var(--serif)] leading-none">
                    <span className="text-[72px] tabular-nums" style={{ color: NEEDLE[kind] }}>
                      {verdict.flyScore}
                    </span>
                    <span className="text-[18px] text-[color:var(--ink-2)]">{COPY[lang].score.unit}</span>
                  </div>
                  <div className="mt-2 font-[family-name:var(--mono)] text-[11px] tracking-[0.14em] text-[color:var(--ink-2)]">
                    {tierCopy(lang, verdict).title}
                  </div>
                </div>
                <div className="fv-dial-in w-full max-w-[440px]" style={{ perspective: 900 }}>
                  <div style={{ transform: "rotateX(54deg)", transformStyle: "preserve-3d" }}>
                    <svg viewBox="0 0 440 240" className="block w-full overflow-visible">
                      <path d="M40 200 A 180 180 0 0 1 400 200" fill="none" stroke="var(--line)" strokeWidth="18" />
                      <path d="M40 200 A 180 180 0 0 1 220 20" fill="none" stroke="var(--verde)" strokeWidth="18" opacity=".32" />
                      <path d="M220 20 A 180 180 0 0 1 400 200" fill="none" stroke="var(--amber)" strokeWidth="18" opacity=".32" />
                      <g
                        className="fv-needle"
                        style={{ transform: `translate(220px, 200px) rotate(${verdict.needleAngle}deg)` }}
                      >
                        <line x1="0" y1="0" x2="0" y2="-168" stroke={NEEDLE[kind]} strokeWidth="3" />
                        <circle cx="0" cy="-168" r="7" fill={NEEDLE[kind]} />
                      </g>
                      <circle cx="220" cy="200" r="9" fill="var(--ink)" />
                    </svg>
                  </div>
                </div>
                <div className="mt-[18px] flex w-full max-w-[480px] justify-between gap-5 font-[family-name:var(--mono)] text-[10.5px] tracking-[0.1em]">
                  <span className="whitespace-nowrap text-[color:var(--verde)]">{t.stage.approach}</span>
                  <span className="whitespace-nowrap text-[color:var(--amber)]">{t.stage.escape}</span>
                </div>
              </div>
            )}
          </div>

          <aside className="fv-side">
            <div key={stage} className="fv-swap contents">
            <div className="font-[family-name:var(--mono)] text-[10px] tracking-[0.2em] text-[color:var(--verde)]">
              {copy.kicker}
            </div>
            <h3>{copy.title}</h3>
            <p>{copy.body}</p>
            {showProgress && (
              <div className="fv-progress">
                <div className="flex justify-between font-[family-name:var(--mono)] text-[10.5px] text-[color:var(--ink-2)]">
                  <span>{stage === "loading" ? "waking fly" : "spike propagation"}</span>
                  <span className="text-[color:var(--verde)]">{Math.round(progress * 100)}%</span>
                </div>
                <div className="fv-bar">
                  <i style={{ transform: `scaleX(${progress})` }} />
                </div>
                <div className="font-[family-name:var(--mono)] text-[9.5px] leading-[1.7] text-[color:var(--ink-3)]">
                  {stage === "loading"
                    ? loadNote
                    : "optic lobe → LPLC2 → DNp09 / DNa02"}
                </div>
              </div>
            )}
            {stage === "result" && verdict && (
              <>
                <div className="fv-spikes">
                  <span className="text-[color:var(--ink-3)]">fly score</span>
                  <span className="text-right" style={{ color: NEEDLE[kind] }}>
                    {verdict.flyScore} / 100
                  </span>
                  <span className="text-[color:var(--ink-3)]">LPLC2 (looming)</span>
                  <span className="text-right text-[color:var(--amber)]">
                    {verdict.readout.lplc2} spikes
                  </span>
                  <span className="text-[color:var(--ink-3)]">giant fiber</span>
                  <span className="text-right text-[color:var(--amber)]">
                    {verdict.readout.gf} spikes
                  </span>
                  <span className="text-[color:var(--ink-3)]">DNp09 (escape)</span>
                  <span className="text-right text-[color:var(--amber)]">
                    {verdict.readout.dnp09} spikes
                  </span>
                  <span className="text-[color:var(--ink-3)]">DNa02 (turning)</span>
                  <span className="text-right text-[color:var(--verde)]">
                    {verdict.readout.dna02} spikes
                  </span>
                  <span className="text-[color:var(--ink-3)]">window</span>
                  <span className="text-right">200 ms</span>
                  <span className="text-[color:var(--ink-3)]">face landmarks</span>
                  <span className="text-right text-[color:var(--iris)]">
                    {verdict.landmarkCount || faces[0]?.landmarks.length || "—"}
                  </span>
                  <span className="text-[color:var(--ink-3)]">engine</span>
                  <span className="text-right">
                    {verdict.engine === "worker" ? "web worker" : "main thread"}
                  </span>
                </div>
                <div
                  className="border-l-2 pl-4 font-[family-name:var(--serif)] text-[19px] leading-[1.5]"
                  style={{ borderColor: NEEDLE[kind] }}
                >
                  {verdictLine(lang, verdict)}
                  <div className="mt-2 text-[15px] text-[color:var(--ink-2)]">{tierCopy(lang, verdict).line}</div>
                </div>
              </>
            )}
            </div>
            {error && (
              <div className="font-[family-name:var(--mono)] text-[11px] text-[color:var(--amber)]">
                {error}
              </div>
            )}
            <div className="mt-auto flex flex-col gap-2.5">
              <div key={stage} className="fv-swap flex flex-col gap-2.5">
              {stage === "empty" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void startCamera()}>
                    {b.camera}
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={() => fileRef.current?.click()}>
                    {b.upload}
                  </button>
                </>
              )}
              {stage === "permission" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void startCamera()}>
                    {b.allow}
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={() => fileRef.current?.click()}>
                    {b.uploadInstead}
                  </button>
                </>
              )}
              {stage === "loading" && (
                <button type="button" className="fv-btn-ghost" onClick={reset}>
                  {b.cancel}
                </button>
              )}
              {stage === "live" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void capture()}>
                    {b.capture}
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={reset}>
                    {b.closeCam}
                  </button>
                </>
              )}
              {stage === "noface" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void startCamera()}>
                    {b.retry}
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={() => fileRef.current?.click()}>
                    {b.upload}
                  </button>
                </>
              )}
              {stage === "multiface" &&
faces.map((face) => (
                  <button
                    key={face.id}
                    type="button"
                    className="fv-btn-block"
                    onClick={() => void pickFace(face.id)}
                  >
                    {b.pickFace(face.id + 1)}
                  </button>
                ))}
              {stage === "scanning" && (
                <button type="button" className="fv-btn-ghost" onClick={reset}>
                  {b.abort}
                </button>
              )}
              {stage === "result" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void replay()}>
                    {b.replay}
                  </button>
                  <button
                    type="button"
                    className="fv-btn-ghost"
                    onClick={() => {
                      if (verdict) downloadShareCard(verdict, frame, light, lang);
                    }}
                  >
                    {b.share}
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={reset}>
                    {b.reset}
                  </button>
                </>
              )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void ingestFile(file);
                  e.target.value = "";
                }}
              />
              <div className="mt-1.5 font-[family-name:var(--mono)] text-[9.5px] leading-[1.7] text-[color:var(--ink-3)]">
                {copy.foot}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
