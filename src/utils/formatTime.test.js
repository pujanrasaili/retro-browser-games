import { formatTime } from './formatTime';

describe('formatTime', () => {
  test('shows plain seconds under 60', () => {
    expect(formatTime(42)).toBe('42s');
  });

  test('shows 0 seconds correctly', () => {
    expect(formatTime(0)).toBe('0s');
  });

  test('shows the boundary at 59 seconds as plain seconds', () => {
    expect(formatTime(59)).toBe('59s');
  });

  test('switches to MM:SS format exactly at 60 seconds', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  test('pads single-digit seconds in MM:SS format', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  test('formats a longer multi-minute time correctly', () => {
    expect(formatTime(142)).toBe('2:22');
  });

  test('returns an em dash for undefined', () => {
    expect(formatTime(undefined)).toBe('—');
  });

  test('returns an em dash for null', () => {
    expect(formatTime(null)).toBe('—');
  });
});
