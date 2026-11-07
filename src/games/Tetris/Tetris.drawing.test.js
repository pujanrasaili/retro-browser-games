import { render, screen } from '@testing-library/react';
import Tetris from './Tetris';
import useTetrisGame from './useTetrisGame';

// Tetris.test.js covers buttons and overlays with no piece on screen (current: null).
// This file covers what the board and the next/hold panels actually draw. The hook is
// mocked so each test controls exactly what the component is handed.
jest.mock('./useTetrisGame');

const COLS = 5;
const ROWS = 6;
const T_SHAPE = [[0, 1, 0], [1, 1, 1]];
const PURPLE = '#bf5fff';

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const piece = (overrides = {}) => ({
  key: 'T', shape: T_SHAPE, color: PURPLE, shadow: 'rgba(191, 95, 255, 0.4)', x: 1, y: 0,
  ...overrides,
});

function mockState(overrides = {}) {
  return {
    board: emptyBoard(), current: null, next: null, ghost: null, hold: null,
    canHold: true, clearingRows: [],
    score: 0, highScore: 0, lines: 0, level: 1, bestLines: 0,
    justLeveledUp: false, tetrisCallout: false, scorePop: false, highScorePop: false,
    gameState: 'playing', resetGame: jest.fn(),
    moveLeft: jest.fn(), moveRight: jest.fn(), moveDown: jest.fn(),
    rotate: jest.fn(), hardDrop: jest.fn(), holdPiece: jest.fn(),
    BOARD_WIDTH: COLS, BOARD_HEIGHT: ROWS,
    ...overrides,
  };
}

// The board is a ROWS x COLS grid of .tcell elements in row-major order.
const boardCells = (container) => [...container.querySelectorAll('.tcell')];
const cellAt = (container, r, c) => boardCells(container)[r * COLS + c];
const filled = (container) => boardCells(container).filter(c => c.classList.contains('filled'));
const ghosts = (container) => boardCells(container).filter(c => c.classList.contains('ghost'));
const miniCellsIn = (label) =>
  [...screen.getByText(label).parentElement.querySelectorAll('.mini-cell')];
const coloredMiniCells = (label) => miniCellsIn(label).filter(c => c.style.backgroundColor !== '');

function renderWith(overrides) {
  useTetrisGame.mockReturnValue(mockState(overrides));
  return render(<Tetris />);
}

describe('the falling piece', () => {
  test('is drawn on the board in its color while playing', () => {
    const { container } = renderWith({ current: piece({ x: 1, y: 0 }) });
    // T at x=1,y=0 covers (0,2) and (1,1),(1,2),(1,3)
    expect(filled(container)).toHaveLength(4);
    [[0, 2], [1, 1], [1, 2], [1, 3]].forEach(([r, c]) => {
      expect(cellAt(container, r, c)).toHaveClass('filled');
      expect(cellAt(container, r, c)).toHaveStyle({ backgroundColor: PURPLE });
    });
  });

  test.each(['idle', 'paused', 'over'])('is not drawn when the game is %s', (gameState) => {
    const { container } = renderWith({ current: piece(), gameState });
    expect(filled(container)).toHaveLength(0);
  });

  test('is clipped at the top edge instead of crashing', () => {
    const { container } = renderWith({ current: piece({ x: 1, y: -1 }) });
    // the top row of the shape is above the board; only the bottom row (3 cells) shows
    expect(filled(container)).toHaveLength(3);
  });

  test('is clipped at the right edge instead of crashing', () => {
    const { container } = renderWith({ current: piece({ x: 4, y: 0 }) });
    // only the column at x=4 is inside the 5-wide board
    expect(filled(container)).toHaveLength(1);
    expect(cellAt(container, 1, 4)).toHaveClass('filled');
  });
});

describe('locked cells', () => {
  test('are drawn in the color they were locked with', () => {
    const board = emptyBoard();
    board[5][0] = { color: '#ff4757', shadow: 'x' };
    const { container } = renderWith({ board, gameState: 'idle' });
    expect(cellAt(container, 5, 0)).toHaveClass('filled');
    expect(cellAt(container, 5, 0)).toHaveStyle({ backgroundColor: '#ff4757' });
  });

  test('in rows being cleared are marked for the flash animation', () => {
    const { container } = renderWith({ clearingRows: [5] });
    [0, 1, 2, 3, 4].forEach(c => expect(cellAt(container, 5, c)).toHaveClass('clearing'));
    expect(cellAt(container, 4, 0)).not.toHaveClass('clearing');
  });
});

describe('the ghost piece', () => {
  test('shows where the piece will land while playing', () => {
    const { container } = renderWith({ ghost: piece({ x: 1, y: 4 }) });
    // T at x=1,y=4 covers (4,2) and (5,1),(5,2),(5,3)
    expect(ghosts(container)).toHaveLength(4);
    expect(cellAt(container, 5, 2)).toHaveClass('ghost');
    expect(cellAt(container, 5, 2)).toHaveStyle({ opacity: '0.25' });
  });

  test('is not drawn when the game is not playing', () => {
    const { container } = renderWith({ ghost: piece({ x: 1, y: 4 }), gameState: 'paused' });
    expect(ghosts(container)).toHaveLength(0);
  });

  test('never covers a cell that is already locked', () => {
    const board = emptyBoard();
    board[5][2] = { color: '#ff4757', shadow: 'x' };
    const { container } = renderWith({ board, ghost: piece({ x: 1, y: 4 }) });
    expect(cellAt(container, 5, 2)).toHaveClass('filled');
    expect(cellAt(container, 5, 2)).not.toHaveClass('ghost');
    expect(ghosts(container)).toHaveLength(3); // the other 3 ghost cells still show
  });

  test('is drawn underneath the falling piece where the two overlap', () => {
    // current at y=0 covers (0,2),(1,1),(1,2),(1,3); ghost at y=1 covers
    // (1,2),(2,1),(2,2),(2,3). They share exactly (1,2), which must show the piece.
    const { container } = renderWith({
      current: piece({ x: 1, y: 0 }), ghost: piece({ x: 1, y: 1 }),
    });
    expect(cellAt(container, 1, 2)).toHaveClass('filled');
    expect(cellAt(container, 1, 2)).not.toHaveClass('ghost');
    expect(ghosts(container)).toHaveLength(3);
    expect(filled(container)).toHaveLength(4);
  });
});

describe('the NEXT and HOLD previews', () => {
  test('NEXT draws the upcoming piece in its color', () => {
    renderWith({ next: piece({ shape: T_SHAPE }) });
    // a T-piece has 4 filled squares out of a 2x3 preview grid
    expect(miniCellsIn('NEXT')).toHaveLength(6);
    const colored = coloredMiniCells('NEXT');
    expect(colored).toHaveLength(4);
    colored.forEach(c => expect(c).toHaveStyle({ backgroundColor: PURPLE }));
  });

  test('HOLD draws the held piece in its color when it can be used', () => {
    renderWith({ hold: piece(), canHold: true });
    const colored = coloredMiniCells('HOLD');
    expect(colored).toHaveLength(4);
    colored.forEach(c => expect(c).toHaveStyle({ backgroundColor: PURPLE }));
  });

  test('HOLD is greyed out once the hold has been used for this piece', () => {
    renderWith({ hold: piece(), canHold: false });
    const colored = coloredMiniCells('HOLD');
    expect(colored).toHaveLength(4);
    colored.forEach(c => expect(c).toHaveStyle({ backgroundColor: '#2a2a3a' }));
  });

  test('HOLD shows the key hint when nothing is held', () => {
    renderWith({ hold: null });
    expect(screen.getByText('C / SHIFT')).toBeInTheDocument();
  });
});
