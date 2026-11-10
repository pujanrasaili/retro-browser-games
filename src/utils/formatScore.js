// Caps a score display at a fixed digit width, then switches to an
// abbreviated format (e.g. 1.2M) once it would overflow that width.
// Used anywhere a score is shown in a fixed-width UI element so very
// high scores (uncapped level-multiplied scoring in Tetris, for example)
// never break the layout.
export function formatScore(value, digits = 6) {
  // Anything that is not a usable score (NaN from a corrupted saved value, undefined, a
  // negative) is shown as zero. NaN used to fall through every comparison below and come
  // out as "NaNM".
  const score = Number.isFinite(value) && value >= 0 ? value : 0;
  const max = Math.pow(10, digits) - 1;
  if (score <= max) {
    return String(score).padStart(digits, '0');
  }
  if (score < 1_000_000) {
    return String(score);
  }
  const millions = score / 1_000_000;
  return millions.toFixed(millions < 10 ? 1 : 0) + 'M';
}
