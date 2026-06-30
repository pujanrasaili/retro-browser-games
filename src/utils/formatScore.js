// Caps a score display at a fixed digit width, then switches to an
// abbreviated format (e.g. 1.2M) once it would overflow that width.
// Used anywhere a score is shown in a fixed-width UI element so very
// high scores (uncapped level-multiplied scoring in Tetris, for example)
// never break the layout.
export function formatScore(value, digits = 6) {
  const max = Math.pow(10, digits) - 1;
  if (value <= max) {
    return String(value).padStart(digits, '0');
  }
  if (value < 1_000_000) {
    return String(value);
  }
  const millions = value / 1_000_000;
  return millions.toFixed(millions < 10 ? 1 : 0) + 'M';
}
