import React from 'react';
import { renderHook, act } from '@testing-library/react';
import useGame2048 from './useGame2048';

afterEach(() => localStorage.clear());

const blank = () => Array.from({ length: 4 }, () => Array(4).fill(0));
const withRow0 = (...values) => { const b = blank(); b[0] = values; return b; };
// A stand-in for Math.random that yields the given numbers in order (cell first, then value).
const scripted = (...values) => { let i = 0; return () => values[i++]; };

function setup({ board, random, ...rest } = {}) {
  const createBoard = board ? () => board.map(row => [...row]) : undefined;
  return renderHook(() => useGame2048({ random, createBoard }), rest.wrapper ? { wrapper: rest.wrapper } : undefined);
}

describe('before a game starts', () => {
  test('is idle with an empty board and no score', () => {
    const { result } = setup();
    expect(result.current.gameState).toBe('idle');
    expect(result.current.board).toEqual(blank());
    expect(result.current.score).toBe(0);
  });

  test('shows the saved best score', () => {
    localStorage.setItem('game2048_best', '1234');
    expect(setup().result.current.best).toBe(1234);
  });

  test.each(['abc', '-50', '0', ''])('treats a saved best of %j as no best (never NaN)', (saved) => {
    localStorage.setItem('game2048_best', saved);
    expect(setup().result.current.best).toBe(0);
  });

  test('ignores a move before the game has started', () => {
    const { result } = setup({ board: withRow0(2, 2, 0, 0) });
    let moved;
    act(() => { moved = result.current.slide('left'); });
    expect(moved).toBe(false);
    expect(result.current.board).toEqual(blank());
  });
});

describe('starting a game', () => {
  test('begins play with the starting board and a zero score', () => {
    const { result } = setup({ board: withRow0(2, 4, 0, 0) });
    act(() => result.current.startGame());
    expect(result.current.gameState).toBe('playing');
    expect(result.current.board).toEqual(withRow0(2, 4, 0, 0));
    expect(result.current.score).toBe(0);
  });

  test('by default deals two tiles', () => {
    const { result } = setup();
    act(() => result.current.startGame());
    expect(result.current.board.flat().filter(v => v !== 0)).toHaveLength(2);
  });

  test('a new game resets the score but keeps the best', () => {
    const { result } = setup({ board: withRow0(2, 2, 0, 0), random: scripted(0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    expect(result.current.score).toBe(4);
    act(() => result.current.startGame());
    expect(result.current.score).toBe(0);
    expect(result.current.best).toBe(4);
  });
});

describe('scoring after a new game', () => {
  test('starts again from zero: the next merge scores 4, not 4 on top of the old game', () => {
    // The displayed score resets on a new game, but the running total behind it must too,
    // or the first merge of the next game would show 8.
    const { result } = setup({ board: withRow0(2, 2, 0, 0), random: scripted(0, 0, 0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    expect(result.current.score).toBe(4);
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    expect(result.current.score).toBe(4);
    expect(result.current.best).toBe(4);
  });
});

describe('making a move', () => {
  test('slides, merges, scores and spawns exactly one new tile', () => {
    // The spawn draws 0 then 0: the first empty cell, (0,1), and a 2.
    const { result } = setup({ board: withRow0(2, 2, 0, 0), random: scripted(0, 0) });
    act(() => result.current.startGame());
    let moved;
    act(() => { moved = result.current.slide('left'); });
    expect(moved).toBe(true);
    expect(result.current.board).toEqual(withRow0(4, 2, 0, 0));
    expect(result.current.score).toBe(4);
  });

  test('a move that changes nothing spawns no tile, scores nothing and uses no randomness', () => {
    const random = jest.fn(() => 0);
    const { result } = setup({ board: withRow0(2, 4, 0, 0), random });
    act(() => result.current.startGame());
    let moved;
    act(() => { moved = result.current.slide('left'); });
    expect(moved).toBe(false);
    expect(result.current.board).toEqual(withRow0(2, 4, 0, 0));
    expect(result.current.score).toBe(0);
    expect(random).not.toHaveBeenCalled();
  });

  test('the score adds up across moves', () => {
    // Worked out by hand. Start:   [2,2,4,4]      Move left: row 0 merges twice
    //                              [4,0,0,0]      (2+2 -> 4, 4+4 -> 8): +12, and the
    //                                             spawn lands in (0,2) as a 2:
    //                                             [4,8,2,0] / [4,0,0,0].
    // Move up: column 0 is [4,4,..], which merges into an 8: +8, total 20.
    const board = blank();
    board[0] = [2, 2, 4, 4];
    board[1] = [4, 0, 0, 0];
    const { result } = setup({ board, random: scripted(0, 0, 0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    expect(result.current.score).toBe(12);
    act(() => { result.current.slide('up'); });
    expect(result.current.score).toBe(20);
    expect(result.current.best).toBe(20);
  });

  test('is counted once under React.StrictMode too (no double scoring)', () => {
    const { result } = setup({
      board: withRow0(2, 2, 0, 0), random: scripted(0, 0), wrapper: React.StrictMode,
    });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    expect(result.current.score).toBe(4);
    expect(result.current.best).toBe(4);
    expect(localStorage.getItem('game2048_best')).toBe('4');
  });
});

describe('the best score', () => {
  test('rises with the score and is saved', () => {
    const { result } = setup({ board: withRow0(2, 2, 0, 0), random: scripted(0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    expect(result.current.best).toBe(4);
    expect(localStorage.getItem('game2048_best')).toBe('4');
  });

  test('is not lowered or rewritten by a lower score', () => {
    localStorage.setItem('game2048_best', '100');
    const { result } = setup({ board: withRow0(2, 2, 0, 0), random: scripted(0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    expect(result.current.score).toBe(4);
    expect(result.current.best).toBe(100);
    expect(localStorage.getItem('game2048_best')).toBe('100');
  });
});

describe('reaching 2048', () => {
  const nearWin = () => withRow0(1024, 1024, 0, 0);

  test('merging two 1024s wins the game', () => {
    const { result } = setup({ board: nearWin(), random: scripted(0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    expect(result.current.board[0][0]).toBe(2048);
    expect(result.current.gameState).toBe('won');
  });

  test('moves are ignored while the win is waiting for a decision', () => {
    const { result } = setup({ board: nearWin(), random: scripted(0, 0, 0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    const before = result.current.board;
    let moved;
    act(() => { moved = result.current.slide('down'); });
    expect(moved).toBe(false);
    expect(result.current.board).toEqual(before);
  });

  test('keep playing resumes the game, and the win does not trigger again', () => {
    const { result } = setup({ board: nearWin(), random: scripted(0, 0, 0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    act(() => result.current.keepPlaying());
    expect(result.current.gameState).toBe('playing');
    act(() => { result.current.slide('down'); });
    expect(result.current.gameState).toBe('playing'); // 2048 is still on the board, but no second win
  });

  test('keepPlaying does nothing unless the game is in the won state', () => {
    const { result } = setup({ board: withRow0(2, 4, 0, 0) });
    act(() => result.current.startGame());
    act(() => result.current.keepPlaying());
    expect(result.current.gameState).toBe('playing');
  });

  test('if the board is stuck at the moment of winning, continuing ends the game', () => {
    // Merging the two 1024s leaves a full board with no move left once the new tile lands.
    const board = [
      [1024, 1024, 8, 16],
      [32, 64, 128, 256],
      [512, 4096, 2, 4],
      [8192, 16384, 32768, 65536],
    ];
    const { result } = setup({ board, random: scripted(0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); });
    expect(result.current.gameState).toBe('won'); // the win is announced first
    act(() => result.current.keepPlaying());
    expect(result.current.gameState).toBe('over');
  });
});

describe('game over', () => {
  // One slide to the right fills the last gap and leaves a full board with no equal neighbours.
  const nearlyStuck = () => [
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [512, 1024, 2, 4],
    [8, 16, 32, 0],
  ];

  test('the game ends when the last move leaves no move', () => {
    const { result } = setup({ board: nearlyStuck(), random: scripted(0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('right'); });
    expect(result.current.gameState).toBe('over');
  });

  test('moves are ignored once the game is over', () => {
    const { result } = setup({ board: nearlyStuck(), random: scripted(0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('right'); });
    const before = result.current.board;
    let moved;
    act(() => { moved = result.current.slide('left'); });
    expect(moved).toBe(false);
    expect(result.current.board).toEqual(before);
  });

  test('a new game after game over starts fresh', () => {
    const { result } = setup({ board: nearlyStuck(), random: scripted(0, 0) });
    act(() => result.current.startGame());
    act(() => { result.current.slide('right'); });
    act(() => result.current.startGame());
    expect(result.current.gameState).toBe('playing');
    expect(result.current.score).toBe(0);
  });
});
