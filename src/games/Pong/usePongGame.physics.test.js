import React from 'react';
import { renderHook, act } from '@testing-library/react';
import usePongGame from './usePongGame';

// requestAnimationFrame is replaced with a manual stepper: the hook's game
// loop registers its tick callback, and stepFrame() runs exactly one tick.
// This makes the physics deterministic — each test positions the ball and
// paddles directly via the exposed stateRef, steps one frame, and asserts
// exact results, with no real timing involved.
let rafCallback = null;
const originalRaf = window.requestAnimationFrame;
const originalCaf = window.cancelAnimationFrame;

beforeEach(() => {
  rafCallback = null;
  window.requestAnimationFrame = (cb) => { rafCallback = cb; return 1; };
  window.cancelAnimationFrame = () => { rafCallback = null; };
});

afterEach(() => {
  window.requestAnimationFrame = originalRaf;
  window.cancelAnimationFrame = originalCaf;
  localStorage.clear();
});

function stepFrame() {
  act(() => {
    const cb = rafCallback;
    rafCallback = null; // tick re-registers itself via requestAnimationFrame
    cb();
  });
}

function startGame(mode = '2p') {
  const hook = renderHook(() => usePongGame());
  act(() => hook.result.current.resetGame(mode));
  // resetGame replaces stateRef.current with a fresh object, so always read
  // it through this getter rather than caching a reference
  const state = () => hook.result.current.stateRef.current;
  return { ...hook, state };
}

describe('Pong physics loop', () => {
  test('the ball moves by its velocity each frame', () => {
    const { state } = startGame();
    Object.assign(state(), { ballX: 300, ballY: 200, ballVX: 4, ballVY: 2 });
    stepFrame();
    expect(state().ballX).toBe(304);
    expect(state().ballY).toBe(202);
  });

  test('the ball bounces off the top wall, flipping vertical velocity and clamping position', () => {
    const { state } = startGame();
    Object.assign(state(), { ballX: 300, ballY: 1, ballVX: 4, ballVY: -3 });
    stepFrame();
    expect(state().ballY).toBe(0);
    expect(state().ballVY).toBe(3);
  });

  test('the ball bounces off the left paddle with a 5% speed increase', () => {
    const { state } = startGame();
    Object.assign(state(), { leftY: 100, ballX: 15, ballY: 120, ballVX: -4, ballVY: 0 });
    stepFrame();
    expect(state().ballVX).toBeCloseTo(4.2); // -4 * -1.05
  });

  test('the ball bounces off the right paddle with a 5% speed increase', () => {
    const { state } = startGame('2p'); // 2p so the right paddle is stationary
    Object.assign(state(), { rightY: 100, ballX: 575, ballY: 120, ballVX: 4, ballVY: 0 });
    stepFrame();
    expect(state().ballVX).toBeCloseTo(-4.2);
  });

  test('ball speed is capped so it cannot tunnel through a paddle', () => {
    const { state } = startGame();
    // 8.9 * 1.05 = 9.345, which must be clamped to MAX_BALL_SPEED (9).
    // ballVY is also pushed past the cap via a low-on-the-paddle hit.
    Object.assign(state(), { leftY: 100, ballX: 20, ballY: 150, ballVX: -8.9, ballVY: 8.5 });
    stepFrame();
    expect(state().ballVX).toBe(9);
    expect(state().ballVY).toBe(9);
  });

  test('a ball that passes the paddle is not bounced (no collision outside the paddle)', () => {
    const { state } = startGame();
    // Ball is in the paddle's x-zone but well below the paddle's y-range
    Object.assign(state(), { leftY: 0, ballX: 15, ballY: 300, ballVX: -4, ballVY: 0 });
    stepFrame();
    expect(state().ballVX).toBe(-4); // unchanged: no bounce
  });

  test('the left paddle moves up with W and down with S, within the canvas', () => {
    const { state } = startGame();
    const startY = state().leftY;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    stepFrame();
    expect(state().leftY).toBe(startY - 6);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    stepFrame();
    expect(state().leftY).toBe(startY);
  });

  test('the left paddle cannot move above the top of the canvas', () => {
    const { state } = startGame();
    state().leftY = 2;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    stepFrame();
    expect(state().leftY).toBe(0);
  });

  test('in 2-player mode the arrow keys move the right paddle', () => {
    const { state } = startGame('2p');
    const startY = state().rightY;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    stepFrame();
    expect(state().rightY).toBe(startY - 6);
  });

  test('in AI mode the CPU paddle tracks the ball at medium-difficulty speed', () => {
    const { state } = startGame('ai');
    Object.assign(state(), { rightY: 190, ballX: 300, ballY: 400, ballVX: 0, ballVY: 0 });
    stepFrame();
    // medium = 0.75 * PADDLE_SPEED (6) = 4.5 per frame, moving toward the ball
    expect(state().rightY).toBeCloseTo(194.5);
  });

  test('a ball leaving the left edge scores a point for the right player and resets to center', () => {
    const { result, state } = startGame('2p');
    Object.assign(state(), { ballX: 1, ballY: 200, ballVX: -4, ballVY: 0 });
    stepFrame();
    expect(result.current.rightScore).toBe(1);
    expect(result.current.leftScore).toBe(0);
    expect(state().ballX).toBe(300); // reset to canvas center
  });

  test('a ball leaving the right edge scores a point for the left player', () => {
    const { result, state } = startGame('2p');
    Object.assign(state(), { ballX: 599, ballY: 200, ballVX: 4, ballVY: 0 });
    stepFrame();
    expect(result.current.leftScore).toBe(1);
    expect(result.current.rightScore).toBe(0);
  });

  test('reaching 7 points ends the game and names the winner', () => {
    const { result, state } = startGame('2p');
    for (let i = 0; i < 7; i++) {
      Object.assign(state(), { ballX: 599, ballY: 200, ballVX: 4, ballVY: 0 });
      stepFrame();
    }
    expect(result.current.leftScore).toBe(7);
    expect(result.current.gameState).toBe('over');
    expect(result.current.winner).toBe('left');
  });

  test('beating the CPU records a win in localStorage; a 2-player win does not', () => {
    const ai = startGame('ai');
    for (let i = 0; i < 7; i++) {
      Object.assign(ai.state(), { ballX: 599, ballY: 200, ballVX: 4, ballVY: 0 });
      stepFrame();
    }
    expect(ai.result.current.winner).toBe('left');
    expect(localStorage.getItem('pong_cpu_wins')).toBe('1');
    ai.unmount();

    localStorage.clear();
    const twoP = startGame('2p');
    for (let i = 0; i < 7; i++) {
      Object.assign(twoP.state(), { ballX: 599, ballY: 200, ballVX: 4, ballVY: 0 });
      stepFrame();
    }
    expect(twoP.result.current.winner).toBe('left');
    expect(localStorage.getItem('pong_cpu_wins')).toBeNull();
  });

  // Regression: src/index.js wraps the app in React.StrictMode, which runs state
  // updater functions twice in development. The win-counting side effects used
  // to live inside the setLeftScore updater, so one CPU win was recorded as two
  // under `npm start` (state and localStorage both showed 2). Side effects must
  // run once per scored point regardless of StrictMode.
  test('one CPU win is counted exactly once, even under StrictMode', () => {
    const hook = renderHook(() => usePongGame(), { wrapper: React.StrictMode });
    act(() => hook.result.current.resetGame('ai'));
    for (let i = 0; i < 7; i++) {
      Object.assign(hook.result.current.stateRef.current, { ballX: 599, ballY: 200, ballVX: 4, ballVY: 0 });
      stepFrame();
    }
    expect(hook.result.current.winner).toBe('left');
    expect(hook.result.current.cpuWins).toBe(1);
    expect(localStorage.getItem('pong_cpu_wins')).toBe('1');
  });
});
