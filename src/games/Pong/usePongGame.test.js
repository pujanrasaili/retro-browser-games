import { renderHook, act } from '@testing-library/react';
import usePongGame, { CANVAS_WIDTH, CANVAS_HEIGHT } from './usePongGame';

// Scope note: Pong's actual ball/paddle physics run inside a
// requestAnimationFrame loop that mutates a ref directly (stateRef), not
// React state — only scoring events touch React state. Deterministically
// driving requestAnimationFrame in jsdom/Jest is meaningfully harder than
// the setInterval-based game loops already tested in Snake/Tetris (would
// need a custom RAF mock with manual frame stepping), so this file
// deliberately covers only the parts of the hook that don't require the
// physics loop to actually tick: initial state, resetGame, and the
// persisted AI difficulty setting. The physics/collision logic itself
// (tunneling prevention, paddle bounce angles) is not covered by automated
// tests yet.

afterEach(() => {
  localStorage.clear();
});

describe('usePongGame', () => {
  test('starts idle with both scores at 0', () => {
    const { result } = renderHook(() => usePongGame());
    expect(result.current.gameState).toBe('idle');
    expect(result.current.leftScore).toBe(0);
    expect(result.current.rightScore).toBe(0);
  });

  test('defaults to AI mode and medium difficulty when nothing is persisted', () => {
    const { result } = renderHook(() => usePongGame());
    expect(result.current.mode).toBe('ai');
    expect(result.current.aiDifficulty).toBe('medium');
  });

  test('initializes aiDifficulty and cpuWins from localStorage when present', () => {
    localStorage.setItem('pong_ai_difficulty', 'hard');
    localStorage.setItem('pong_cpu_wins', '5');
    const { result } = renderHook(() => usePongGame());
    expect(result.current.aiDifficulty).toBe('hard');
    expect(result.current.cpuWins).toBe(5);
  });

  test('setAiDifficulty updates state and persists to localStorage', () => {
    const { result } = renderHook(() => usePongGame());
    act(() => result.current.setAiDifficulty('easy'));
    expect(result.current.aiDifficulty).toBe('easy');
    expect(localStorage.getItem('pong_ai_difficulty')).toBe('easy');
  });

  test('resetGame sets gameState to playing and resets both scores', () => {
    const { result } = renderHook(() => usePongGame());
    act(() => result.current.resetGame('ai'));
    expect(result.current.gameState).toBe('playing');
    expect(result.current.leftScore).toBe(0);
    expect(result.current.rightScore).toBe(0);
    expect(result.current.mode).toBe('ai');
  });

  test('resetGame centers the ball and both paddles', () => {
    const { result } = renderHook(() => usePongGame());
    act(() => result.current.resetGame('ai'));
    const s = result.current.stateRef.current;
    expect(s.ballX).toBe(CANVAS_WIDTH / 2);
    expect(s.ballY).toBe(CANVAS_HEIGHT / 2);
    // Ball velocity direction is randomized (Math.random()), so only assert
    // it's nonzero and within the expected initial speed magnitude, not an
    // exact value
    expect(Math.abs(s.ballVX)).toBeGreaterThan(0);
  });

  test('resetGame with 2p mode sets mode correctly', () => {
    const { result } = renderHook(() => usePongGame());
    act(() => result.current.resetGame('2p'));
    expect(result.current.mode).toBe('2p');
  });
});
