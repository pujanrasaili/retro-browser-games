import { render, screen, fireEvent } from '@testing-library/react';
import Game2048 from './Game2048';
import useGame2048 from './useGame2048';

// Swiping is the only way to play 2048 on a phone, and nothing covered it. The hook is mocked
// (its logic is tested in useGame2048*.test.js); these tests drive real touch events through
// the screen. The direction rules themselves are tested in swipeDirection.test.js, so this
// file checks the wiring: that the right gestures reach slide(), and that nothing else does.
jest.mock('./useGame2048');

let slide;
beforeEach(() => {
  slide = jest.fn();
  useGame2048.mockReturnValue({
    board: Array.from({ length: 4 }, () => Array(4).fill(0)),
    score: 0, best: 0, gameState: 'playing',
    startGame: jest.fn(), keepPlaying: jest.fn(), slide, SIZE: 4,
  });
});

const fingers = (...points) => points.map(([clientX, clientY]) => ({ clientX, clientY }));

function renderBoard() {
  const { container } = render(<Game2048 />);
  return container.querySelector('.g2048-board-container');
}

function swipe(from, to) {
  const board = renderBoard();
  fireEvent.touchStart(board, { touches: fingers(from) });
  fireEvent.touchEnd(board, { changedTouches: fingers(to) });
  return board;
}

describe('swiping the board', () => {
  test.each([
    ['right', [100, 100], [170, 105], 'right'],
    ['left', [100, 100], [30, 95], 'left'],
    ['down', [100, 100], [105, 170], 'down'],
    ['up', [100, 100], [95, 30], 'up'],
  ])('a swipe %s slides that way', (_name, from, to, expected) => {
    swipe(from, to);
    expect(slide).toHaveBeenCalledTimes(1);
    expect(slide).toHaveBeenCalledWith(expected);
  });

  test('a diagonal swipe slides along whichever axis moved further', () => {
    swipe([100, 100], [160, 125]);
    expect(slide).toHaveBeenCalledWith('right');
  });

  test.each([
    ['a tap with no movement', [100, 100], [100, 100]],
    ['finger jitter of a few pixels', [100, 100], [103, 98]],
    ['a movement just under the minimum', [100, 100], [119, 100]],
  ])('%s does not slide', (_name, from, to) => {
    swipe(from, to);
    expect(slide).not.toHaveBeenCalled();
  });

  test('a movement of exactly the minimum distance does slide', () => {
    swipe([100, 100], [120, 100]);
    expect(slide).toHaveBeenCalledWith('right');
  });

  test('a touch that ends with no start does nothing', () => {
    const board = renderBoard();
    fireEvent.touchEnd(board, { changedTouches: fingers([200, 200]) });
    expect(slide).not.toHaveBeenCalled();
  });

  test('each swipe is used once: a stray second touchend does nothing', () => {
    const board = swipe([100, 100], [170, 100]);
    fireEvent.touchEnd(board, { changedTouches: fingers([300, 300]) });
    expect(slide).toHaveBeenCalledTimes(1);
  });

  test('two fingers (a pinch or a stray palm) cancel the gesture', () => {
    const board = renderBoard();
    fireEvent.touchStart(board, { touches: fingers([100, 100], [200, 200]) });
    fireEvent.touchEnd(board, { changedTouches: fingers([170, 100]) });
    expect(slide).not.toHaveBeenCalled();
  });

  test('a touch cancelled by the system (a call, a gesture) is not a swipe', () => {
    const board = renderBoard();
    fireEvent.touchStart(board, { touches: fingers([100, 100]) });
    fireEvent.touchCancel(board);
    fireEvent.touchEnd(board, { changedTouches: fingers([170, 100]) });
    expect(slide).not.toHaveBeenCalled();
  });

  test('a new gesture after a cancelled one works normally', () => {
    const board = renderBoard();
    fireEvent.touchStart(board, { touches: fingers([100, 100]) });
    fireEvent.touchCancel(board);
    fireEvent.touchStart(board, { touches: fingers([100, 100]) });
    fireEvent.touchEnd(board, { changedTouches: fingers([100, 170]) });
    expect(slide).toHaveBeenCalledWith('down');
  });
});

describe('touching the overlay buttons', () => {
  test('tapping START is a tap, not a swipe, even though the touch bubbles up to the board', () => {
    useGame2048.mockReturnValue({
      board: Array.from({ length: 4 }, () => Array(4).fill(0)),
      score: 0, best: 0, gameState: 'idle',
      startGame: jest.fn(), keepPlaying: jest.fn(), slide, SIZE: 4,
    });
    render(<Game2048 />);
    const button = screen.getByText('▶ START');
    fireEvent.touchStart(button, { touches: fingers([150, 150]) });
    fireEvent.touchEnd(button, { changedTouches: fingers([151, 150]) });
    expect(slide).not.toHaveBeenCalled();
  });
});
