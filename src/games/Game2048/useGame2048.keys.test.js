import { renderHook, act } from '@testing-library/react';
import useGame2048 from './useGame2048';

afterEach(() => localStorage.clear());

const blank = () => Array.from({ length: 4 }, () => Array(4).fill(0));
const lone = () => { const b = blank(); b[1][1] = 2; return b; }; // a single 2 at row 1, col 1
// A stand-in for Math.random: the spawn after a move takes the LAST empty cell, as a 2.
const spawnLast = () => { const v = [0.999, 0]; let i = 0; return () => v[i++ % 2]; };

const press = (key, init = {}) => {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, ...init });
  act(() => { window.dispatchEvent(event); });
  return event;
};

function mount({ board = lone(), random = spawnLast() } = {}) {
  return renderHook(() => useGame2048({ random, createBoard: () => board.map(r => [...r]) }));
}
function playing(options) {
  const hook = mount(options);
  act(() => hook.result.current.startGame());
  return hook;
}

describe('steering with the keyboard', () => {
  test.each([
    ['ArrowLeft', 1, 0], ['a', 1, 0], ['A', 1, 0],
    ['ArrowRight', 1, 3], ['d', 1, 3], ['D', 1, 3],
    ['ArrowUp', 0, 1], ['w', 0, 1], ['W', 0, 1],
    ['ArrowDown', 3, 1], ['s', 3, 1], ['S', 3, 1],
  ])('%s slides the tile to row %i, column %i', (key, row, col) => {
    const { result } = playing();
    press(key);
    expect(result.current.board[row][col]).toBe(2);
    expect(result.current.board[1][1]).toBe(0); // it left where it started
  });

  test('keys that are not controls do nothing', () => {
    const { result } = playing();
    press('x');
    press('Escape');
    press('q');
    expect(result.current.board).toEqual(lone());
  });

  test.each(['idle', 'over'])('movement keys do nothing in the %s state', (state) => {
    const nearlyStuck = [[2, 4, 8, 16], [32, 64, 128, 256], [512, 1024, 2, 4], [8, 16, 32, 0]];
    const { result } = mount({ board: state === 'over' ? nearlyStuck : lone(), random: () => 0 });
    if (state === 'over') {
      act(() => result.current.startGame());
      press('ArrowRight'); // the move that ends the game
      expect(result.current.gameState).toBe('over');
    }
    const before = result.current.board;
    press('ArrowLeft');
    expect(result.current.board).toEqual(before);
  });
});

describe('not interfering with the page', () => {
  test('arrow keys are stopped from scrolling the page while a game is being played', () => {
    playing();
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach((key) => {
      expect(press(key).defaultPrevented).toBe(true);
    });
  });

  test('letter keys are left alone', () => {
    playing();
    expect(press('w').defaultPrevented).toBe(false);
  });

  test('arrow keys still scroll the page before a game has started', () => {
    mount();
    expect(press('ArrowDown').defaultPrevented).toBe(false);
  });

  test.each([
    ['ctrlKey', 'ArrowLeft'], ['metaKey', 'ArrowLeft'], ['altKey', 'ArrowLeft'],
    ['ctrlKey', 's'], ['metaKey', 'a'],
  ])('a key with %s held (%s) is a browser shortcut, not a move', (modifier, key) => {
    const { result } = playing();
    const event = press(key, { [modifier]: true });
    expect(result.current.board).toEqual(lone());
    expect(event.defaultPrevented).toBe(false);
  });

  test('the listener is removed when the game is unmounted', () => {
    const remove = jest.spyOn(window, 'removeEventListener');
    const { unmount } = playing();
    unmount();
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
    remove.mockRestore();
  });
});

describe('Space and Enter', () => {
  test.each([' ', 'Enter'])('%j starts a game from the idle screen', (key) => {
    const { result } = mount();
    expect(result.current.gameState).toBe('idle');
    const event = press(key);
    expect(result.current.gameState).toBe('playing');
    expect(event.defaultPrevented).toBe(true);
  });

  test.each([' ', 'Enter'])('%j starts a new game after game over', (key) => {
    const nearlyStuck = [[2, 4, 8, 16], [32, 64, 128, 256], [512, 1024, 2, 4], [8, 16, 32, 0]];
    const { result } = mount({ board: nearlyStuck, random: () => 0 });
    act(() => result.current.startGame());
    press('ArrowRight');
    expect(result.current.gameState).toBe('over');
    press(key);
    expect(result.current.gameState).toBe('playing');
    expect(result.current.score).toBe(0);
  });

  test.each([' ', 'Enter'])('%j dismisses the win screen and carries on', (key) => {
    const nearWin = blank(); nearWin[0] = [1024, 1024, 0, 0];
    const { result } = mount({ board: nearWin, random: () => 0 });
    act(() => result.current.startGame());
    press('ArrowLeft');
    expect(result.current.gameState).toBe('won');
    press(key);
    expect(result.current.gameState).toBe('playing');
  });

  test('are ignored in the middle of a game (they must not restart it)', () => {
    const board = blank(); board[0] = [2, 2, 0, 0];
    const { result } = mount({ board, random: () => 0 });
    act(() => result.current.startGame());
    press('ArrowLeft'); // merges: score 4
    expect(result.current.score).toBe(4);
    press(' ');
    press('Enter');
    expect(result.current.score).toBe(4);
    expect(result.current.gameState).toBe('playing');
  });

  test('a key with a modifier held does not start a game', () => {
    const { result } = mount();
    press('Enter', { ctrlKey: true });
    expect(result.current.gameState).toBe('idle');
  });
});
