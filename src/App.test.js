import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

// First component test in the project. Kept deliberately conservative:
// switching into Pong is avoided here since it drives a canvas +
// requestAnimationFrame game loop, which needs more careful setup
// (mocking canvas context, animation frames) than a first smoke test
// should take on. Snake/Tetris/Minesweeper are lighter to mount since
// they don't render to canvas.

test('renders the app without crashing', () => {
  render(<App />);
  expect(screen.getByText('🎮 RETRO GAMES')).toBeInTheDocument();
});

test('shows all 4 game nav buttons', () => {
  render(<App />);
  const nav = screen.getByRole('navigation');
  expect(within(nav).getByText('🐍 SNAKE')).toBeInTheDocument();
  expect(within(nav).getByText('🧱 TETRIS')).toBeInTheDocument();
  expect(within(nav).getByText('💣 MINES')).toBeInTheDocument();
  expect(within(nav).getByText('🏓 PONG')).toBeInTheDocument();
});

test('Snake is the active game by default', () => {
  render(<App />);
  const nav = screen.getByRole('navigation');
  expect(within(nav).getByText('🐍 SNAKE')).toHaveClass('active');
  expect(within(nav).getByText('🧱 TETRIS')).not.toHaveClass('active');
});

test('clicking the Tetris tab switches the active game', () => {
  render(<App />);
  const nav = screen.getByRole('navigation');
  fireEvent.click(within(nav).getByText('🧱 TETRIS'));
  expect(within(nav).getByText('🧱 TETRIS')).toHaveClass('active');
  expect(within(nav).getByText('🐍 SNAKE')).not.toHaveClass('active');
});

test('clicking the Minesweeper tab switches the active game', () => {
  render(<App />);
  const nav = screen.getByRole('navigation');
  fireEvent.click(within(nav).getByText('💣 MINES'));
  expect(within(nav).getByText('💣 MINES')).toHaveClass('active');
});

test('the mute button toggles its icon when clicked', () => {
  render(<App />);
  const muteBtn = screen.getByTitle(/mute/i);
  const initialText = muteBtn.textContent;
  fireEvent.click(muteBtn);
  expect(muteBtn.textContent).not.toBe(initialText);
});
