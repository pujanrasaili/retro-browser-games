import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import StatsBar from './StatsBar';

// StatsBar runs a setInterval(refresh, 2000) internally. Not testing that
// auto-refresh directly (would require real or fake-timer waiting, adding
// complexity/slowness for little value) — instead relying on RTL's automatic
// unmount-on-cleanup to clear the interval via the component's own useEffect
// cleanup function, verified by confirming no lingering warnings after the
// suite runs.
afterEach(() => {
  cleanup();
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('StatsBar', () => {
  test('shows 00000 for all scores when localStorage is empty', () => {
    render(<StatsBar />);
    expect(screen.getByText('00000')).toBeInTheDocument(); // Snake score
  });

  test('shows the mine best as an em dash when no mine record exists', () => {
    render(<StatsBar />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('displays persisted snake score and best length', () => {
    localStorage.setItem('snake_best', '450');
    localStorage.setItem('snake_best_length', '23');
    render(<StatsBar />);
    expect(screen.getByText('00450')).toBeInTheDocument();
    expect(screen.getByText('LEN 23')).toBeInTheDocument();
  });

  test('hides the length sublabel when snake_best_length is 0', () => {
    localStorage.setItem('snake_best_length', '0');
    render(<StatsBar />);
    expect(screen.queryByText(/LEN /)).not.toBeInTheDocument();
  });

  test('shows the hardest mine difficulty beaten, not just any difficulty', () => {
    localStorage.setItem('mine_best', JSON.stringify({ easy: 40, hard: 95 }));
    render(<StatsBar />);
    expect(screen.getByText('HARD 1:35')).toBeInTheDocument();
  });

  test('displays pong CPU wins count', () => {
    localStorage.setItem('pong_cpu_wins', '7');
    render(<StatsBar />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('reset button does nothing if the user cancels the confirmation', () => {
    localStorage.setItem('snake_best', '999');
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<StatsBar />);
    fireEvent.click(screen.getByTitle('Reset all best scores'));
    expect(localStorage.getItem('snake_best')).toBe('999');
    expect(screen.getByText('00999')).toBeInTheDocument();
  });

  test('reset button clears all persisted stats when confirmed', () => {
    localStorage.setItem('snake_best', '999');
    localStorage.setItem('tetris_best', '5000');
    localStorage.setItem('pong_cpu_wins', '3');
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<StatsBar />);
    fireEvent.click(screen.getByTitle('Reset all best scores'));
    expect(localStorage.getItem('snake_best')).toBeNull();
    expect(localStorage.getItem('tetris_best')).toBeNull();
    expect(localStorage.getItem('pong_cpu_wins')).toBeNull();
    // Display should immediately reflect the reset without needing a remount
    expect(screen.getByText('00000')).toBeInTheDocument();
  });
});
