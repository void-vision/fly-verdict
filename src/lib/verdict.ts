import type { SpikeReadout, Verdict, VerdictKind } from "./types";

/** Verdict lines per kind (see copy.ts); the photo hash picks one, so the same face always gets the same line. */
const LINE_VARIANTS = 3;

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
  return {
    kind,
    score,
    needleAngle: NEEDLE[kind],
    readout,
    seed,
    lineIndex: (seed >>> 0) % LINE_VARIANTS,
    landmarkCount: 0,
    engine: "worker",
  };
}
