import { swipeDirection, SWIPE_MIN_DISTANCE } from './swipeDirection';

describe('swipeDirection', () => {
  test.each([
    ['a clear swipe right', 60, 10, 'right'],
    ['a clear swipe left', -60, 10, 'left'],
    ['a clear swipe down', 5, 70, 'down'],
    ['a clear swipe up', 5, -70, 'up'],
  ])('%s', (_name, dx, dy, expected) => {
    expect(swipeDirection(dx, dy)).toBe(expected);
  });

  test.each([
    ['mostly across, a little down', 50, 20, 'right'],
    ['mostly across, a little up', -50, -20, 'left'],
    ['mostly down, a little across', 20, 50, 'down'],
    ['mostly up, a little across', -20, -50, 'up'],
  ])('on a diagonal the larger axis wins: %s', (_name, dx, dy, expected) => {
    expect(swipeDirection(dx, dy)).toBe(expected);
  });

  test('an exact diagonal goes vertical', () => {
    expect(swipeDirection(50, 50)).toBe('down');
    expect(swipeDirection(-50, 50)).toBe('down');
    expect(swipeDirection(50, -50)).toBe('up');
    expect(swipeDirection(-50, -50)).toBe('up');
  });

  test.each([
    ['no movement at all (a tap)', 0, 0],
    ['a few pixels of finger jitter', 3, -2],
    ['just under the minimum across', 19, 0],
    ['just under the minimum down', 0, 19],
    ['just under the minimum going left', -19, 5],
    ['a diagonal where neither axis reaches it', 15, 15],
  ])('%s is not a swipe', (_name, dx, dy) => {
    expect(swipeDirection(dx, dy)).toBeNull();
  });

  test('exactly the minimum distance counts', () => {
    expect(SWIPE_MIN_DISTANCE).toBe(20);
    expect(swipeDirection(20, 0)).toBe('right');
    expect(swipeDirection(-20, 0)).toBe('left');
    expect(swipeDirection(0, 20)).toBe('down');
    expect(swipeDirection(0, -20)).toBe('up');
  });

  test('only the larger axis has to reach the minimum', () => {
    // 25 across with 3 down is a swipe right; the small movement down does not cancel it
    expect(swipeDirection(25, 3)).toBe('right');
  });

  test('accepts a different minimum distance', () => {
    expect(swipeDirection(10, 0, 5)).toBe('right');
    expect(swipeDirection(4, 0, 5)).toBeNull();
    expect(swipeDirection(60, 0, 100)).toBeNull();
  });

  test.each([
    ['NaN across', NaN, 50],
    ['NaN down', 50, NaN],
    ['undefined across', undefined, 50],
    ['Infinity down', 0, Infinity],
  ])('broken touch data (%s) is not a swipe', (_name, dx, dy) => {
    expect(swipeDirection(dx, dy)).toBeNull();
  });
});
