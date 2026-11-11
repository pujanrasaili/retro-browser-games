import { renderHook, act } from '@testing-library/react';
import useTetrisGame from './useTetrisGame';
import { randomPiece } from './pieces';

// Rules of Tetris that had no tests: gravity, the line-clear flash, TETRIS, levelling up, the
// hold swap and wall kicks. Pieces are scripted so every scenario is exact. The board is 10 wide
// and 20 tall, a game starts at 800ms per row, and clearing lines scores 100/300/500/800 times
// the level.
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
const always = (key) => randomPiece.mockImplementation(() => piece(key));
const queueFirst = (...keys) => keys.forEach(k => randomPiece.mockReturnValueOnce(piece(k)));

beforeEach(() => {
  randomPiece.mockReset();
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  localStorage.clear();
});

const advance = (ms) => act(() => { jest.advanceTimersByTime(ms); });
const moveTo = (hook, x) => {
  const dx = x - hook.result.current.current.x;
  for (let i = 0; i < Math.abs(dx); i++) {
    act(() => (dx < 0 ? hook.result.current.moveLeft() : hook.result.current.moveRight()));
  }
};
const dropAndLock = (hook) => {
  act(() => hook.result.current.hardDrop());
  advance(30); // the lock happens 30ms after the drop
};
const startGame = () => {
  const hook = renderHook(() => useTetrisGame());
  act(() => hook.result.current.resetGame());
  return hook;
};
// Five O-pieces side by side fill two whole rows.
const fillTwoRows = (hook) => [0, 2, 4, 6, 8].forEach((x) => { moveTo(hook, x); dropAndLock(hook); });
// Ten I-pieces stood on end, one per column, fill four whole rows.
const fillFourRows = (hook) => {
  for (let column = 0; column < 10; column++) {
    act(() => hook.result.current.rotate());
    moveTo(hook, column);
    dropAndLock(hook);
  }
};

describe('gravity', () => {
  test('the piece falls one row every 800ms and locks when it reaches the floor', () => {
    queueFirst('T');
    always('I');
    const hook = startGame();
    for (let row = 1; row <= 18; row++) {
      advance(800);
      expect(hook.result.current.current.y).toBe(row);
    }
    // A T-piece is 2 rows tall, so y = 18 is the floor: the next tick locks it
    advance(800);
    const bottom = hook.result.current.board[19];
    expect([bottom[3], bottom[4], bottom[5]].every(cell => cell !== null)).toBe(true);
    expect(hook.result.current.current).toMatchObject({ key: 'I', y: 0 }); // the next piece appears
    expect(hook.result.current.score).toBe(0); // gravity scores nothing (only a soft drop does)
  });

  test('does not run while the game has not started', () => {
    always('I');
    const hook = renderHook(() => useTetrisGame());
    advance(5000);
    expect(hook.result.current.current).toBeNull();
    expect(hook.result.current.gameState).toBe('idle');
  });

  test('pauses during the line-clear flash instead of locking the piece a second time', () => {
    // Timeline (fake clock): four pieces are placed by t=120; the fifth locks at t=730, which
    // starts a 300ms flash until t=1030. Gravity ticks at t=800, inside the flash, and must do
    // nothing: without the pause it would lock the same piece again and clear its rows twice.
    always('O');
    const hook = startGame();
    [0, 2, 4, 6].forEach((x) => { moveTo(hook, x); dropAndLock(hook); });
    advance(580);                                  // t = 700, just before the first tick
    moveTo(hook, 8);
    dropAndLock(hook);                             // t = 730: the flash begins
    expect(hook.result.current.clearingRows.length).toBeGreaterThan(0);
    const scoreBeforeClear = hook.result.current.score;
    advance(100);                                  // t = 830: the t = 800 tick happened inside the flash
    advance(200);                                  // t = 1030: the flash ends
    expect(hook.result.current.clearingRows).toEqual([]);
    expect(hook.result.current.lines).toBe(2);     // cleared once, not twice
    expect(hook.result.current.score - scoreBeforeClear).toBe(300);
  });
});

describe('clearing lines', () => {
  test('two lines at once score 300 and are not a TETRIS', () => {
    always('O');
    const hook = startGame();
    fillTwoRows(hook);
    const before = hook.result.current.score;
    advance(300);
    expect(hook.result.current.lines).toBe(2);
    expect(hook.result.current.score - before).toBe(300);
    expect(hook.result.current.tetrisCallout).toBe(false);
  });

  test('four lines at once is a TETRIS: 800 points and a callout that fades after 900ms', () => {
    always('I');
    const hook = startGame();
    fillFourRows(hook);
    expect(hook.result.current.clearingRows).toHaveLength(4);
    const before = hook.result.current.score;
    advance(300);
    expect(hook.result.current.lines).toBe(4);
    expect(hook.result.current.score - before).toBe(800);
    expect(hook.result.current.tetrisCallout).toBe(true);
    advance(899);
    expect(hook.result.current.tetrisCallout).toBe(true);
    advance(1);
    expect(hook.result.current.tetrisCallout).toBe(false);
  });

  test('the cleared rows disappear and the board is empty again', () => {
    always('I');
    const hook = startGame();
    fillFourRows(hook);
    advance(300);
    expect(hook.result.current.board.flat().every(cell => cell === null)).toBe(true);
  });
});

describe('levelling up', () => {
  test('ten cleared lines reach level 2, flash the level-up for 500ms, and speed the game up to 730ms', () => {
    always('O');
    const hook = startGame();
    for (let round = 1; round <= 5; round++) {   // each round clears 2 lines
      fillTwoRows(hook);
      advance(300);
      expect(hook.result.current.lines).toBe(round * 2);
      expect(hook.result.current.level).toBe(round < 5 ? 1 : 2);
    }
    // Time zero is the end of the fifth flash: the new 730ms timer starts here, and so does
    // the 500ms level-up flash. Measure everything from this moment.
    const y = hook.result.current.current.y;
    expect(hook.result.current.justLeveledUp).toBe(true);
    advance(499);                                       // 499ms
    expect(hook.result.current.justLeveledUp).toBe(true);
    advance(1);                                         // 500ms: the level-up flash ends
    expect(hook.result.current.justLeveledUp).toBe(false);

    // The piece should now fall every 730ms (800 - 70): not yet at 729ms, then at 730ms
    advance(229);                                       // 729ms
    expect(hook.result.current.current.y).toBe(y);
    advance(1);                                         // 730ms
    expect(hook.result.current.current.y).toBe(y + 1);
  });

  test('the best line count is saved', () => {
    always('O');
    const hook = startGame();
    fillTwoRows(hook);
    advance(300);
    expect(localStorage.getItem('tetris_best_lines')).toBe('2');
    expect(hook.result.current.bestLines).toBe(2);
  });
});

describe('swapping the held piece', () => {
  test('holding again after a piece locks swaps the held piece back in', () => {
    queueFirst('T', 'I', 'O', 'S', 'T', 'I', 'O');
    const hook = startGame();                         // current T, next I
    act(() => hook.result.current.holdPiece());       // hold T; I comes in; O is the new next
    expect(hook.result.current.hold.key).toBe('T');
    expect(hook.result.current.current.key).toBe('I');
    dropAndLock(hook);                                // I locks; the old next (O) becomes current
    expect(hook.result.current.current.key).toBe('O');
    expect(hook.result.current.canHold).toBe(true);   // a new piece may be held again

    act(() => hook.result.current.holdPiece());       // swap: O goes into hold, T comes out
    expect(hook.result.current.hold.key).toBe('O');
    expect(hook.result.current.current).toMatchObject({ key: 'T', x: 3, y: 0 });
    expect(hook.result.current.next.key).toBe('S');   // the preview is untouched by a swap
    expect(hook.result.current.canHold).toBe(false);
  });
});

describe('rotating next to a wall', () => {
  // A vertical I at column 7 turns into a horizontal bar covering columns 7-10: off the board.
  // The game nudges it one column left (to 6) so it fits. At column 9 there is no room at all.
  const rotateWith = {
    'the on-screen rotate button': (hook) => act(() => hook.result.current.rotate()),
    'the keyboard (ArrowUp)': () => act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    }),
  };

  describe.each(Object.keys(rotateWith))('using %s', (name) => {
    const turn = rotateWith[name];

    test('a rotation that would hang off the right wall is nudged one column left', () => {
      always('I');
      const hook = startGame();
      act(() => hook.result.current.rotate());       // stand it up
      moveTo(hook, 7);
      expect(hook.result.current.current.shape).toEqual([[1], [1], [1], [1]]);
      turn(hook);
      expect(hook.result.current.current.shape).toEqual([[1, 1, 1, 1]]);
      expect(hook.result.current.current.x).toBe(6);
    });

    // Column 8 matters most: a nudge to 7 would still hang off the board, so the piece must
    // stay put. (A check that looked two columns left instead of one would wrongly allow it.)
    test.each([8, 9])('a rotation with no room even after a nudge, at column %i, does nothing', (column) => {
      always('I');
      const hook = startGame();
      act(() => hook.result.current.rotate());
      moveTo(hook, column);
      turn(hook);
      expect(hook.result.current.current.shape).toEqual([[1], [1], [1], [1]]);
      expect(hook.result.current.current.x).toBe(column);
    });

    test('a rotation with plenty of room turns in place', () => {
      always('I');
      const hook = startGame();
      act(() => hook.result.current.rotate());
      moveTo(hook, 4);
      turn(hook);
      expect(hook.result.current.current.shape).toEqual([[1, 1, 1, 1]]);
      expect(hook.result.current.current.x).toBe(4);
    });
  });
});
