/**
 * Shared scoring helpers. The looks score itself comes from face geometry
 * (face-geometry.mjs); the circuit only decides the fly's reaction.
 *
 * Plain JS so scripts/check-sim.mjs can import it without a TS loader.
 */

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
