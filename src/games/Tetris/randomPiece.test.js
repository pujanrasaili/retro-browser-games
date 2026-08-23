import { randomPiece, PIECES, PIECE_KEYS } from './pieces';

describe('randomPiece', () => {
  test('always returns a piece with a valid key from PIECE_KEYS', () => {
    for (let i = 0; i < 50; i++) {
      const piece = randomPiece();
      expect(PIECE_KEYS).toContain(piece.key);
    }
  });

  test('spawns at the fixed starting position (x=3, y=0)', () => {
    const piece = randomPiece();
    expect(piece.x).toBe(3);
    expect(piece.y).toBe(0);
  });

  test('includes the correct shape and color matching its key', () => {
    const piece = randomPiece();
    expect(piece.shape).toEqual(PIECES[piece.key].shape);
    expect(piece.color).toBe(PIECES[piece.key].color);
  });

  test('is capable of producing all 7 piece types over many calls', () => {
    const seen = new Set();
    for (let i = 0; i < 500; i++) {
      seen.add(randomPiece().key);
    }
    expect(seen.size).toBe(PIECE_KEYS.length);
  });

  test('distributes roughly evenly across all 7 pieces over a large sample', () => {
    // With 7000 calls, expected ~1000 per piece. Using a generous ±300 tolerance
    // (well beyond statistical noise) to avoid flakiness while still catching a
    // genuinely broken random function (e.g. one that skips a piece or heavily
    // favors another).
    const counts = {};
    PIECE_KEYS.forEach(k => { counts[k] = 0; });
    for (let i = 0; i < 7000; i++) {
      counts[randomPiece().key]++;
    }
    PIECE_KEYS.forEach(key => {
      expect(counts[key]).toBeGreaterThan(700);
      expect(counts[key]).toBeLessThan(1300);
    });
  });
});
