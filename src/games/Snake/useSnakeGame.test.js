import React from 'react';
import { renderHook, act } from '@testing-library/react';
import useSnakeGame, { DIFFICULTIES } from './useSnakeGame';

// Web Audio API doesn't exist in jsdom, so sound.js's own guard clause
// (window.AudioContext is undefined -> getCtx() returns null -> playTone
// early-returns) makes all sounds.*() calls safe no-ops here. No mocking
// needed for that specific concern.

afterEach(() => {
  localStorage.clear();
  jest.useRealTimers();
  jest.restoreAllMocks();
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

// Regression: src/index.js wraps the app in React.StrictMode, which runs state
// updater functions twice in development. The eat logic used to nest setScore /
// setSpeed / localStorage writes inside setSnake and setFood updaters, so under
// `npm start` eating ONE food gave +20 points, did not grow the snake, and
// dropped speed twice as far. Both modes must produce the same correct result.
describe.each([
  ['plain', undefined],
  ['StrictMode', React.StrictMode],
])('eating one food (%s)', (_name, wrapper) => {
  test('scores 10, grows the snake by 1, speeds up by one step, and saves the best', () => {
    jest.useFakeTimers();
    // The first two Math.random() calls place the food at (11,10), directly in
    // the snake's path; later calls (the replacement food) land far away.
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.55).mockReturnValueOnce(0.5).mockReturnValue(0.05);
    const { result } = renderHook(() => useSnakeGame(), wrapper ? { wrapper } : undefined);
    act(() => result.current.resetGame());
    const startSpeed = result.current.speed;
    expect(result.current.snake).toHaveLength(3);

    act(() => { jest.advanceTimersByTime(startSpeed); });

    expect(result.current.snake[0]).toEqual({ x: 11, y: 10 });
    expect(result.current.score).toBe(10);
    expect(result.current.snake).toHaveLength(4);
    expect(result.current.speed).toBe(startSpeed - DIFFICULTIES.medium.speedDec);
    expect(localStorage.getItem('snake_best')).toBe('10');
  });
});

// Regression: the eat logic once called setDifficulty with a *function*, and the
// persisting wrapper stored that function's source text under snake_difficulty.
// On the next page load the saved "difficulty" was garbage, DIFFICULTIES[...] was
// undefined, and the Snake screen (the app's default tab) crashed on render.
describe('persisted difficulty safety', () => {
  test('eating food never rewrites the saved difficulty', () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.55).mockReturnValueOnce(0.5).mockReturnValue(0.05);
    localStorage.setItem('snake_difficulty', 'hard');
    const { result } = renderHook(() => useSnakeGame());
    act(() => result.current.resetGame());
    act(() => { jest.advanceTimersByTime(result.current.speed); });
    expect(result.current.score).toBe(10); // the food really was eaten
    expect(localStorage.getItem('snake_difficulty')).toBe('hard');
    expect(result.current.difficulty).toBe('hard');
  });

  test('an unrecognised saved difficulty falls back to medium', () => {
    localStorage.setItem('snake_difficulty', 'diff => {\n  return diff;\n}');
    const { result } = renderHook(() => useSnakeGame());
    expect(result.current.difficulty).toBe('medium');
  });

  test('setDifficulty ignores values that are not real difficulties', () => {
    const { result } = renderHook(() => useSnakeGame());
    act(() => result.current.setDifficulty('banana'));
    act(() => result.current.setDifficulty(() => 'hard'));
    expect(result.current.difficulty).toBe('medium');
    expect(localStorage.getItem('snake_difficulty')).toBeNull();
  });
});

// The keydown listener is the real way players steer and pause. The hook's other
// tests call setDirection directly, which never exercises this listener.
describe('keyboard controls', () => {
  function press(key) {
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    act(() => { window.dispatchEvent(event); });
    return event;
  }

  function startPlaying() {
    jest.useFakeTimers();
    const hook = renderHook(() => useSnakeGame());
    act(() => hook.result.current.resetGame()); // head (10,10), moving right
    return hook;
  }

  test.each([
    ['ArrowUp', { x: 10, y: 9 }],
    ['w', { x: 10, y: 9 }],
    ['ArrowDown', { x: 10, y: 11 }],
    ['s', { x: 10, y: 11 }],
  ])('%s turns the snake', (key, expectedHead) => {
    const { result } = startPlaying();
    press(key);
    act(() => { jest.advanceTimersByTime(result.current.speed); });
    expect(result.current.snake[0]).toEqual(expectedHead);
  });

  test.each(['ArrowLeft', 'a'])('%s (a reversal) is ignored while moving right', (key) => {
    const { result } = startPlaying();
    press(key);
    act(() => { jest.advanceTimersByTime(result.current.speed); });
    expect(result.current.snake[0]).toEqual({ x: 11, y: 10 });
  });

  test('keys that are not controls do nothing', () => {
    const { result } = startPlaying();
    press('x');
    act(() => { jest.advanceTimersByTime(result.current.speed); });
    expect(result.current.snake[0]).toEqual({ x: 11, y: 10 });
    expect(result.current.gameState).toBe('playing');
  });

  test('space pauses a playing game and resumes a paused one', () => {
    const { result } = startPlaying();
    press(' ');
    expect(result.current.gameState).toBe('paused');
    press(' ');
    expect(result.current.gameState).toBe('playing');
  });

  test('space does nothing before the game has started', () => {
    const { result } = renderHook(() => useSnakeGame());
    press(' ');
    expect(result.current.gameState).toBe('idle');
  });

  test('space prevents the page from scrolling', () => {
    startPlaying();
    const event = press(' ');
    expect(event.defaultPrevented).toBe(true);
  });

  test('direction keys are ignored while paused', () => {
    const { result } = startPlaying();
    press(' ');          // pause
    press('ArrowUp');    // should be ignored
    press(' ');          // resume
    act(() => { jest.advanceTimersByTime(result.current.speed); });
    expect(result.current.snake[0]).toEqual({ x: 11, y: 10 }); // still heading right
  });
});
