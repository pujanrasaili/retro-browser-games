import { renderHook, act } from '@testing-library/react';
import useMinesweeper, { useChord } from './useMinesweeper';
import { createBoard } from './mineUtils';
import { buildFixtureBoard } from './testFixtures';

jest.mock('./mineUtils', () => ({
  ...jest.requireActual('./mineUtils'),
  createBoard: jest.fn(),
}));

beforeEach(() => {
  createBoard.mockReset();
  jest.useFakeTimers();
});

afterEach(() => {
  localStorage.clear();
  jest.useRealTimers();
});

// useChord decides whether a double-click is a valid chord and, if so, hands the
// cells to reveal to handleChordReveal. Despite the name it uses no React hooks, so
// it can be called directly with a stub handler to see exactly what it passes on.
describe('useChord (when does a double-click count?)', () => {
  // Two mines at (0,0) and (1,1). Cell (0,1) touches both, so its number is 2.
  function chordBoard({ flags = [], revealed = [[0, 1]] } = {}) {
    const board = buildFixtureBoard([[0, 0], [1, 1]]);
    flags.forEach(([r, c]) => { board[r][c].flagged = true; });
    revealed.forEach(([r, c]) => { board[r][c].revealed = true; });
    return board;
  }

  test('passes the unflagged, unrevealed neighbors when flags match the number', () => {
    const handler = jest.fn();
    const board = chordBoard({ flags: [[0, 0], [1, 1]] });
    useChord(board, 'playing', 9, 9, handler)(0, 1);
    expect(handler).toHaveBeenCalledWith([[0, 2], [1, 0], [1, 2]]);
  });

  test('does nothing with too few flags', () => {
    const handler = jest.fn();
    useChord(chordBoard({ flags: [[0, 0]] }), 'playing', 9, 9, handler)(0, 1);
    expect(handler).not.toHaveBeenCalled();
  });

  test('does nothing with too many flags', () => {
    const handler = jest.fn();
    const board = chordBoard({ flags: [[0, 0], [1, 1], [1, 0]] });
    useChord(board, 'playing', 9, 9, handler)(0, 1);
    expect(handler).not.toHaveBeenCalled();
  });

  test('does nothing on a cell that has not been revealed', () => {
    const handler = jest.fn();
    const board = chordBoard({ flags: [[0, 0], [1, 1]], revealed: [] });
    useChord(board, 'playing', 9, 9, handler)(0, 1);
    expect(handler).not.toHaveBeenCalled();
  });

  test('does nothing on a revealed cell whose number is 0', () => {
    const handler = jest.fn();
    const board = chordBoard({ revealed: [[8, 8]] }); // far from both mines: 0
    useChord(board, 'playing', 9, 9, handler)(8, 8);
    expect(handler).not.toHaveBeenCalled();
  });

  test('does nothing unless the game is being played', () => {
    const handler = jest.fn();
    const board = chordBoard({ flags: [[0, 0], [1, 1]] });
    ['idle', 'won', 'lost'].forEach((state) => {
      useChord(board, state, 9, 9, handler)(0, 1);
    });
    expect(handler).not.toHaveBeenCalled();
  });

  test('does nothing before a board exists', () => {
    const handler = jest.fn();
    useChord(null, 'playing', 9, 9, handler)(0, 1);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('handleChordReveal (through the hook)', () => {
  const noDefault = { preventDefault() {} };

  function chordWith(hook, r, c) {
    const h = hook.result.current;
    act(() => useChord(h.board, h.gameState, h.rows, h.cols, h.handleChordReveal)(r, c));
  }
  function flag(hook, r, c) {
    act(() => hook.result.current.handleFlag(noDefault, r, c));
  }

  // Layout with two mines where no revealed neighbor cascades, so a chord opens
  // exactly the cells it names and nothing else.
  function twoMineGame() {
    createBoard.mockImplementation(() => buildFixtureBoard([[0, 0], [1, 1]]));
    const hook = renderHook(() => useMinesweeper());
    act(() => hook.result.current.handleReveal(0, 1)); // a 2: opens only itself
    return hook;
  }

  test('a correct chord reveals exactly the unflagged neighbors', () => {
    const hook = twoMineGame();
    flag(hook, 0, 0);
    flag(hook, 1, 1);
    chordWith(hook, 0, 1);
    const { board, gameState } = hook.result.current;
    expect([board[0][2], board[1][0], board[1][2]].every(cell => cell.revealed)).toBe(true);
    expect(board[2][2].revealed).toBe(false); // nothing beyond the neighbors
    expect(gameState).toBe('playing');
  });

  test('a chord with too few flags reveals nothing', () => {
    const hook = twoMineGame();
    flag(hook, 0, 0);
    chordWith(hook, 0, 1);
    expect(hook.result.current.board[0][2].revealed).toBe(false);
  });

  test('a chord around a wrong flag steps on a mine and loses', () => {
    const hook = twoMineGame();
    flag(hook, 0, 0); // right
    flag(hook, 1, 0); // wrong: a safe cell, so the real mine at (1,1) is unflagged
    chordWith(hook, 0, 1);
    const { board, gameState } = hook.result.current;
    expect(gameState).toBe('lost');
    expect(board[1][1].exploded).toBe(true);
    expect(board[1][2].revealed).toBe(false); // the chord stopped at the mine
  });

  // Default fixture: a wall of mines down the right edge. (4,7) touches three of
  // them, and revealing its neighbors cascades through the whole board.
  function wallGame() {
    createBoard.mockImplementation(() => buildFixtureBoard());
    const hook = renderHook(() => useMinesweeper());
    act(() => hook.result.current.handleReveal(4, 7));
    act(() => { jest.advanceTimersByTime(4000); });
    flag(hook, 3, 8);
    flag(hook, 4, 8);
    flag(hook, 5, 8);
    return hook;
  }

  test('a chord that clears the last safe cells wins and saves the time', () => {
    const hook = wallGame();
    chordWith(hook, 4, 7);
    expect(hook.result.current.gameState).toBe('won');
    expect(JSON.parse(localStorage.getItem('mine_best'))).toEqual({ easy: 4 });
  });

  test('a slower chord win does not overwrite a faster saved best', () => {
    localStorage.setItem('mine_best', JSON.stringify({ easy: 2 }));
    const hook = wallGame();
    chordWith(hook, 4, 7); // 4 seconds, slower than the saved 2
    expect(hook.result.current.gameState).toBe('won');
    expect(JSON.parse(localStorage.getItem('mine_best'))).toEqual({ easy: 2 });
  });

  test('a faster chord win replaces a slower saved best', () => {
    localStorage.setItem('mine_best', JSON.stringify({ easy: 10 }));
    const hook = wallGame();
    chordWith(hook, 4, 7); // 4 seconds, faster than the saved 10
    expect(JSON.parse(localStorage.getItem('mine_best'))).toEqual({ easy: 4 });
  });

  test('handleChordReveal does nothing once the game is lost', () => {
    const hook = twoMineGame();
    act(() => hook.result.current.handleReveal(1, 1)); // step on a mine directly
    expect(hook.result.current.gameState).toBe('lost');
    act(() => hook.result.current.handleChordReveal([[2, 2]]));
    expect(hook.result.current.board[2][2].revealed).toBe(false);
  });
});
