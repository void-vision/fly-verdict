import { driveScore } from "./fly-score.mjs";
import type { SpikeReadout, Verdict, VerdictKind } from "./types";

/** Verdict lines per kind (see copy.ts); the photo hash picks one, so the same face always gets the same line. */
const LINE_VARIANTS = 3;

const NEEDLE: Record<VerdictKind, number> = {
  escape: 62,
  approach: -58,
  hesitate: 6,
};

/** The circuit decides the reaction; the looks score is added from landmarks on the main thread. */
export type BrainVerdict = Omit<Verdict, "flyScore" | "geometry">;

export function verdictFromReadout(readout: SpikeReadout, seed: number): BrainVerdict {
  const score = driveScore(readout);
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
