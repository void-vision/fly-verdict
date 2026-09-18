/**
 * "Looks, to a fruit fly", scored from face geometry: left/right symmetry plus a few
 * classic proportions, all measured from MediaPipe landmarks.
 *
 * Why not the circuit: a 200 ms spiking window is chaotic enough that moving the same
 * face a few centimetres flips the score. Landmarks are measured in units of the
 * interpupillary distance after levelling the eye line, so distance, in-plane tilt,
 * lighting and skin tone all drop out. Turning the head does not: yaw reads as
 * asymmetry, which is fine (face the fly, get a better score).
 *
 * Plain JS so scripts/check-sim.mjs can import it without a TS loader.
 */

const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;

/** Mirror pairs across the facial midline: eyes, lids, brows, nose wings, mouth, jaw. */
const PAIRS = [
  [33, 263], [133, 362], [159, 386], [145, 374],
  [70, 300], [105, 334], [107, 336],
  [129, 358], [61, 291], [37, 267], [84, 314],
  [234, 454], [172, 397], [58, 288], [136, 365], [150, 379],
];
/** Points on the midline: forehead, nasion, bridge, tip, base, lips, chin. */
const MIDLINE = [10, 168, 6, 1, 2, 0, 17, 152];

/**
 * [weight, ideal] per ratio; deviation is |ln(actual / ideal)|. Ideals are the classic
 * canons restated in MediaPipe terms: its eye and mouth corners sit inside the
 * anatomical ones, so a canon-perfect face reads ~1.25 and ~0.70 rather than 1 and 0.95.
 */
const PROPORTIONS = {
  /** Rule of fifths: the gap between the eyes is one eye wide. */
  innerGapToEye: [1, 1.25],
  /** Mouth corners roughly under the pupils. */
  mouthToPupils: [1, 0.7],
  /** Nose base to chin equals brow to nose base. */
  lowerToMiddle: [1, 1],
};

/**
 * Below this interpupillary distance the landmarks get too coarse to score: on a test
 * face the score held within ±4 down to 83 px, then jumped +15 at 70 px.
 */
export const MIN_IPD_PX = 75;

const ASYMMETRY_WEIGHT = 4;
const FLOOR = 40;
/**
 * Lower `badness` = higher score. One test face re-shot at different distances,
 * exposures and offsets reads badness ≈ 0.45 ± 0.05; SPREAD keeps that jitter to about
 * ±3 points, and CENTER puts a typical face near 74 (the curve is deliberately generous).
 * Only one real face so far: recalibrate CENTER once more photos are available.
 */
const CENTER = 0.51;
const SPREAD = 0.2;

/**
 * @typedef {{ x: number; y: number; z?: number }} Landmark
 * @typedef {{ asymmetry: number; proportion: number; badness: number; ipdPx: number }} Geometry
 */

/**
 * @param {Landmark[]} landmarks normalized 0..1 as MediaPipe returns them
 * @param {number} width source image width in px
 * @param {number} height source image height in px
 * @returns {Geometry | null} null when the landmarks are unusable
 */
export function faceGeometry(landmarks, width, height) {
  const px = (i) => {
    const p = landmarks[i];
    return p ? { x: p.x * width, y: p.y * height } : null;
  };
  const mid = (a, b) => (a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : null);
  const left = px(LEFT_IRIS) ?? mid(px(33), px(133));
  const right = px(RIGHT_IRIS) ?? mid(px(263), px(362));
  if (!left || !right) return null;
  const ipd = Math.hypot(right.x - left.x, right.y - left.y);
  if (ipd < 1e-6) return null;

  // Eye midpoint at the origin, eye line horizontal, one interpupillary distance = 1.
  const ox = (left.x + right.x) / 2;
  const oy = (left.y + right.y) / 2;
  const angle = Math.atan2(right.y - left.y, right.x - left.x);
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const at = (i) => {
    const p = px(i);
    if (!p) return null;
    const dx = p.x - ox;
    const dy = p.y - oy;
    return { x: (dx * cos - dy * sin) / ipd, y: (dx * sin + dy * cos) / ipd };
  };

  const midline = MIDLINE.map(at).filter(Boolean);
  if (midline.length < 4) return null;
  const midX = midline.reduce((s, p) => s + p.x, 0) / midline.length;
  const drift = midline.reduce((s, p) => s + Math.abs(p.x - midX), 0) / midline.length;

  let pairError = 0;
  let pairs = 0;
  for (const [a, b] of PAIRS) {
    const pa = at(a);
    const pb = at(b);
    if (!pa || !pb) continue;
    pairError += Math.abs(pa.x - midX + (pb.x - midX)) + Math.abs(pa.y - pb.y);
    pairs++;
  }
  if (pairs < 8) return null;
  const asymmetry = pairError / pairs + drift;

  const dist = (a, b) => {
    const pa = at(a);
    const pb = at(b);
    return pa && pb ? Math.hypot(pa.x - pb.x, pa.y - pb.y) : NaN;
  };
  const eyeWidth = (dist(33, 133) + dist(263, 362)) / 2;
  const browY = ((at(105)?.y ?? NaN) + (at(334)?.y ?? NaN)) / 2;
  const noseY = at(2)?.y ?? NaN;
  const chinY = at(152)?.y ?? NaN;
  const ratios = {
    innerGapToEye: dist(133, 362) / eyeWidth,
    mouthToPupils: dist(61, 291),
    lowerToMiddle: (chinY - noseY) / (noseY - browY),
  };
  let proportion = 0;
  for (const [key, [weight, ideal]] of Object.entries(PROPORTIONS)) {
    const r = ratios[key];
    if (Number.isFinite(r) && r > 0) proportion += weight * Math.abs(Math.log(r / ideal));
  }

  return { asymmetry, proportion, badness: ASYMMETRY_WEIGHT * asymmetry + proportion, ipdPx: ipd };
}

/**
 * @param {Geometry} geometry
 * @returns {number} FLOOR..99
 */
export function geometryScore(geometry) {
  const s = 1 / (1 + Math.exp((geometry.badness - CENTER) / SPREAD));
  return Math.min(99, Math.max(FLOOR, Math.round(FLOOR + (99 - FLOOR) * s)));
}
