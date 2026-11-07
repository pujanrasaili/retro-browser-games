import { render, fireEvent } from '@testing-library/react';
import Snake from './Snake';
import useSnakeGame, { DIFFICULTIES } from './useSnakeGame';

// Swipe-to-steer is the only way to turn on a phone besides the on-screen D-pad, and
// nothing covered it. The hook is mocked (its logic is tested in useSnakeGame*.test.js);
// these tests drive real touch events through the component.
jest.mock('./useSnakeGame', () => ({
  __esModule: true,
  default: jest.fn(),
  DIFFICULTIES: jest.requireActual('./useSnakeGame').DIFFICULTIES,
}));

let setDirection;
beforeEach(() => {
  setDirection = jest.fn();
  useSnakeGame.mockReturnValue({
    snake: [], food: { x: 5, y: 5 }, score: 0, highScore: 0, bestLength: 0,
    gameState: 'playing', speed: DIFFICULTIES.medium.speed, eatBurst: null,
    milestone: null, scoreBump: false,
    difficulty: 'medium', setDifficulty: jest.fn(), walls: false, setWalls: jest.fn(),
    resetGame: jest.fn(), setDirection, BOARD_SIZE: 20,
  });
});

function swipe(from, to) {
  const { container } = render(<Snake />);
  const board = container.querySelector('.board-container');
  fireEvent.touchStart(board, { touches: [{ clientX: from[0], clientY: from[1] }] });
  fireEvent.touchEnd(board, { changedTouches: [{ clientX: to[0], clientY: to[1] }] });
  return board;
}

describe('swiping the board', () => {
  test.each([
    ['right', [100, 100], [160, 110], { x: 1, y: 0 }],
    ['left', [100, 100], [40, 95], { x: -1, y: 0 }],
    ['down', [100, 100], [105, 170], { x: 0, y: 1 }],
    ['up', [100, 100], [95, 30], { x: 0, y: -1 }],
  ])('a swipe %s steers that way', (_name, from, to, expected) => {
    swipe(from, to);
    expect(setDirection).toHaveBeenCalledTimes(1);
    expect(setDirection).toHaveBeenCalledWith(expected);
  });

  test('a diagonal swipe goes along whichever axis moved further', () => {
    swipe([100, 100], [150, 120]); // 50 across, 20 down: mostly horizontal
    expect(setDirection).toHaveBeenCalledWith({ x: 1, y: 0 });
  });

  test('a swipe that is exactly diagonal goes vertical', () => {
    swipe([100, 100], [150, 150]);
    expect(setDirection).toHaveBeenCalledWith({ x: 0, y: 1 });
  });

  test('a touch that ends with no start does nothing', () => {
    const { container } = render(<Snake />);
    fireEvent.touchEnd(container.querySelector('.board-container'), {
      changedTouches: [{ clientX: 200, clientY: 200 }],
    });
    expect(setDirection).not.toHaveBeenCalled();
  });

  test('each swipe is used once: a stray second touchend does nothing', () => {
    const board = swipe([100, 100], [160, 100]);
    fireEvent.touchEnd(board, { changedTouches: [{ clientX: 300, clientY: 300 }] });
    expect(setDirection).toHaveBeenCalledTimes(1);
  });

  // Regression: handleTouchEnd had no minimum distance, so a plain tap (no movement)
  // fell into the vertical branch and turned the snake UP, and tiny finger jitter
  // steered it in a random direction. A tap must not steer.
  test.each([
    ['a tap with no movement', [100, 100], [100, 100]],
    ['finger jitter of a few pixels', [100, 100], [103, 98]],
    ['a movement just under the 20px minimum', [100, 100], [119, 100]],
  ])('%s does not change direction', (_name, from, to) => {
    swipe(from, to);
    expect(setDirection).not.toHaveBeenCalled();
  });

  test('a movement of exactly the 20px minimum does count as a swipe', () => {
    swipe([100, 100], [120, 100]);
    expect(setDirection).toHaveBeenCalledWith({ x: 1, y: 0 });
  });
});
