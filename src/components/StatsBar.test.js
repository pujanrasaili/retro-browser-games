import { render, screen, fireEvent, cleanup, within, renderHook, act } from '@testing-library/react';
import StatsBar from './StatsBar';
import useGame2048 from '../games/Game2048/useGame2048';

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

describe('the 2048 best score', () => {
  // The 2048 item is found by its icon, since its value looks like Tetris's.
  const item2048 = () => screen.getByText('🔢').parentElement;

  test('shows the saved best score, padded like the other big scores', () => {
    localStorage.setItem('game2048_best', '2048');
    render(<StatsBar />);
    expect(within(item2048()).getByText('002048')).toBeInTheDocument();
  });

  test('shows zero when nothing is saved', () => {
    render(<StatsBar />);
    expect(within(item2048()).getByText('000000')).toBeInTheDocument();
  });

  test.each(['abc', '-50', '0'])('treats a saved value of %j as zero, never NaN', (saved) => {
    localStorage.setItem('game2048_best', saved);
    render(<StatsBar />);
    expect(within(item2048()).getByText('000000')).toBeInTheDocument();
    expect(item2048()).not.toHaveTextContent('NaN');
  });

  test('is cleared by the reset button along with the other best scores', () => {
    localStorage.setItem('game2048_best', '5000');
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<StatsBar />);
    fireEvent.click(screen.getByTitle('Reset all best scores'));
    expect(localStorage.getItem('game2048_best')).toBeNull();
    expect(within(item2048()).getByText('000000')).toBeInTheDocument();
  });

  test('is left alone when the reset is cancelled', () => {
    localStorage.setItem('game2048_best', '5000');
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<StatsBar />);
    fireEvent.click(screen.getByTitle('Reset all best scores'));
    expect(localStorage.getItem('game2048_best')).toBe('5000');
  });

  test('shows what the real 2048 game saves, end to end', () => {
    // Play one real merge through the actual hook, then check the stats bar displays what it
    // saved. Both files already assert the storage key in their own tests, so this overlaps
    // with them; what it adds is one check that the saved value and its display agree.
    const start = Array.from({ length: 4 }, () => Array(4).fill(0));
    start[0] = [2, 2, 0, 0];
    const { result } = renderHook(() => useGame2048({ random: () => 0, createBoard: () => start }));
    act(() => result.current.startGame());
    act(() => { result.current.slide('left'); }); // 2 + 2 scores 4
    expect(localStorage.getItem('game2048_best')).toBe('4');
    render(<StatsBar />);
    expect(within(item2048()).getByText('000004')).toBeInTheDocument();
  });
});
