import { render, screen, fireEvent } from '@testing-library/react';
import Minesweeper from './Minesweeper';
import useMinesweeper, { useChord } from './useMinesweeper';

// Same approach as Snake/Tetris component tests: useMinesweeper's real logic
// is already covered by useMinesweeper.test.js, so this file mocks both the
// default hook and the named useChord export to test the presentational
// layer in isolation.
jest.mock('./useMinesweeper', () => ({
  __esModule: true,
  default: jest.fn(),
  useChord: jest.fn(() => jest.fn()),
}));

function baseMockState(overrides = {}) {
  return {
    board: null, difficulty: 'easy', gameState: 'idle', minesLeft: 10,
    time: 0, bestTimes: {}, halfwayCelebrated: false,
    rows: 9, cols: 9,
    resetGame: jest.fn(), handleReveal: jest.fn(),
    handleChordReveal: jest.fn(), handleFlag: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  useMinesweeper.mockReturnValue(baseMockState());
  useChord.mockReturnValue(jest.fn());
});

test('shows the mine count and difficulty buttons', () => {
  render(<Minesweeper />);
  expect(screen.getByText('🟢 EASY')).toBeInTheDocument();
  expect(screen.getByText('🟡 MEDIUM')).toBeInTheDocument();
  expect(screen.getByText('🔴 HARD')).toBeInTheDocument();
});

test('clicking a difficulty button calls resetGame with that difficulty', () => {
  const resetGame = jest.fn();
  useMinesweeper.mockReturnValue(baseMockState({ resetGame }));
  render(<Minesweeper />);
  fireEvent.click(screen.getByText('🔴 HARD'));
  expect(resetGame).toHaveBeenCalledWith('hard');
});

test('clicking the face button starts a new game at the current difficulty', () => {
  const resetGame = jest.fn();
  useMinesweeper.mockReturnValue(baseMockState({ resetGame, difficulty: 'medium' }));
  render(<Minesweeper />);
  fireEvent.click(screen.getByTitle('New game'));
  expect(resetGame).toHaveBeenCalledWith('medium');
});

test('shows the win overlay with time when gameState is won', () => {
  useMinesweeper.mockReturnValue(baseMockState({ gameState: 'won', time: 42, board: [] }));
  render(<Minesweeper />);
  expect(screen.getByText('YOU WIN!')).toBeInTheDocument();
  expect(screen.getByText(/TIME: 42s/)).toBeInTheDocument();
});

test('shows a LEGENDARY WIN headline for a hard-difficulty win', () => {
  useMinesweeper.mockReturnValue(baseMockState({ gameState: 'won', difficulty: 'hard', board: [] }));
  render(<Minesweeper />);
  expect(screen.getByText('LEGENDARY WIN!')).toBeInTheDocument();
});

test('shows the lose overlay when gameState is lost', () => {
  useMinesweeper.mockReturnValue(baseMockState({ gameState: 'lost', time: 15, board: [] }));
  render(<Minesweeper />);
  expect(screen.getByText('BOOM!')).toBeInTheDocument();
});

test('shows the halfway celebration callout when halfwayCelebrated is true', () => {
  useMinesweeper.mockReturnValue(baseMockState({ halfwayCelebrated: true, board: [] }));
  render(<Minesweeper />);
  expect(screen.getByText(/HALFWAY THERE/)).toBeInTheDocument();
});
