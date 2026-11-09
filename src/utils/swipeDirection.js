// Turns a finger movement (how far it travelled across and down, in pixels) into a swipe
// direction: 'left', 'right', 'up', 'down', or null if it was not a swipe.
//
// A touch must travel at least `minDistance` pixels on its larger axis to count. Anything
// shorter is a tap, or the few pixels of jitter in a normal tap, and must not steer: without
// a minimum, a tap with no movement used to turn the Snake. The larger axis wins, and an exact
// diagonal goes vertical.
export const SWIPE_MIN_DISTANCE = 20;

export function swipeDirection(dx, dy, minDistance = SWIPE_MIN_DISTANCE) {
  // Missing or broken touch data gives NaN; that is no swipe, not a swipe "up".
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  const across = Math.abs(dx);
  const down = Math.abs(dy);
  if (Math.max(across, down) < minDistance) return null;
  if (across > down) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
