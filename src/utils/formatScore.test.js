import { formatScore } from './formatScore';

describe('formatScore', () => {
  test('pads a normal score to the default 6 digits', () => {
    expect(formatScore(500)).toBe('000500');
  });

  test('respects a custom digit width', () => {
    expect(formatScore(500, 5)).toBe('00500');
  });

  test('shows all zeros for a score of 0', () => {
    expect(formatScore(0)).toBe('000000');
  });

  test('shows the max digit-width value without abbreviating at the boundary', () => {
    expect(formatScore(999999)).toBe('999999');
  });

  test('switches to millions format just above the digit-width boundary', () => {
    // 1,000,000 is NOT <= 999999, so it should already be in millions format
    expect(formatScore(1000000)).toBe('1.0M');
  });

  test('shows one decimal place under 10 million', () => {
    expect(formatScore(1500000)).toBe('1.5M');
  });

  test('shows a whole number at or above 10 million', () => {
    expect(formatScore(25000000)).toBe('25M');
  });

  // Snake shows scores at 5 digits, so 100000 to 999999 are wider than the display but
  // still below a million: they are shown whole, not padded and not abbreviated.
  test('a score wider than the digit width but under a million is shown as it is', () => {
    expect(formatScore(99999, 5)).toBe('99999');       // fits exactly: padded form
    expect(formatScore(100000, 5)).toBe('100000');     // one too wide: shown whole
    expect(formatScore(123456, 5)).toBe('123456');
    expect(formatScore(999999, 5)).toBe('999999');
    expect(formatScore(1000000, 5)).toBe('1.0M');      // a million switches to millions
  });

  test.each([
    ['NaN (a corrupted saved value)', NaN],
    ['undefined', undefined],
    ['null', null],
    ['a negative number', -5],
    ['Infinity', Infinity],
  ])('shows %s as zero, never NaN or garbage', (_name, value) => {
    expect(formatScore(value)).toBe('000000');
    expect(formatScore(value, 5)).toBe('00000');
  });
});
