import type { SpikeReadout, Verdict, VerdictKind } from "./types";

export const VERDICT_COPY: Record<VerdictKind, string> = {
  escape: "逃逸反射触发，用时 212ms。别往心里去，它对你的咖啡杯也这样。",
  approach: "它朝你转了 14°。在果蝇的世界里，这几乎算一见钟情。",
  hesitate: "它犹豫了。77 个逼近检测神经元投了弃权票。",
};

const NEEDLE: Record<VerdictKind, number> = {
  escape: 62,
  approach: -58,
  hesitate: 6,
};

export function verdictFromReadout(readout: SpikeReadout, seed: number): Verdict {
  const escapeDrive = readout.dnp09 * 2.4 + readout.gf * 1.8 + readout.lplc2 * 0.035;
  const approachDrive = readout.dna02 * 1.15;
  const score = (escapeDrive - approachDrive) / Math.max(1, escapeDrive + approachDrive);
  const kind: VerdictKind =
    Math.abs(score) < 0.12 ? "hesitate" : score > 0 ? "escape" : "approach";
  const line =
    kind === "escape"
      ? `逃逸反射触发，用时 ${readout.latencyMs}ms。别往心里去，它对一片吐司也这样。`
      : VERDICT_COPY[kind];
  return {
    kind,
    score,
    needleAngle: NEEDLE[kind],
    readout,
    seed,
    line,
    landmarkCount: 0,
    engine: "worker",
  };
}
