import { render, screen, fireEvent } from '@testing-library/react';
import Pong from './Pong';
import usePongGame from './usePongGame';

// Same isolation approach as the other 3 games' component tests. Pong has an
// extra environment problem the others don't: its canvas-drawing useEffect
// calls canvasRef.current.getContext('2d') unconditionally with no null
// guard, and confirmed empirically (via a throwaway probe test) that plain
// jsdom's getContext('2d') returns null rather than a real 2D context —
// this crashes the component on mount with "Cannot read properties of null
// (reading 'clearRect')" regardless of how usePongGame is mocked, since the
// draw loop is independent code that doesn't touch the hook's return value.
// Stubbing getContext to return a fake context object with no-op methods
// (only the ones the draw function actually calls, verified via grep against
// the real source rather than guessing) avoids the crash without needing to
// install a full canvas-rendering library for tests that don't care about
// actual pixels.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: () => {}, fillRect: () => {}, beginPath: () => {},
    moveTo: () => {}, lineTo: () => {}, stroke: () => {}, setLineDash: () => {},
    fillStyle: '', strokeStyle: '', lineWidth: 0, shadowColor: '', shadowBlur: 0,
  });
});

jest.mock('./usePongGame');

function baseMockState(overrides = {}) {
  return {
    leftScore: 0, rightScore: 0, gameState: 'idle', winner: null,
    mode: 'ai', cpuWins: 0, aiDifficulty: 'medium', setAiDifficulty: jest.fn(),
    leftScorePop: false, rightScorePop: false,
    stateRef: { current: { leftY: 0, rightY: 0, ballX: 0, ballY: 0, ballVX: 0, ballVY: 0 } },
    resetGame: jest.fn(), setMode: jest.fn(),
    CANVAS_WIDTH: 600, CANVAS_HEIGHT: 450, PADDLE_WIDTH: 10, PADDLE_HEIGHT: 70,
    BALL_SIZE: 8, WINNING_SCORE: 7,
    ...overrides,
  };
}

beforeEach(() => {
  usePongGame.mockReturnValue(baseMockState());
});

test('shows mode selection buttons on the idle screen', () => {
  render(<Pong />);
  expect(screen.getByText('▶ VS CPU')).toBeInTheDocument();
  expect(screen.getByText('▶ 2 PLAYER')).toBeInTheDocument();
});

test('clicking VS CPU calls resetGame with ai mode', () => {
  const resetGame = jest.fn();
  usePongGame.mockReturnValue(baseMockState({ resetGame }));
  render(<Pong />);
  fireEvent.click(screen.getByText('▶ VS CPU'));
  expect(resetGame).toHaveBeenCalledWith('ai');
});

test('clicking 2 PLAYER calls resetGame with 2p mode', () => {
  const resetGame = jest.fn();
  usePongGame.mockReturnValue(baseMockState({ resetGame }));
  render(<Pong />);
  fireEvent.click(screen.getByText('▶ 2 PLAYER'));
  expect(resetGame).toHaveBeenCalledWith('2p');
});

test('shows MATCH POINT when a score is one away from winning', () => {
  usePongGame.mockReturnValue(baseMockState({ gameState: 'playing', leftScore: 6 }));
  render(<Pong />);
  expect(screen.getByText('MATCH POINT')).toBeInTheDocument();
});

test('does not show MATCH POINT when no score is close to winning', () => {
  usePongGame.mockReturnValue(baseMockState({ gameState: 'playing', leftScore: 2, rightScore: 3 }));
  render(<Pong />);
  expect(screen.queryByText('MATCH POINT')).not.toBeInTheDocument();
});

test('shows LEGENDARY WIN for a hard-difficulty AI win', () => {
  usePongGame.mockReturnValue(baseMockState({
    gameState: 'over', winner: 'left', mode: 'ai', aiDifficulty: 'hard',
  }));
  render(<Pong />);
  expect(screen.getByText('🏆 LEGENDARY WIN!')).toBeInTheDocument();
});

test('shows CPU WINS when the AI beats the player', () => {
  usePongGame.mockReturnValue(baseMockState({ gameState: 'over', winner: 'right', mode: 'ai' }));
  render(<Pong />);
  expect(screen.getByText('💻 CPU WINS')).toBeInTheDocument();
});
