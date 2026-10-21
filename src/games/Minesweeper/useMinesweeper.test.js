import React from 'react';
import { renderHook, act } from '@testing-library/react';
import useMinesweeper from './useMinesweeper';

// Deliberately NOT mocking createBoard here, unlike the Tetris piece mocking
// approach. createBoard's mine layout interacts with DIFFICULTIES-driven
// calculations elsewhere in the hook (checkProgress reads DIFFICULTIES[diff]
// directly) — a hand-built fixture board would need to exactly match a real
// difficulty's dimensions and mine count to avoid producing nonsensical
// progress/win calculations, which is more fragile than just accepting the
// real randomness and asserting on invariants that must hold regardless of
// layout (same approach already used for testing createBoard in isolation).

afterEach(() => {
  localStorage.clear();
  jest.useRealTimers();
});

describe('useMinesweeper', () => {
  test('starts idle with mine count matching the default easy difficulty', () => {
    const { result } = renderHook(() => useMinesweeper());
    expect(result.current.gameState).toBe('idle');
    expect(result.current.difficulty).toBe('easy');
    expect(result.current.minesLeft).toBe(10);
  });

  test('initializes difficulty from localStorage when present', () => {
    localStorage.setItem('mine_difficulty', 'hard');
    const { result } = renderHook(() => useMinesweeper());
    expect(result.current.difficulty).toBe('hard');
    expect(result.current.minesLeft).toBe(99);
  });

  test('resetGame switches difficulty and updates minesLeft accordingly', () => {
    const { result } = renderHook(() => useMinesweeper());
    act(() => result.current.resetGame('medium'));
    expect(result.current.difficulty).toBe('medium');
    expect(result.current.minesLeft).toBe(40);
    expect(result.current.gameState).toBe('idle'); // resetGame doesn't auto-start play
  });

  test('handleFlag is a no-op before the first reveal (board does not exist yet)', () => {
    const { result } = renderHook(() => useMinesweeper());
    const startMinesLeft = result.current.minesLeft;
    act(() => result.current.handleFlag({ preventDefault: () => {} }, 0, 0));
    expect(result.current.minesLeft).toBe(startMinesLeft);
    expect(result.current.board).toBeNull();
  });

  test('first click always reveals a safe cell and transitions to playing (first-click safety)', () => {
    // Run many trials since mine placement is genuinely random — first-click
    // safety is guaranteed by createBoard avoiding the clicked cell's 3x3
    // area, but this exercises that guarantee through the full hook, not
    // just the isolated createBoard function already tested elsewhere.
    for (let i = 0; i < 20; i++) {
      const { result } = renderHook(() => useMinesweeper());
      act(() => result.current.handleReveal(4, 4));
      expect(result.current.gameState).toBe('playing');
      expect(result.current.board[4][4].mine).toBe(false);
      expect(result.current.board[4][4].revealed).toBe(true);
    }
  });

  test('flagging an unrevealed cell after the board exists decrements minesLeft', () => {
    const { result } = renderHook(() => useMinesweeper());
    act(() => result.current.handleReveal(4, 4)); // creates the board
    const before = result.current.minesLeft;
    // Don't assume any specific cell is unrevealed — flood-fill from the
    // first click can span a large area depending on random mine placement,
    // so find a genuinely unrevealed cell from the actual board state first
    // rather than guessing a "far away" position might be safe.
    const board = result.current.board;
    let targetR = -1, targetC = -1;
    outer: for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        if (!board[r][c].revealed) { targetR = r; targetC = c; break outer; }
      }
    }
    expect(targetR).toBeGreaterThanOrEqual(0); // sanity check a candidate exists
    act(() => result.current.handleFlag({ preventDefault: () => {} }, targetR, targetC));
    expect(result.current.minesLeft).toBe(before - 1);
  });

  test('flagging the same cell twice toggles the flag back off', () => {
    const { result } = renderHook(() => useMinesweeper());
    act(() => result.current.handleReveal(4, 4));
    const before = result.current.minesLeft;
    const board = result.current.board;
    let targetR = -1, targetC = -1;
    outer: for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        if (!board[r][c].revealed) { targetR = r; targetC = c; break outer; }
      }
    }
    const preventDefault = () => {};
    act(() => result.current.handleFlag({ preventDefault }, targetR, targetC));
    act(() => result.current.handleFlag({ preventDefault }, targetR, targetC));
    expect(result.current.minesLeft).toBe(before);
  });
});

// React.StrictMode (used by src/index.js) runs state updater functions twice in
// development. Snake and Pong each had side effects inside updaters that doubled
// their results under `npm start`. Minesweeper's flag counter and timer should
// behave identically with and without StrictMode; this guards against a change
// ever introducing the same problem here.
describe.each([
  ['plain', undefined],
  ['StrictMode', React.StrictMode],
])('flags and timer (%s)', (_name, wrapper) => {
  test('a net of one flag lowers the mine counter by exactly 1, and 3 seconds is 3', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useMinesweeper(), wrapper ? { wrapper } : undefined);
    const preventDefault = () => {};
    act(() => result.current.handleReveal(4, 4));
    // Pick genuinely unrevealed cells from the real board rather than assuming
    // fixed positions are safe from the first click's flood fill.
    const unrevealed = [];
    result.current.board.forEach((row, r) => row.forEach((cell, c) => {
      if (!cell.revealed) unrevealed.push([r, c]);
    }));
    const startMines = result.current.minesLeft;

    act(() => result.current.handleFlag({ preventDefault }, ...unrevealed[0]));
    act(() => result.current.handleFlag({ preventDefault }, ...unrevealed[1]));
    act(() => result.current.handleFlag({ preventDefault }, ...unrevealed[1])); // unflag
    act(() => { jest.advanceTimersByTime(3000); });

    expect(result.current.minesLeft).toBe(startMines - 1);
    expect(result.current.time).toBe(3);
  });
});
