import { renderHook, act } from '@testing-library/react';
import useMinesweeper from './useMinesweeper';
import { createBoard } from './mineUtils';
import { buildFixtureBoard } from './testFixtures';

// createBoard is random, so swap it for a fixed layout (see testFixtures.js).
// Everything else (floodReveal, checkProgress, the timer) is the real code.
jest.mock('./mineUtils', () => ({
  ...jest.requireActual('./mineUtils'),
  createBoard: jest.fn(),
}));

beforeEach(() => {
  createBoard.mockReset();
  createBoard.mockImplementation(() => buildFixtureBoard());
  jest.useFakeTimers();
});

afterEach(() => {
  localStorage.clear();
  jest.useRealTimers();
});

// Reveals one numbered cell (which opens only itself), lets 5 seconds pass, then
// clicks the zero region, which floods every remaining safe cell and wins.
function playToWin(result) {
  act(() => result.current.handleReveal(4, 7));
  act(() => { jest.advanceTimersByTime(5000); });
  act(() => result.current.handleReveal(4, 0));
}

describe('useMinesweeper win and lose', () => {
  test('the first click builds the board with the click position', () => {
    const { result } = renderHook(() => useMinesweeper());
    act(() => result.current.handleReveal(4, 7));
    expect(createBoard).toHaveBeenCalledWith(9, 9, 10, 4, 7);
  });

  test('revealing one numbered cell starts the game without winning it', () => {
    const { result } = renderHook(() => useMinesweeper());
    act(() => result.current.handleReveal(4, 7));
    expect(result.current.gameState).toBe('playing');
    expect(result.current.board[4][7].revealed).toBe(true);
    expect(result.current.board[4][6].revealed).toBe(false); // nothing cascaded
  });

  test('revealing every safe cell wins the game', () => {
    const { result } = renderHook(() => useMinesweeper());
    playToWin(result);
    expect(result.current.gameState).toBe('won');
    // exactly the 10 mines are left unrevealed
    const unrevealed = result.current.board.flat().filter(cell => !cell.revealed);
    expect(unrevealed).toHaveLength(10);
    expect(unrevealed.every(cell => cell.mine)).toBe(true);
  });

  test('the timer stops once the game is won', () => {
    const { result } = renderHook(() => useMinesweeper());
    playToWin(result);
    expect(result.current.time).toBe(5);
    act(() => { jest.advanceTimersByTime(10000); });
    expect(result.current.time).toBe(5);
  });

  test('a win saves the time as the best for that difficulty', () => {
    const { result } = renderHook(() => useMinesweeper());
    playToWin(result);
    expect(result.current.bestTimes.easy).toBe(5);
    expect(JSON.parse(localStorage.getItem('mine_best'))).toEqual({ easy: 5 });
  });

  test('a slower win does not overwrite a faster saved best', () => {
    localStorage.setItem('mine_best', JSON.stringify({ easy: 3 }));
    const { result } = renderHook(() => useMinesweeper());
    playToWin(result); // 5 seconds, slower than the saved 3
    expect(result.current.gameState).toBe('won');
    expect(JSON.parse(localStorage.getItem('mine_best'))).toEqual({ easy: 3 });
  });

  test('a faster win replaces a slower saved best', () => {
    localStorage.setItem('mine_best', JSON.stringify({ easy: 10 }));
    const { result } = renderHook(() => useMinesweeper());
    playToWin(result); // 5 seconds, faster than the saved 10
    expect(JSON.parse(localStorage.getItem('mine_best'))).toEqual({ easy: 5 });
  });

  test('revealing a mine loses the game, marks it exploded and shows every mine', () => {
    const { result } = renderHook(() => useMinesweeper());
    act(() => result.current.handleReveal(4, 7));
    act(() => result.current.handleReveal(4, 8)); // a mine
    expect(result.current.gameState).toBe('lost');
    expect(result.current.board[4][8].exploded).toBe(true);
    expect(result.current.board[0][8].revealed).toBe(true); // other mines exposed
    expect(result.current.board[4][0].revealed).toBe(false); // safe cells untouched
  });

  test('a lost game saves no best time', () => {
    const { result } = renderHook(() => useMinesweeper());
    act(() => result.current.handleReveal(4, 7));
    act(() => result.current.handleReveal(4, 8));
    expect(localStorage.getItem('mine_best')).toBeNull();
  });

  test('clicks are ignored once the game is over', () => {
    const { result } = renderHook(() => useMinesweeper());
    act(() => result.current.handleReveal(4, 7));
    act(() => result.current.handleReveal(4, 8)); // lose
    act(() => result.current.handleReveal(4, 0));
    expect(result.current.board[4][0].revealed).toBe(false);
  });
});
