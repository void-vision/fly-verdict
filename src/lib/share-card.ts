import { hexCells } from "./ommatidia";
import { COPY, tierCopy, verdictLine } from "./copy";
import type { Lang, OmmatidiaFrame, Verdict } from "./types";

const COLOR = {
  escape: [232, 168, 96],
  approach: [110, 214, 178],
  hesitate: [178, 150, 230],
} as const;

export function downloadShareCard(
  verdict: Verdict,
  frame: OmmatidiaFrame | null,
  light: boolean,
  lang: Lang,
) {
  const w = 1080;
  const h = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = light ? "#efe9dd" : "#1c1917";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = light ? "#231f1c" : "#f2ece2";
  ctx.font = "300 54px Newsreader, 'Noto Serif SC', serif";
  ctx.fillText("蝇审", 72, 120);
  ctx.font = "400 22px 'IBM Plex Mono', monospace";
  ctx.fillStyle = light ? "#6c6459" : "#9c9489";
  ctx.fillText(verdict.kind.toUpperCase(), w - 72 - ctx.measureText(verdict.kind.toUpperCase()).width, 120);

  const cells = hexCells();
  const R = 360;
  const cx = w / 2;
  const cy = 720;
  const accent = COLOR[verdict.kind];
  const lum = frame?.luminance;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]!;
    const ax = 18 * cell.q;
    const ay = 18 * Math.sqrt(3) * (cell.r + cell.q / 2);
    const rad = Math.hypot(ax, ay) / R;
    if (rad > 1.02) continue;
    const zc = Math.sqrt(Math.max(0, 1 - Math.min(1, rad * rad)));
    const px = cx + ax * (0.88 + 0.12 * zc);
    const py = cy + ay * (0.88 + 0.12 * zc);
    const size = 16 * (0.6 + 0.4 * zc);
    const v = lum?.[i] ?? 0.2;
    const dim = 0.4 + 0.6 * zc;
    let rr: number;
    let gg: number;
    let bb: number;
    if (light) {
      const t = 1 - v * 0.8;
      rr = 226 * t * dim + 20;
      gg = 219 * t * dim + 18;
      bb = 206 * t * dim + 16;
    } else {
      rr = (26 + v * 200) * dim;
      gg = (24 + v * 194) * dim;
      bb = (22 + v * 178) * dim;
    }
    rr = rr * 0.8 + accent[0] * v * 0.26;
    gg = gg * 0.8 + accent[1] * v * 0.26;
    bb = bb * 0.8 + accent[2] * v * 0.26;
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const a = (Math.PI / 180) * 60 * j;
      const x = px + size * Math.cos(a);
      const y = py + size * Math.sin(a);
      if (j) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`;
    ctx.fill();
  }

  const accentCss = `rgb(${accent[0]},${accent[1]},${accent[2]})`;
  const muted = light ? "#6c6459" : "#9c9489";
  const score = COPY[lang].score;
  ctx.fillStyle = muted;
  ctx.font = "400 24px 'IBM Plex Mono', monospace";
  ctx.fillText(score.label, 72, 1200);
  ctx.fillStyle = accentCss;
  ctx.font = "300 190px Newsreader, 'Noto Serif SC', serif";
  const points = String(verdict.flyScore);
  ctx.fillText(points, 64, 1380);
  const pointsW = ctx.measureText(points).width;
  ctx.fillStyle = muted;
  ctx.font = "400 40px Newsreader, 'Noto Serif SC', serif";
  ctx.fillText(score.unit, 64 + pointsW + 16, 1380);
  ctx.fillStyle = light ? "#231f1c" : "#f2ece2";
  ctx.font = "400 34px Newsreader, 'Noto Serif SC', serif";
  ctx.fillText(tierCopy(lang, verdict).title, 72, 1440);

  ctx.fillStyle = accentCss;
  ctx.font = "500 26px 'IBM Plex Mono', monospace";
  const headline = COPY[lang].share.cards.find((card) => card.kind === verdict.kind)!.headline;
  ctx.fillText(headline, 72, 1520);
  ctx.fillStyle = light ? "#231f1c" : "#f2ece2";
  ctx.font = "400 40px Newsreader, 'Noto Serif SC', serif";
  wrapText(ctx, verdictLine(lang, verdict), 72, 1585, w - 144, 54, lang === "en");

  ctx.strokeStyle = light ? "#cdc4b2" : "#3a3532";
  ctx.beginPath();
  ctx.moveTo(72, 1720);
  ctx.lineTo(w - 72, 1720);
  ctx.stroke();
  ctx.fillStyle = light ? "#6c6459" : "#9c9489";
  ctx.font = "400 22px 'IBM Plex Mono', monospace";
  ctx.fillText("MaleCNS · CC-BY · photo never left the device", 72, 1770);
  ctx.fillText(`${verdict.readout.dnp09} / ${verdict.readout.dna02} spikes · 200ms`, 72, 1810);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `fly-verdict-${verdict.flyScore}-${verdict.kind}.png`;
  a.click();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  byWord: boolean,
) {
  // CJK can break anywhere; Latin text must break between words.
  const tokens = byWord ? text.split(/(?<= )/) : [...text];
  let line = "";
  let yy = y;
  for (const token of tokens) {
    const next = line + token;
    if (line && ctx.measureText(next.trimEnd()).width > maxW) {
      ctx.fillText(line.trimEnd(), x, yy);
      line = token;
      yy += lineH;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line.trimEnd(), x, yy);
}
