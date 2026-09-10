import { render, screen, fireEvent } from '@testing-library/react';
import Snake from './Snake';
import useSnakeGame, { DIFFICULTIES } from './useSnakeGame';

// Snake's actual game logic (movement, collision, difficulty persistence) is
// already covered by useSnakeGame.test.js. This file tests the presentational
// layer in isolation by mocking the hook entirely — verifying the component
// renders the right things and calls the right hook functions with the right
// arguments, without re-testing logic already covered elsewhere.
jest.mock('./useSnakeGame', () => {
  const actualModule = jest.requireActual('./useSnakeGame');
  return {
    __esModule: true,
    default: jest.fn(),
    DIFFICULTIES: actualModule.DIFFICULTIES,
  };
});

function baseMockState(overrides = {}) {
  return {
    snake: [], food: { x: 5, y: 5 }, score: 0, highScore: 0, bestLength: 0,
    gameState: 'idle', speed: DIFFICULTIES.medium.speed, eatBurst: null,
    milestone: null, scoreBump: false,
    difficulty: 'medium', setDifficulty: jest.fn(), walls: false, setWalls: jest.fn(),
    resetGame: jest.fn(), setDirection: jest.fn(), BOARD_SIZE: 20,
    ...overrides,
  };
}

beforeEach(() => {
  useSnakeGame.mockReturnValue(baseMockState());
});

test('shows the START button and idle title when gameState is idle', () => {
  render(<Snake />);
  expect(screen.getByText('▶ START')).toBeInTheDocument();
  expect(screen.getByText('🐍 SNAKE')).toBeInTheDocument();
});

test('clicking START calls resetGame with the current difficulty and walls setting', () => {
  const resetGame = jest.fn();
  useSnakeGame.mockReturnValue(baseMockState({ resetGame, difficulty: 'hard', walls: true }));
  render(<Snake />);
  fireEvent.click(screen.getByText('▶ START'));
  expect(resetGame).toHaveBeenCalledWith('hard', true);
});

test('each D-pad direction button calls setDirection with the correct vector', () => {
  const setDirection = jest.fn();
  useSnakeGame.mockReturnValue(baseMockState({ setDirection, gameState: 'playing' }));
  render(<Snake />);

  fireEvent.click(screen.getByText('▲'));
  expect(setDirection).toHaveBeenLastCalledWith({ x: 0, y: -1 });

  fireEvent.click(screen.getByText('◄'));
  expect(setDirection).toHaveBeenLastCalledWith({ x: -1, y: 0 });

  fireEvent.click(screen.getByText('▼'));
  expect(setDirection).toHaveBeenLastCalledWith({ x: 0, y: 1 });

  fireEvent.click(screen.getByText('►'));
  expect(setDirection).toHaveBeenLastCalledWith({ x: 1, y: 0 });
});

test('shows GAME OVER and the score when gameState is over', () => {
  useSnakeGame.mockReturnValue(baseMockState({ gameState: 'over', score: 250 }));
  render(<Snake />);
  expect(screen.getByText('GAME OVER')).toBeInTheDocument();
  // The score also appears in the persistent score bar above the board, so
  // matching the full "SCORE: 00250" overlay text avoids that ambiguity
  // rather than matching the bare "00250" substring alone.
  expect(screen.getByText('SCORE: 00250')).toBeInTheDocument();
});

test('shows a NEW RECORD badge when score equals a nonzero high score on game over', () => {
  useSnakeGame.mockReturnValue(baseMockState({ gameState: 'over', score: 300, highScore: 300 }));
  render(<Snake />);
  expect(screen.getByText(/NEW RECORD/)).toBeInTheDocument();
});

test('does not show a NEW RECORD badge when score is below the high score', () => {
  useSnakeGame.mockReturnValue(baseMockState({ gameState: 'over', score: 100, highScore: 300 }));
  render(<Snake />);
  expect(screen.queryByText(/NEW RECORD/)).not.toBeInTheDocument();
});

test('clicking a difficulty button calls setDifficulty with the right value', () => {
  const setDifficulty = jest.fn();
  useSnakeGame.mockReturnValue(baseMockState({ setDifficulty }));
  render(<Snake />);
  fireEvent.click(screen.getByText(DIFFICULTIES.hard.label));
  expect(setDifficulty).toHaveBeenCalledWith('hard');
});
