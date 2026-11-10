import React from 'react';
import { renderHook, act } from '@testing-library/react';
import useSnakeGame, { DIFFICULTIES } from './useSnakeGame';

// The core rules of Snake (walls, wrap-around, running into yourself, milestones, the eat
// burst) and the saved settings were never tested. The board is 20x20 and the snake starts at
// (10,10) heading right. Food is placed by scripting Math.random: each food takes two numbers
// (x then y), and a value of (n + 0.5) / 20 lands exactly in cell n. Anything not scripted goes
// to cell (1,1), which is nowhere near the tests' paths.
function placeFoodAt(...cells) {
  const values = cells.flatMap(([x, y]) => [(x + 0.5) / 20, (y + 0.5) / 20]);
  let i = 0;
  jest.spyOn(Math, 'random').mockImplementation(() => (i < values.length ? values[i++] : 0.075));
}

function start({ walls = false, wrapper } = {}) {
  jest.useFakeTimers();
  const hook = renderHook(() => useSnakeGame(), wrapper ? { wrapper } : undefined);
  if (walls) act(() => hook.result.current.setWalls(true));
  act(() => hook.result.current.resetGame());
  return hook;
}

// One game tick: the loop runs every `speed` ms, and the speed changes as the snake eats.
const tick = (hook, times = 1) => {
  for (let i = 0; i < times; i++) act(() => { jest.advanceTimersByTime(hook.result.current.speed); });
};
const turn = (hook, x, y) => act(() => hook.result.current.setDirection({ x, y }));
const head = (hook) => hook.result.current.snake[0];

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  localStorage.clear();
});

describe('with walls', () => {
  test('the snake can reach the right wall and is still playing', () => {
    placeFoodAt([1, 1]);
    const hook = start({ walls: true });
    tick(hook, 9); // x goes 10 -> 19
    expect(head(hook)).toEqual({ x: 19, y: 10 });
    expect(hook.result.current.gameState).toBe('playing');
  });

  test('one more step into the right wall ends the game', () => {
    placeFoodAt([1, 1]);
    const hook = start({ walls: true });
    tick(hook, 10);
    expect(hook.result.current.gameState).toBe('over');
    expect(head(hook)).toEqual({ x: 19, y: 10 }); // it stopped at the wall, it did not move into it
  });

  test('the top wall ends the game too', () => {
    placeFoodAt([1, 1]);
    const hook = start({ walls: true });
    turn(hook, 0, -1);
    tick(hook, 10); // y goes 9 -> 0
    expect(head(hook)).toEqual({ x: 10, y: 0 });
    expect(hook.result.current.gameState).toBe('playing');
    tick(hook);
    expect(hook.result.current.gameState).toBe('over');
  });
});

describe('without walls (the default)', () => {
  test('going off the right edge comes out on the left', () => {
    placeFoodAt([1, 1]);
    const hook = start();
    tick(hook, 10);
    expect(head(hook)).toEqual({ x: 0, y: 10 });
    expect(hook.result.current.gameState).toBe('playing');
  });

  test('going off the top edge comes out at the bottom', () => {
    placeFoodAt([1, 1]);
    const hook = start();
    turn(hook, 0, -1);
    tick(hook, 11); // y: 9, 8 ... 0, then wraps to 19
    expect(head(hook)).toEqual({ x: 10, y: 19 });
    expect(hook.result.current.gameState).toBe('playing');
  });
});

describe('running into yourself', () => {
  test('a long enough snake that turns into its own body ends the game', () => {
    // Eat two foods straight ahead to grow to 5, then turn up, left and down: a tight U-turn
    // that puts the head back onto the body.
    placeFoodAt([11, 10], [12, 10]);
    const hook = start();
    tick(hook, 2);
    expect(hook.result.current.snake).toHaveLength(5);
    turn(hook, 0, -1); tick(hook);
    turn(hook, -1, 0); tick(hook);
    expect(hook.result.current.gameState).toBe('playing'); // not yet: the next step closes the loop
    turn(hook, 0, 1); tick(hook);
    expect(hook.result.current.gameState).toBe('over');
  });

  test('the same turns with the snake still too short to reach itself are safe', () => {
    placeFoodAt([1, 1]);
    const hook = start();
    turn(hook, 0, -1); tick(hook);
    turn(hook, -1, 0); tick(hook);
    turn(hook, 0, 1); tick(hook);
    expect(hook.result.current.gameState).toBe('playing');
  });
});

describe('milestones', () => {
  test('a milestone is announced at every tenth segment, and fades after 1.2 seconds', () => {
    placeFoodAt([11, 10], [12, 10], [13, 10], [14, 10], [15, 10], [16, 10], [17, 10]);
    const hook = start();
    for (let eaten = 1; eaten <= 7; eaten++) {
      tick(hook);
      expect(hook.result.current.snake).toHaveLength(3 + eaten);
      // length 10 is reached on the 7th food; every length before it has no milestone
      expect(hook.result.current.milestone).toBe(eaten === 7 ? 10 : null);
    }
    expect(hook.result.current.score).toBe(70);
    act(() => { jest.advanceTimersByTime(1199); });
    expect(hook.result.current.milestone).toBe(10);
    act(() => { jest.advanceTimersByTime(1); });
    expect(hook.result.current.milestone).toBeNull();
  });
});

describe('the eat burst', () => {
  test('shows where the food was eaten, then clears after 400ms', () => {
    placeFoodAt([11, 10]);
    const hook = start();
    tick(hook);
    expect(hook.result.current.eatBurst).toMatchObject({ x: 11, y: 10 });
    act(() => { jest.advanceTimersByTime(399); });
    expect(hook.result.current.eatBurst).not.toBeNull();
    act(() => { jest.advanceTimersByTime(1); });
    expect(hook.result.current.eatBurst).toBeNull();
  });

  test('an older burst\'s timer does not wipe out a newer burst', () => {
    // Two foods eaten about 128ms apart. The first burst's 400ms timer fires while the second
    // burst is still on screen and must leave it alone.
    placeFoodAt([11, 10], [12, 10]);
    const hook = start();
    tick(hook);                                   // first eaten at t = 130
    tick(hook);                                   // second eaten at t = 130 + 128 = 258
    expect(hook.result.current.eatBurst).toMatchObject({ x: 12, y: 10 });
    act(() => { jest.advanceTimersByTime(280); }); // t = 538: past 130 + 400, before 258 + 400
    expect(hook.result.current.eatBurst).toMatchObject({ x: 12, y: 10 });
    act(() => { jest.advanceTimersByTime(130); }); // t = 668: past 258 + 400
    expect(hook.result.current.eatBurst).toBeNull();
  });
});

describe('saved settings', () => {
  test('choosing a difficulty is remembered and sets the starting speed', () => {
    const { result } = renderHook(() => useSnakeGame());
    act(() => result.current.setDifficulty('hard'));
    expect(result.current.difficulty).toBe('hard');
    expect(localStorage.getItem('snake_difficulty')).toBe('hard');
    act(() => result.current.resetGame());
    expect(result.current.speed).toBe(DIFFICULTIES.hard.speed);
  });

  test('turning walls on and off is remembered', () => {
    const { result } = renderHook(() => useSnakeGame());
    act(() => result.current.setWalls(true));
    expect(result.current.walls).toBe(true);
    expect(localStorage.getItem('snake_walls')).toBe('true');
    act(() => result.current.setWalls(false));
    expect(result.current.walls).toBe(false);
    expect(localStorage.getItem('snake_walls')).toBe('false');
  });

  test('walls can be toggled with an updater function, as the UI does', () => {
    const { result } = renderHook(() => useSnakeGame());
    act(() => result.current.setWalls(w => !w));
    expect(result.current.walls).toBe(true);
    act(() => result.current.setWalls(w => !w));
    expect(result.current.walls).toBe(false);
    expect(localStorage.getItem('snake_walls')).toBe('false');
  });

  test('a toggle counts once under React.StrictMode too (not flipped twice)', () => {
    const { result } = renderHook(() => useSnakeGame(), { wrapper: React.StrictMode });
    act(() => result.current.setWalls(w => !w));
    expect(result.current.walls).toBe(true);
    expect(localStorage.getItem('snake_walls')).toBe('true');
  });
});
