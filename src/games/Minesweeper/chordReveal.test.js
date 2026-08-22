import { chordReveal } from '../Minesweeper/useMinesweeper';

// Helper to build a simple NxN board where every cell starts as
// unrevealed and unflagged, so individual tests only need to set
// the specific flags/reveals they care about.
function buildBoard(size) {
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ({
      r, c, mine: false, revealed: false, flagged: false, adjacent: 0,
    }))
  );
}

describe('chordReveal', () => {
  test('finds all 8 neighbors for a center cell with none flagged', () => {
    const board = buildBoard(3);
    const { flagCount, neighbors } = chordReveal(board, 1, 1, 3, 3);
    expect(flagCount).toBe(0);
    expect(neighbors).toHaveLength(8);
  });

  test('finds only 3 valid neighbors for a corner cell (bounds-limited)', () => {
    const board = buildBoard(3);
    const { flagCount, neighbors } = chordReveal(board, 0, 0, 3, 3);
    expect(flagCount).toBe(0);
    expect(neighbors).toHaveLength(3);
    // Exact neighbors of (0,0) on a 3x3 board
    expect(neighbors.sort()).toEqual(
      [[0, 1], [1, 0], [1, 1]].sort()
    );
  });

  test('counts flagged neighbors separately and excludes them from the neighbors list', () => {
    const board = buildBoard(3);
    board[0][1].flagged = true;
    board[1][0].flagged = true;
    const { flagCount, neighbors } = chordReveal(board, 0, 0, 3, 3);
    expect(flagCount).toBe(2);
    expect(neighbors).toEqual([[1, 1]]);
  });

  test('excludes already-revealed neighbors without counting them as flags', () => {
    const board = buildBoard(3);
    board[1][1].revealed = true;
    const { flagCount, neighbors } = chordReveal(board, 0, 0, 3, 3);
    expect(flagCount).toBe(0);
    // Only (0,1) and (1,0) remain — (1,1) is revealed so it's excluded entirely
    expect(neighbors).toHaveLength(2);
  });

  test('a fully flagged neighborhood returns zero neighbors to reveal', () => {
    const board = buildBoard(3);
    board[0][1].flagged = true;
    board[1][0].flagged = true;
    board[1][1].flagged = true;
    const { flagCount, neighbors } = chordReveal(board, 0, 0, 3, 3);
    expect(flagCount).toBe(3);
    expect(neighbors).toHaveLength(0);
  });
});
