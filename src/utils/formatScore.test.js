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
});
