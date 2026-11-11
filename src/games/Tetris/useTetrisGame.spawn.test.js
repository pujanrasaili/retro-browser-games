import { renderHook, act } from '@testing-library/react';
import useTetrisGame from './useTetrisGame';
import { randomPiece } from './pieces';

// The NEXT panel promises which piece will appear after the current one locks. These tests
// use distinguishable pieces so they can tell whether that promise is kept.
jest.mock('./pieces', () => ({
  ...jest.requireActual('./pieces'),
  randomPiece: jest.fn(),
}));

const shapes = {
  T: [[0, 1, 0], [1, 1, 1]],
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
};
const piece = (key) => ({ key, shape: shapes[key], color: '#fff', shadow: 'x', x: 3, y: 0 });
const queue = (...keys) => keys.forEach(k => randomPiece.mockReturnValueOnce(piece(k)));

beforeEach(() => {
  randomPiece.mockReset();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

// Drops the current piece to the floor and lets it lock (the lock happens 30ms after the drop).
function dropAndLock(hook) {
  act(() => hook.result.current.hardDrop());
  act(() => { jest.advanceTimersByTime(30); });
}

describe('the NEXT preview is the piece that actually appears', () => {
  test('after a piece locks, the piece that was shown in NEXT becomes the current piece', () => {
    queue('T', 'I', 'O', 'S', 'T', 'I');
    const hook = renderHook(() => useTetrisGame());
    act(() => hook.result.current.resetGame());
    expect(hook.result.current.current.key).toBe('T');
    expect(hook.result.current.next.key).toBe('I');

    dropAndLock(hook);
    expect(hook.result.current.current.key).toBe('I'); // what NEXT was showing
    expect(hook.result.current.next.key).toBe('O');    // and a fresh piece is shown next

    dropAndLock(hook);
    expect(hook.result.current.current.key).toBe('O');
    expect(hook.result.current.next.key).toBe('S');
  });

  test('the promoted piece starts at the top of the board', () => {
    queue('T', 'I', 'O', 'S');
    const hook = renderHook(() => useTetrisGame());
    act(() => hook.result.current.resetGame());
    dropAndLock(hook);
    expect(hook.result.current.current).toMatchObject({ key: 'I', x: 3, y: 0 });
  });

  test('it also holds after a line clear', () => {
    // Five O-pieces side by side fill two rows. The sixth piece drawn is an I, so it is
    // what NEXT shows while the fifth O locks, and it must be what appears after the clear.
    queue('O', 'O', 'O', 'O', 'O', 'I', 'S', 'S', 'S');
    const hook = renderHook(() => useTetrisGame());
    act(() => hook.result.current.resetGame());
    [-3, -1, 1, 3, 5].forEach((moves) => {
      for (let i = 0; i < Math.abs(moves); i++) {
        act(() => (moves < 0 ? hook.result.current.moveLeft() : hook.result.current.moveRight()));
      }
      dropAndLock(hook);
    });
    expect(hook.result.current.clearingRows.length).toBeGreaterThan(0);
    act(() => { jest.advanceTimersByTime(300); }); // the flash ends and the next piece spawns
    expect(hook.result.current.lines).toBe(2);
    expect(hook.result.current.current.key).toBe('I');
    expect(hook.result.current.next.key).toBe('S');
  });
});
