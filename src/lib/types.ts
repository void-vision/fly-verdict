export type ThemeName = "dark" | "light";
export type Lang = "zh" | "en";

export type StageKey =
  | "empty"
  | "permission"
  | "loading"
  | "noface"
  | "toosmall"
  | "multiface"
  | "live"
  | "scanning"
  | "result";

export type VerdictKind = "escape" | "approach" | "hesitate";

export type Point2 = { x: number; y: number };

export type Landmark = { x: number; y: number; z?: number };

export type FaceBox = {
  id: number;
  landmarks: Landmark[];
  landmarkCount: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type OmmatidiaFrame = {
  rings: number;
  count: number;
  /** Axial hex coords packed as [q, r, ...] */
  coords: Int16Array;
  /** Photoreceptor luminance 0..1, same order as coords */
  luminance: Float32Array;
  width: number;
  height: number;
};

export type SpikeReadout = {
  lplc2: number;
  gf: number;
  dnp09: number;
  dna02: number;
  windowMs: number;
  latencyMs: number;
};

export type Verdict = {
  kind: VerdictKind;
  score: number;
  /** 40..99 "looks, to a fruit fly", from face geometry; see face-geometry.mjs */
  flyScore: number;
  /** In interpupillary distances; null if the landmarks were unusable. */
  geometry: { asymmetry: number; proportion: number } | null;
  needleAngle: number;
  readout: SpikeReadout;
  seed: number;
  /** Which verdict line to show; resolved per language by `verdictLine`. */
  lineIndex: number;
  landmarkCount: number;
  engine: "worker" | "main";
};

export type BrainProgress = {
  label: string;
  note: string;
  fraction: number;
};

export type DetectedImage = {
  source: "camera" | "upload";
  bitmap: ImageBitmap;
  hashSeed: number;
};
