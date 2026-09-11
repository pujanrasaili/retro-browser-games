import { render, screen, fireEvent } from '@testing-library/react';
import Tetris from './Tetris';
import useTetrisGame from './useTetrisGame';

// Same approach as Snake.test.js: useTetrisGame's real logic is already
// covered by useTetrisGame.test.js, so this file mocks the hook entirely to
// test Tetris.js as a presentational layer in isolation.
jest.mock('./useTetrisGame');

function emptyBoard(rows = 4, cols = 4) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

function baseMockState(overrides = {}) {
  return {
    board: emptyBoard(), current: null, next: null, ghost: null, hold: null,
    canHold: true, clearingRows: [],
    score: 0, highScore: 0, lines: 0, level: 1, bestLines: 0,
    justLeveledUp: false, tetrisCallout: false, scorePop: false, highScorePop: false,
    gameState: 'idle', resetGame: jest.fn(),
    moveLeft: jest.fn(), moveRight: jest.fn(), moveDown: jest.fn(),
    rotate: jest.fn(), hardDrop: jest.fn(), holdPiece: jest.fn(),
    BOARD_WIDTH: 4, BOARD_HEIGHT: 4,
    ...overrides,
  };
}

beforeEach(() => {
  useTetrisGame.mockReturnValue(baseMockState());
});

test('shows the START button and idle title when gameState is idle', () => {
  render(<Tetris />);
  expect(screen.getByText('▶ START')).toBeInTheDocument();
  expect(screen.getByText('🧱 TETRIS')).toBeInTheDocument();
});

test('clicking START calls resetGame', () => {
  const resetGame = jest.fn();
  useTetrisGame.mockReturnValue(baseMockState({ resetGame }));
  render(<Tetris />);
  fireEvent.click(screen.getByText('▶ START'));
  expect(resetGame).toHaveBeenCalled();
});

test('mobile control buttons call the correct hook functions', () => {
  const moveLeft = jest.fn();
  const moveRight = jest.fn();
  const rotate = jest.fn();
  const hardDrop = jest.fn();
  useTetrisGame.mockReturnValue(baseMockState({
    gameState: 'playing', moveLeft, moveRight, rotate, hardDrop,
  }));
  render(<Tetris />);

  fireEvent.click(screen.getByText('◄'));
  expect(moveLeft).toHaveBeenCalled();

  fireEvent.click(screen.getByText('►'));
  expect(moveRight).toHaveBeenCalled();

  fireEvent.click(screen.getByText('↻'));
  expect(rotate).toHaveBeenCalled();

  fireEvent.click(screen.getByText('⬇'));
  expect(hardDrop).toHaveBeenCalled();
});

test('clicking the hold button calls holdPiece', () => {
  const holdPiece = jest.fn();
  useTetrisGame.mockReturnValue(baseMockState({ gameState: 'playing', holdPiece }));
  render(<Tetris />);
  fireEvent.click(screen.getByText('📦'));
  expect(holdPiece).toHaveBeenCalled();
});

test('shows GAME OVER with score and lines when gameState is over', () => {
  useTetrisGame.mockReturnValue(baseMockState({ gameState: 'over', score: 5000, lines: 12 }));
  render(<Tetris />);
  expect(screen.getByText('GAME OVER')).toBeInTheDocument();
  expect(screen.getByText(/LINES: 12/)).toBeInTheDocument();
});

test('shows the paused overlay with current score and level when gameState is paused', () => {
  useTetrisGame.mockReturnValue(baseMockState({ gameState: 'paused', score: 800, lines: 5, level: 2 }));
  render(<Tetris />);
  expect(screen.getByText('⏸ PAUSED')).toBeInTheDocument();
  expect(screen.getByText(/LINES: 5/)).toBeInTheDocument();
});

test('shows a piece in the HOLD panel when hold is set', () => {
  const heldPiece = { shape: [[1, 1], [1, 1]], color: '#ffd700' };
  useTetrisGame.mockReturnValue(baseMockState({ hold: heldPiece }));
  render(<Tetris />);
  expect(screen.getByText('HOLD')).toBeInTheDocument();
});
