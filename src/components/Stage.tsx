"use client";

import { useEffect, useRef, useState } from "react";
import { panelCopy, STATE_DEFS } from "@/lib/copy";
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
  const copy = panelCopy(stage, kind);
  const meta = STATE_DEFS.find((s) => s.key === stage)!;
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
          <h2 className="fv-h2">让苍蝇看看你</h2>
          <div className="text-right font-[family-name:var(--mono)] text-[10.5px] leading-[1.9] tracking-[0.16em] text-[color:var(--ink-3)]">
            STAGE · {meta.code}
            <br />
            <span className="text-[color:var(--verde)]">{meta.label}</span>
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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[color-mix(in_oklab,var(--bg)_84%,transparent)] px-10 backdrop-blur-[2px]">
                <div className="mb-[26px] text-center font-[family-name:var(--mono)] text-[10px] tracking-[0.2em] whitespace-nowrap text-[color:var(--ink-3)]">
                  VERDICT DIAL · spikes/200ms
                </div>
                <div className="w-full max-w-[440px]" style={{ perspective: 900 }}>
                  <div style={{ transform: "rotateX(54deg)", transformStyle: "preserve-3d" }}>
                    <svg viewBox="0 0 440 240" className="block w-full overflow-visible">
                      <path d="M40 200 A 180 180 0 0 1 400 200" fill="none" stroke="var(--line)" strokeWidth="18" />
                      <path d="M40 200 A 180 180 0 0 1 220 20" fill="none" stroke="var(--verde)" strokeWidth="18" opacity=".32" />
                      <path d="M220 20 A 180 180 0 0 1 400 200" fill="none" stroke="var(--amber)" strokeWidth="18" opacity=".32" />
                      <g transform={`translate(220,200) rotate(${verdict.needleAngle})`}>
                        <line x1="0" y1="0" x2="0" y2="-168" stroke={NEEDLE[kind]} strokeWidth="3" />
                        <circle cx="0" cy="-168" r="7" fill={NEEDLE[kind]} />
                      </g>
                      <circle cx="220" cy="200" r="9" fill="var(--ink)" />
                    </svg>
                  </div>
                </div>
                <div className="mt-[18px] flex w-full max-w-[480px] justify-between gap-5 font-[family-name:var(--mono)] text-[10.5px] tracking-[0.1em]">
                  <span className="whitespace-nowrap text-[color:var(--verde)]">← 靠近 APPROACH</span>
                  <span className="whitespace-nowrap text-[color:var(--amber)]">ESCAPE 逃跑 →</span>
                </div>
              </div>
            )}
          </div>

          <aside className="fv-side">
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
                  <i style={{ width: `${Math.round(progress * 100)}%` }} />
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
                  {verdict.line}
                </div>
              </>
            )}
            {error && (
              <div className="font-[family-name:var(--mono)] text-[11px] text-[color:var(--amber)]">
                {error}
              </div>
            )}
            <div className="mt-auto flex flex-col gap-2.5">
              {stage === "empty" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void startCamera()}>
                    开启摄像头
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={() => fileRef.current?.click()}>
                    上传照片
                  </button>
                </>
              )}
              {stage === "permission" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void startCamera()}>
                    允许并继续
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={() => fileRef.current?.click()}>
                    改为上传照片
                  </button>
                </>
              )}
              {stage === "loading" && (
                <button type="button" className="fv-btn-ghost" onClick={reset}>
                  取消
                </button>
              )}
              {stage === "live" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void capture()}>
                    拍摄这一帧
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={reset}>
                    关掉摄像头
                  </button>
                </>
              )}
              {stage === "noface" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void startCamera()}>
                    重试
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={() => fileRef.current?.click()}>
                    上传照片
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
                    审第 {face.id + 1} 张
                  </button>
                ))}
              {stage === "scanning" && (
                <button type="button" className="fv-btn-ghost" onClick={reset}>
                  中止
                </button>
              )}
              {stage === "result" && (
                <>
                  <button type="button" className="fv-btn-block" onClick={() => void replay()}>
                    再看一次
                  </button>
                  <button
                    type="button"
                    className="fv-btn-ghost"
                    onClick={() => {
                      if (verdict) downloadShareCard(verdict, frame, light);
                    }}
                  >
                    生成分享卡
                  </button>
                  <button type="button" className="fv-btn-ghost" onClick={reset}>
                    换一张脸
                  </button>
                </>
              )}
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
