import { render, fireEvent } from '@testing-library/react';
import Minesweeper from './Minesweeper';
import useMinesweeper, { useChord } from './useMinesweeper';
import { NUM_COLORS } from './mineUtils';
import { buildFixtureBoard } from './testFixtures';

// Minesweeper.test.js covers the overlays and buttons with no board on screen. This
// file covers what the board itself draws and how its cells respond to the mouse,
// using real fixture boards. The hook is mocked so each test controls exactly what
// the component is handed; its real behavior is tested in useMinesweeper*.test.js.
jest.mock('./useMinesweeper', () => ({
  __esModule: true,
  default: jest.fn(),
  useChord: jest.fn(),
}));

function mockState(overrides = {}) {
  return {
    board: null, difficulty: 'easy', gameState: 'idle', minesLeft: 10, time: 0,
    bestTimes: {}, halfwayCelebrated: false, rows: 9, cols: 9,
    resetGame: jest.fn(), handleReveal: jest.fn(),
    handleChordReveal: jest.fn(), handleFlag: jest.fn(),
    ...overrides,
  };
}

// The board is a 9x9 grid of .mcell elements in row-major order.
const cellAt = (container, r, c) => container.querySelectorAll('.mcell')[r * 9 + c];

let chord;
beforeEach(() => {
  chord = jest.fn();
  useChord.mockReturnValue(chord);
  useMinesweeper.mockReturnValue(mockState());
});

describe('before the first click (no board yet)', () => {
  test('shows a full grid of hidden cells', () => {
    const { container } = render(<Minesweeper />);
    const cells = container.querySelectorAll('.mcell');
    expect(cells).toHaveLength(81);
    expect([...cells].every(cell => cell.classList.contains('hidden'))).toBe(true);
  });

  test('left-clicking a cell reveals it, by row and column', () => {
    const handleReveal = jest.fn();
    useMinesweeper.mockReturnValue(mockState({ handleReveal }));
    const { container } = render(<Minesweeper />);
    fireEvent.click(cellAt(container, 2, 3));
    expect(handleReveal).toHaveBeenCalledWith(2, 3);
  });

  test('right-clicking a cell flags it, by row and column', () => {
    const handleFlag = jest.fn();
    useMinesweeper.mockReturnValue(mockState({ handleFlag }));
    const { container } = render(<Minesweeper />);
    fireEvent.contextMenu(cellAt(container, 5, 6));
    expect(handleFlag).toHaveBeenCalledWith(expect.any(Object), 5, 6);
  });
});

describe('with a board in play', () => {
  function playingBoard() {
    const board = buildFixtureBoard();
    board[4][7].revealed = true;                          // a 3
    board[4][0].revealed = true;                          // a 0
    board[0][0].flagged = true;                           // player's flag
    board[1][8].revealed = true;                          // a revealed mine
    board[2][8].revealed = true; board[2][8].exploded = true; // the mine that was hit
    return board;
  }

  function renderPlaying(overrides = {}) {
    useMinesweeper.mockReturnValue(mockState({
      board: playingBoard(), gameState: 'playing', ...overrides,
    }));
    return render(<Minesweeper />);
  }

  test('a revealed number shows its value in that number\'s color', () => {
    const { container } = renderPlaying();
    const cell = cellAt(container, 4, 7);
    expect(cell).toHaveTextContent('3');
    expect(cell).toHaveClass('revealed');
    expect(cell).toHaveStyle({ color: NUM_COLORS[3] });
  });

  test('a revealed zero is blank', () => {
    const { container } = renderPlaying();
    const cell = cellAt(container, 4, 0);
    expect(cell).toHaveClass('revealed');
    expect(cell).toBeEmptyDOMElement();
  });

  test('a flagged cell shows a flag', () => {
    const { container } = renderPlaying();
    const cell = cellAt(container, 0, 0);
    expect(cell).toHaveTextContent('🚩');
    expect(cell).toHaveClass('flagged');
  });

  test('a revealed mine shows a bomb, and the one that was hit shows an explosion', () => {
    const { container } = renderPlaying();
    expect(cellAt(container, 1, 8)).toHaveTextContent('💣');
    expect(cellAt(container, 2, 8)).toHaveTextContent('💥');
    expect(cellAt(container, 2, 8)).toHaveClass('exploded');
  });

  test('an unrevealed mine looks exactly like any other hidden cell', () => {
    // (3,8) is a mine nobody has touched. If it looked different the board would
    // give away where the mines are.
    const { container } = renderPlaying();
    const mine = cellAt(container, 3, 8);
    const plain = cellAt(container, 6, 3);
    expect(mine).toHaveClass('hidden');
    expect(mine).toBeEmptyDOMElement();
    expect(mine.className).toBe(plain.className);
  });

  test('clicks, double-clicks and right-clicks reach the right handlers with the cell\'s position', () => {
    const handleReveal = jest.fn();
    const handleFlag = jest.fn();
    const { container } = renderPlaying({ handleReveal, handleFlag });
    const cell = cellAt(container, 4, 7);
    fireEvent.click(cell);
    fireEvent.doubleClick(cell);
    fireEvent.contextMenu(cell);
    expect(handleReveal).toHaveBeenCalledWith(4, 7);
    expect(chord).toHaveBeenCalledWith(4, 7);
    expect(handleFlag).toHaveBeenCalledWith(expect.any(Object), 4, 7);
  });
});

describe('after winning', () => {
  test('the mines still hidden are shown as flags', () => {
    const board = buildFixtureBoard();
    board.flat().filter(cell => !cell.mine).forEach(cell => { cell.revealed = true; });
    useMinesweeper.mockReturnValue(mockState({ board, gameState: 'won' }));
    const { container } = render(<Minesweeper />);
    const mine = cellAt(container, 3, 8);
    expect(mine).toHaveTextContent('🚩');
    expect(mine).toHaveClass('win-flag');
  });
});
