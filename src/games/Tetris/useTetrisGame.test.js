import { renderHook, act } from '@testing-library/react';
import useTetrisGame from './useTetrisGame';
import { randomPiece } from './pieces';

// Piece spawning is genuinely random, which would make position/rotation
// assertions flaky (the O-piece is rotation-invariant, so a "shape changed
// after rotate" check would intermittently fail if it spawned). Mocking
// randomPiece as a jest.fn() and queuing exact return values per test via
// mockReturnValueOnce — rather than a shared counter/closure — keeps every
// test's piece sequence isolated and independent of execution order, since
// jest.mock's factory only runs once for the whole file and any shared
// mutable state in it would otherwise leak unpredictably between tests.
jest.mock('./pieces', () => ({
  ...jest.requireActual('./pieces'),
  randomPiece: jest.fn(),
}));

const T_PIECE = { key: 'T', shape: [[0, 1, 0], [1, 1, 1]], color: '#bf5fff', shadow: 'rgba(191, 95, 255, 0.4)' };
const I_PIECE = { key: 'I', shape: [[1, 1, 1, 1]], color: '#00f5ff', shadow: 'rgba(0, 245, 255, 0.4)' };
const O_PIECE = { key: 'O', shape: [[1, 1], [1, 1]], color: '#ffd700', shadow: 'rgba(255, 215, 0, 0.4)' };

function queuePieces(...pieces) {
  pieces.forEach(p => randomPiece.mockReturnValueOnce({ ...p, x: 3, y: 0 }));
}

beforeEach(() => {
  randomPiece.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useTetrisGame', () => {
  test('starts in idle state with no current piece', () => {
    const { result } = renderHook(() => useTetrisGame());
    expect(result.current.gameState).toBe('idle');
    expect(result.current.current).toBeNull();
  });

  test('resetGame spawns a piece and resets score/lines/level', () => {
    queuePieces(T_PIECE, I_PIECE); // current, next
    const { result } = renderHook(() => useTetrisGame());
    act(() => result.current.resetGame());
    expect(result.current.gameState).toBe('playing');
    expect(result.current.current.key).toBe('T');
    expect(result.current.next.key).toBe('I');
    expect(result.current.score).toBe(0);
    expect(result.current.lines).toBe(0);
    expect(result.current.level).toBe(1);
  });

  test('moveLeft decreases x by exactly 1', () => {
    queuePieces(T_PIECE, I_PIECE);
    const { result } = renderHook(() => useTetrisGame());
    act(() => result.current.resetGame());
    const startX = result.current.current.x;
    act(() => result.current.moveLeft());
    expect(result.current.current.x).toBe(startX - 1);
  });

  test('moveRight increases x by exactly 1', () => {
    queuePieces(T_PIECE, I_PIECE);
    const { result } = renderHook(() => useTetrisGame());
    act(() => result.current.resetGame());
    const startX = result.current.current.x;
    act(() => result.current.moveRight());
    expect(result.current.current.x).toBe(startX + 1);
  });

  test('the piece cannot move further left than the board boundary', () => {
    queuePieces(T_PIECE, I_PIECE);
    const { result } = renderHook(() => useTetrisGame());
    act(() => result.current.resetGame());
    for (let i = 0; i < 15; i++) {
      act(() => result.current.moveLeft());
    }
    expect(result.current.current.x).toBeGreaterThanOrEqual(0);
    const stuckX = result.current.current.x;
    act(() => result.current.moveLeft());
    expect(result.current.current.x).toBe(stuckX);
  });

  test('rotate changes the T-piece shape (it is not rotation-invariant)', () => {
    queuePieces(T_PIECE, I_PIECE);
    const { result } = renderHook(() => useTetrisGame());
    act(() => result.current.resetGame());
    const startShape = result.current.current.shape;
    act(() => result.current.rotate());
    expect(result.current.current.shape).not.toEqual(startShape);
  });

  test('holdPiece pockets the current piece and promotes next on first use', () => {
    // resetGame consumes 2 (current=T, next=I); first holdPiece call with no
    // existing hold consumes a 3rd (the new next, since old next promotes to current)
    queuePieces(T_PIECE, I_PIECE, T_PIECE);
    const { result } = renderHook(() => useTetrisGame());
    act(() => result.current.resetGame());
    expect(result.current.hold).toBeNull();
    expect(result.current.canHold).toBe(true);

    act(() => result.current.holdPiece());

    expect(result.current.hold.key).toBe('T'); // original current, pocketed
    expect(result.current.current.key).toBe('I'); // promoted from next
    expect(result.current.next.key).toBe('T'); // freshly generated
    expect(result.current.canHold).toBe(false);
  });

  test('filling the bottom rows with O-pieces triggers the line-clear sequence', () => {
    jest.useFakeTimers();
    // 2 pieces for resetGame (current, next), then 2 more per spawnPiece call
    // after each of the 5 O-piece locks = 2 + 5*2 = 12 total randomPiece() calls
    queuePieces(...Array(12).fill(O_PIECE));
    const { result } = renderHook(() => useTetrisGame());
    act(() => result.current.resetGame());

    // O-piece spawns at x=3 (columns 3-4). Move each of 5 pieces into its own
    // 2-wide column pair spanning the full 10-wide board, then hard drop.
    const moves = [-3, -1, 1, 3, 5]; // relative moveLeft(-)/moveRight(+) counts from spawn x=3
    moves.forEach((count) => {
      const dir = count < 0 ? result.current.moveLeft : result.current.moveRight;
      for (let i = 0; i < Math.abs(count); i++) {
        act(() => dir());
      }
      act(() => result.current.hardDrop());
      act(() => { jest.advanceTimersByTime(30); }); // triggers the lockPiece setTimeout
    });

    // The O-piece is 2 rows tall, so completing the bottom row across all 5
    // columns completes 2 full rows at once (both rows the piece occupies),
    // not 1 — verified by a manual run before locking in this assertion.
    expect(result.current.clearingRows.length).toBeGreaterThan(0);

    act(() => { jest.advanceTimersByTime(300); }); // triggers the clear-animation setTimeout
    expect(result.current.clearingRows).toEqual([]);
    // Confirmed via a manual run that this exact placement clears 2 lines at
    // once, not 1 — asserting the precise value rather than a loose ">0" check.
    expect(result.current.lines).toBe(2);
  });

  test('holdPiece does nothing if called again before the piece locks', () => {
    queuePieces(T_PIECE, I_PIECE, T_PIECE);
    const { result } = renderHook(() => useTetrisGame());
    act(() => result.current.resetGame());
    act(() => result.current.holdPiece());
    const heldKey = result.current.hold.key;
    const currentKey = result.current.current.key;

    act(() => result.current.holdPiece()); // no-op: canHold is false

    expect(result.current.hold.key).toBe(heldKey);
    expect(result.current.current.key).toBe(currentKey);
  });
});
