"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFlySession } from "@/hooks/useFlySession";
import { useMedia } from "@/hooks/useMedia";
import { useTheme } from "@/hooks/useTheme";
import { generateCNS, drawCloud } from "@/lib/viz/cns-cloud";
import { HowItSees } from "./HowItSees";
import { ShareCards } from "./ShareCards";
import { SiteFooter } from "./SiteFooter";
import { Stage } from "./Stage";
import { Truth } from "./Truth";

export function FlyVerdictApp() {
  const theme = useTheme();
  const session = useFlySession();
  const setFps = session.setFps;
  const cloudRef = useRef<HTMLCanvasElement | null>(null);
  const textColRef = useRef<HTMLDivElement | null>(null);
  const bufRef = useRef<ImageData | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const scrollY = useRef(0);
  const mobile = useMedia("(max-width: 980px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const pointCount = mobile ? 14000 : 46000;
  const pts = useMemo(() => generateCNS(pointCount), [pointCount]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const heroVisible = useRef(true);

  useEffect(() => {
    const canvas = cloudRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      heroVisible.current = entry?.isIntersecting ?? true;
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      frames++;
      if (now - last > 700) {
        setFps(Math.round((frames * 1000) / (now - last)));
        last = now;
        frames = 0;
      }
      const canvas = cloudRef.current;
      if (!canvas || !heroVisible.current) return;
      let gutter = canvas.clientWidth * 0.52;
      if (textColRef.current) {
        const cr = canvas.getBoundingClientRect();
        const tr = textColRef.current.getBoundingClientRect();
        gutter = tr.right - cr.left + 26;
      }
      drawCloud(canvas, pts, now, {
        light: theme.isLight,
        reduced,
        mouseX: mouse.current.x,
        mouseY: mouse.current.y,
        scrollY: scrollY.current,
        gutterLeft: gutter,
      }, bufRef);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pts, reduced, setFps, theme.isLight]);

  return (
    <div className="fv-wrap">
      <header className="fv-nav">
        <div className="fv-brand">
          <span className="fv-brand-zh">蝇审</span>
          <span className="fv-brand-en">FLY VERDICT</span>
        </div>
        <div className="fv-nav-meta">
          <span className="fv-nav-stat">MaleCNS · 166,691 N · 1.25×10⁸ SYN</span>
          <button type="button" className="fv-theme" onClick={theme.toggle}>
            {theme.isLight ? "DARK ↔" : "LIGHT ↔"}
          </button>
        </div>
      </header>

      <section className="fv-hero">
        <canvas ref={cloudRef} className="absolute inset-0 size-full pointer-events-none" />
        <div className="fv-hero-grid">
          <div ref={textColRef}>
            <div className="fv-kicker">
              <span className="fv-dot" />
              <span>SPECIMEN 001 · DROSOPHILA MELANOGASTER ♂</span>
            </div>
            <h1 className="fv-h1">
              <span>让一只真实果蝇的</span>
              <span>大脑来看你的脸</span>
            </h1>
            <div className="fv-submark">FLY VERDICT · 蝇审</div>
            <p className="fv-lede">
              你的脸会被压成约 800 个六边形小眼的画面，送进按 MaleCNS 视觉通路简化出来的视叶子网络。我们只读它两条回路的放电强度：它想靠近你，还是想逃跑。
            </p>
            <div className="fv-cta-row">
              <a className="fv-btn-primary" href="#stage" style={{ borderBottom: "none" }}>
                让苍蝇看看你 →
              </a>
              <a className="fv-btn-link" href="#truth">
                这是真的吗？
              </a>
            </div>
            <div className="fv-privacy">
              <span className="fv-privacy-k">PRIVACY</span>
              <span className="fv-privacy-v">
                照片不会离开你的设备。没有服务器，一个字节都不上传。
              </span>
            </div>
            <div className="fv-live">
              <div className="fv-live-k">LIVE SIMULATION</div>
              <div className="fv-live-grid">
                <div>
                  <div className="fv-live-label">neurons rendered</div>
                  <div style={{ color: "var(--verde)" }}>{pointCount.toLocaleString("en-US")}</div>
                </div>
                <div>
                  <div className="fv-live-label">connectome</div>
                  <div style={{ color: "var(--ink-2)" }}>MaleCNS v1.0</div>
                </div>
                <div>
                  <div className="fv-live-label">pathway neurons</div>
                  <div style={{ color: "var(--ink-2)" }}>
                    {session.circuitInfo?.neurons.toLocaleString("en-US") ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="fv-live-label">frame</div>
                  <div style={{ color: "var(--ink-2)" }}>{session.fps} fps</div>
                </div>
                <div>
                  <div className="fv-live-label">face landmarks</div>
                  <div style={{ color: "var(--ink-2)" }}>
                    {(session.verdict?.landmarkCount || session.faces[0]?.landmarkCount)?.toLocaleString("en-US") ??
                      "—"}
                  </div>
                </div>
                <div>
                  <div className="fv-live-label">spike events</div>
                  <div style={{ color: "var(--amber)" }}>
                    {session.verdict ? `${session.verdict.readout.dnp09} / 200ms` : "idle"}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9.5,
                  lineHeight: 1.7,
                  letterSpacing: "0.06em",
                  color: "var(--ink-3)",
                  marginTop: 18,
                }}
              >
                图中点云为果蝇体态的程序化近似；复眼、翅与神经系统按真实结构分区着色，非逐神经元解剖坐标。
              </div>
            </div>
          </div>
          <div aria-hidden />
        </div>
        <div className="fv-hero-foot">
          <span>↓ 向下滚动，视角将推进至视叶</span>
          <span>OPTIC LOBE · MEDULLA · LOBULA PLATE</span>
        </div>
      </section>

      <HowItSees light={theme.isLight} />
      <Stage
        light={theme.isLight}
        stage={session.stage}
        load={session.load}
        loadNote={session.loadNote}
        scan={session.scan}
        faces={session.faces}
        frame={session.frame}
        verdict={session.verdict}
        error={session.error}
        videoRef={session.videoRef}
        startCamera={() => void session.startCamera()}
        capture={() => void session.capture()}
        ingestFile={(file) => void session.ingestFile(file)}
        pickFace={(id) => void session.pickFace(id)}
        replay={() => void session.replay()}
        reset={session.reset}
      />
      <ShareCards light={theme.isLight} verdict={session.verdict} />
      <Truth />
      <SiteFooter />
    </div>
  );
}
