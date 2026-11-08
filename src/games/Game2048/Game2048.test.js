import { render, screen, fireEvent } from '@testing-library/react';
import Game2048 from './Game2048';
import useGame2048 from './useGame2048';

// The hook's behavior is tested in useGame2048*.test.js. Here it is mocked so each test
// controls exactly what the screen is handed.
jest.mock('./useGame2048');

const blank = () => Array.from({ length: 4 }, () => Array(4).fill(0));

function mockState(overrides = {}) {
  return {
    board: blank(), score: 0, best: 0, gameState: 'playing',
    startGame: jest.fn(), slide: jest.fn(), keepPlaying: jest.fn(), SIZE: 4,
    ...overrides,
  };
}

function renderWith(overrides) {
  useGame2048.mockReturnValue(mockState(overrides));
  return render(<Game2048 />);
}

const allCells = (container) => [...container.querySelectorAll('.g2048-cell')];
const tiles = (container) => [...container.querySelectorAll('.g2048-tile')];

describe('the board', () => {
  test('is a 4x4 grid, empty when there are no tiles', () => {
    const { container } = renderWith();
    expect(allCells(container)).toHaveLength(16);
    expect(tiles(container)).toHaveLength(0);
  });

  test('shows every tile with its number, and leaves empty cells blank', () => {
    const board = blank();
    board[0][0] = 2; board[1][2] = 128; board[3][3] = 16;
    const { container } = renderWith({ board });
    expect(tiles(container).map(t => t.textContent)).toEqual(['2', '128', '16']);
    expect(allCells(container).filter(c => c.textContent === '')).toHaveLength(13);
  });

  test('puts tiles in the right cells (row by row)', () => {
    const board = blank();
    board[1][2] = 64;
    const { container } = renderWith({ board });
    expect(allCells(container)[1 * 4 + 2]).toHaveTextContent('64');
  });

  test('styles each tile by its value', () => {
    const board = blank();
    board[0][0] = 2; board[0][1] = 8; board[0][2] = 1024; board[0][3] = 2048;
    const { container } = renderWith({ board });
    const [t2, t8, t1024, t2048] = tiles(container);
    expect(t2).toHaveClass('g2048-tile-2');
    expect(t8).toHaveClass('g2048-tile-8');
    expect(t1024).toHaveClass('g2048-tile-1024');
    expect(t2048).toHaveClass('g2048-tile-2048');
  });

  test('tiles above 2048 get the shared "super" style', () => {
    const board = blank();
    board[0][0] = 4096; board[0][1] = 131072;
    const { container } = renderWith({ board });
    tiles(container).forEach(t => expect(t).toHaveClass('g2048-tile-super'));
  });

  test('four-digit tiles get the smaller font; shorter ones do not', () => {
    const board = blank();
    board[0][0] = 512; board[0][1] = 1024;
    const { container } = renderWith({ board });
    const [short, long] = tiles(container);
    expect(short).not.toHaveClass('g2048-long');
    expect(long).toHaveClass('g2048-long');
  });

  test('describes each cell for screen readers', () => {
    const board = blank();
    board[0][0] = 32;
    renderWith({ board });
    expect(screen.getByLabelText('Tile 32')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Empty')).toHaveLength(15);
  });
});

describe('the score bar', () => {
  test('shows the score and best score padded to five digits', () => {
    renderWith({ score: 12, best: 1234 });
    expect(screen.getByText('00012')).toBeInTheDocument();
    expect(screen.getByText('01234')).toBeInTheDocument();
  });

  test('the NEW button starts a new game', () => {
    const startGame = jest.fn();
    renderWith({ startGame });
    fireEvent.click(screen.getByTitle('Start a new game'));
    expect(startGame).toHaveBeenCalledTimes(1);
  });
});

describe('the overlays', () => {
  test('there is no overlay while playing', () => {
    renderWith({ gameState: 'playing' });
    expect(screen.queryByText('▶ START')).not.toBeInTheDocument();
    expect(screen.queryByText('GAME OVER')).not.toBeInTheDocument();
    expect(screen.queryByText('YOU MADE 2048!')).not.toBeInTheDocument();
  });

  test('the idle screen shows the title, how to play, and a START button', () => {
    const startGame = jest.fn();
    renderWith({ gameState: 'idle', startGame });
    expect(screen.getByText('2048')).toBeInTheDocument();
    expect(screen.getByText(/ARROWS \/ WASD or SWIPE/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('▶ START'));
    expect(startGame).toHaveBeenCalledTimes(1);
  });

  test('the win screen offers KEEP GOING and NEW GAME', () => {
    const keepPlaying = jest.fn();
    const startGame = jest.fn();
    renderWith({ gameState: 'won', score: 20000, keepPlaying, startGame });
    expect(screen.getByText('YOU MADE 2048!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('KEEP GOING'));
    expect(keepPlaying).toHaveBeenCalledTimes(1);
    expect(startGame).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('NEW GAME'));
    expect(startGame).toHaveBeenCalledTimes(1);
  });

  test('the game-over screen shows the score and a NEW GAME button', () => {
    const startGame = jest.fn();
    renderWith({ gameState: 'over', score: 123, best: 500, startGame });
    expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    expect(screen.getByText('SCORE: 00123')).toBeInTheDocument();
    fireEvent.click(screen.getByText('↺ NEW GAME'));
    expect(startGame).toHaveBeenCalledTimes(1);
  });

  test('a new record is announced only when the score equals a best above zero', () => {
    const { unmount } = renderWith({ gameState: 'over', score: 300, best: 300 });
    expect(screen.getByText(/NEW RECORD/)).toBeInTheDocument();
    unmount();

    const lower = renderWith({ gameState: 'over', score: 100, best: 300 });
    expect(screen.queryByText(/NEW RECORD/)).not.toBeInTheDocument();
    lower.unmount();

    renderWith({ gameState: 'over', score: 0, best: 0 });
    expect(screen.queryByText(/NEW RECORD/)).not.toBeInTheDocument();
  });
});
