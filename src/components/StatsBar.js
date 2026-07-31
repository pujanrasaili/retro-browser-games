import React, { useState, useEffect } from 'react';
import { formatScore } from '../utils/formatScore';
import { formatTime } from '../utils/formatTime';
import './StatsBar.css';

function readStats() {
  const snakeBest = parseInt(localStorage.getItem('snake_best') || '0', 10);
  const snakeBestLength = parseInt(localStorage.getItem('snake_best_length') || '0', 10);
  const tetrisBest = parseInt(localStorage.getItem('tetris_best') || '0', 10);
  const pongCpuWins = parseInt(localStorage.getItem('pong_cpu_wins') || '0', 10);

  let mineBest = '—';
  try {
    const parsed = JSON.parse(localStorage.getItem('mine_best') || '{}');
    // Show hardest difficulty beaten (Hard > Medium > Easy)
    if (parsed.hard !== undefined) mineBest = `HARD ${formatTime(parsed.hard)}`;
    else if (parsed.medium !== undefined) mineBest = `MED ${formatTime(parsed.medium)}`;
    else if (parsed.easy !== undefined) mineBest = `EASY ${formatTime(parsed.easy)}`;
  } catch {}

  return { snakeBest, snakeBestLength, tetrisBest, mineBest, pongCpuWins };
}

export default function StatsBar() {
  const [stats, setStats] = useState(readStats);

  // Refresh stats whenever the user comes back to this tab/component,
  // since scores are written during gameplay without a page reload.
  useEffect(() => {
    const refresh = () => setStats(readStats());
    const interval = setInterval(refresh, 2000);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const { snakeBest, snakeBestLength, tetrisBest, mineBest, pongCpuWins } = stats;

  const handleReset = () => {
    if (!window.confirm('Reset all best scores for Snake, Tetris, Minesweeper, and Pong? This cannot be undone.')) return;
    localStorage.removeItem('snake_best');
    localStorage.removeItem('snake_best_length');
    localStorage.removeItem('tetris_best');
    localStorage.removeItem('tetris_best_lines');
    localStorage.removeItem('mine_best');
    localStorage.removeItem('pong_cpu_wins');
    setStats(readStats());
  };

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-icon">🐍</span>
        <span className="stat-label pixel-font">SCORE</span>
        <span className="stat-value pixel-font" style={{ color: '#39ff14' }}>{formatScore(snakeBest, 5)}</span>
        {snakeBestLength > 0 && <span className="stat-sublabel pixel-font">LEN {snakeBestLength}</span>}
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-icon">🧱</span>
        <span className="stat-label pixel-font">BEST</span>
        <span className="stat-value pixel-font" style={{ color: '#bf5fff' }}>{formatScore(tetrisBest)}</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-icon">💣</span>
        <span className="stat-label pixel-font">BEST</span>
        <span className="stat-value pixel-font" style={{ color: '#ff8c00' }}>{mineBest}</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-icon">🏓</span>
        <span className="stat-label pixel-font">WINS</span>
        <span className="stat-value pixel-font" style={{ color: '#39ff14' }}>{pongCpuWins}</span>
      </div>
      <div className="stat-divider" />
      <button className="stats-reset-btn pixel-font" onClick={handleReset} title="Reset all best scores">↺</button>
    </div>
  );
}
