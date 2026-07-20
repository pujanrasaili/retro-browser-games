// Format seconds as MM:SS for values >= 60, plain seconds otherwise.
// Used in StatsBar and Minesweeper for consistent time display.
export function formatTime(seconds) {
  if (seconds === undefined || seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
