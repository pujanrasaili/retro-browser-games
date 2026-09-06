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
