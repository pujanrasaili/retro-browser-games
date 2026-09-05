import { renderHook, act } from '@testing-library/react';
import useSnakeGame, { DIFFICULTIES } from './useSnakeGame';

// Web Audio API doesn't exist in jsdom, so sound.js's own guard clause
// (window.AudioContext is undefined -> getCtx() returns null -> playTone
// early-returns) makes all sounds.*() calls safe no-ops here. No mocking
// needed for that specific concern.

afterEach(() => {
  localStorage.clear();
  jest.useRealTimers();
});

describe('useSnakeGame', () => {
  test('starts in idle state with no snake on the board', () => {
    const { result } = renderHook(() => useSnakeGame());
    expect(result.current.gameState).toBe('idle');
    expect(result.current.snake).toEqual([]);
  });

  test('defaults to medium difficulty and wrap mode when nothing is persisted', () => {
    const { result } = renderHook(() => useSnakeGame());
    expect(result.current.difficulty).toBe('medium');
    expect(result.current.walls).toBe(false);
  });

  test('initializes difficulty and walls from localStorage when present', () => {
    localStorage.setItem('snake_difficulty', 'hard');
    localStorage.setItem('snake_walls', 'true');
    const { result } = renderHook(() => useSnakeGame());
    expect(result.current.difficulty).toBe('hard');
    expect(result.current.walls).toBe(true);
  });

  test('resetGame places the snake at its starting position and speed', () => {
    const { result } = renderHook(() => useSnakeGame());
    act(() => result.current.resetGame());
    expect(result.current.gameState).toBe('playing');
    expect(result.current.snake).toEqual([
      { x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 },
    ]);
    expect(result.current.speed).toBe(DIFFICULTIES.medium.speed);
  });

  test('setDirection updates the direction for a valid (non-reversing) turn', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSnakeGame());
    act(() => result.current.resetGame());
    act(() => result.current.setDirection({ x: 0, y: -1 })); // turn up, valid from moving right
    act(() => { jest.advanceTimersByTime(result.current.speed); });
    expect(result.current.snake[0]).toEqual({ x: 10, y: 9 });
  });

  test('setDirection ignores an attempted 180-degree reversal', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSnakeGame());
    act(() => result.current.resetGame()); // starts moving right ({x:1,y:0})
    act(() => result.current.setDirection({ x: -1, y: 0 })); // illegal: exact reverse
    act(() => { jest.advanceTimersByTime(result.current.speed); });
    // Head should still have moved right (11,10), not left, since the
    // reversal attempt should have been ignored
    expect(result.current.snake[0]).toEqual({ x: 11, y: 10 });
  });

  test('moving the snake one tick advances the head in the current direction', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSnakeGame());
    act(() => result.current.resetGame());
    act(() => { jest.advanceTimersByTime(result.current.speed); });
    // Starting head (10,10) moving right -> (11,10), regardless of whether
    // food happened to be eaten this tick (that would only affect tail length)
    expect(result.current.snake[0]).toEqual({ x: 11, y: 10 });
  });
});
