/**
 * "Looks, to a fruit fly": a 40..99 score read from a second run of the circuit.
 *
 * The verdict run sees the photo as-is, and raw brightness dominates it: a darker
 * exposure (or darker skin) starves DNa02 and reads as "escape". A looks score built
 * on that would rank people by skin tone. So the score run gets the same ommatidia
 * with mean and contrast normalized away, and only the light/dark layout is left.
 *
 * What remains is small next to the Poisson noise of a 200 ms window, so the score is
 * mostly the fly's mood for this exact photo: deterministic (the seed is the photo
 * hash), but a new photo can land anywhere. The copy says so.
 *
 * Plain JS so scripts/check-sim.mjs can import it without a TS loader.
 */

/**
 * Where normalized runs of a real aligned face land: mean 0.407, sd 0.006 over 42 seeds ×
 * three exposures of one test photo. Faces share the dark border around the alignment
 * crop, so synthetic patterns (mean 0.392) are the wrong reference.
 *
 * The curve is deliberately generous: CENTER sits above that mean and nobody drops
 * below FLOOR, so the average lands near 74 (median 75, ~15% at 90+, ~10% under 55).
 * Recalibrate if more real faces show a different centre.
 */
const CENTER = 0.409;
const SPREAD = 0.005;
const FLOOR = 40;
const TARGET_MEAN = 0.5;
const TARGET_SD = 0.2;

/**
 * Escape minus approach drive, normalized to -1..1 (positive = flee).
 * @param {{ lplc2: number; gf: number; dnp09: number; dna02: number }} readout
 * @returns {number}
 */
export function driveScore(readout) {
  const escapeDrive = readout.dnp09 * 2.4 + readout.gf * 1.8 + readout.lplc2 * 0.035;
  const approachDrive = readout.dna02 * 1.15;
  return (escapeDrive - approachDrive) / Math.max(1, escapeDrive + approachDrive);
}

/**
 * Same layout, fixed mean and contrast: exposure and skin tone drop out.
 * @param {ArrayLike<number>} luminance
 * @returns {Float32Array}
 */
export function normalizeLuminance(luminance) {
  const n = luminance.length;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += luminance[i];
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (luminance[i] - mean) ** 2;
  const gain = TARGET_SD / Math.max(Math.sqrt(variance / n), 1e-3);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = Math.min(1, Math.max(0, TARGET_MEAN + (luminance[i] - mean) * gain));
  }
  return out;
}

/**
 * `driveScore` of the normalized run → FLOOR..99, higher = the fly minds you less.
 * @param {number} looksDrive
 * @returns {number}
 */
export function flyScore(looksDrive) {
  const s = 1 / (1 + Math.exp((looksDrive - CENTER) / SPREAD));
  return Math.min(99, Math.max(FLOOR, Math.round(FLOOR + (99 - FLOOR) * s)));
}

/**
 * Tier index into `COPY[lang].tiers`, highest first.
 * @param {number} points @returns {number}
 */
export function flyTier(points) {
  if (points >= 90) return 0;
  if (points >= 80) return 1;
  if (points >= 70) return 2;
  if (points >= 55) return 3;
  return 4;
}
