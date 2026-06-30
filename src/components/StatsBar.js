import React, { useState, useEffect } from 'react';
import { formatScore } from '../utils/formatScore';
import './StatsBar.css';

function readStats() {
  const snakeBest = parseInt(localStorage.getItem('snake_best') || '0', 10);
  const tetrisBest = parseInt(localStorage.getItem('tetris_best') || '0', 10);

  let mineBest = '—';
  try {
    const parsed = JSON.parse(localStorage.getItem('mine_best') || '{}');
    if (parsed.easy !== undefined) mineBest = `EASY ${parsed.easy}s`;
    else {
      const entries = Object.entries(parsed);
      if (entries.length) mineBest = `${entries[0][0].toUpperCase()} ${entries[0][1]}s`;
    }
  } catch {}

  return { snakeBest, tetrisBest, mineBest };
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

  const { snakeBest, tetrisBest, mineBest } = stats;

  const handleReset = () => {
    if (!window.confirm('Reset all best scores for Snake, Tetris, and Minesweeper? This cannot be undone.')) return;
    localStorage.removeItem('snake_best');
    localStorage.removeItem('tetris_best');
    localStorage.removeItem('tetris_best_lines');
    localStorage.removeItem('mine_best');
    setStats(readStats());
  };

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-icon">🐍</span>
        <span className="stat-label pixel-font">BEST</span>
        <span className="stat-value pixel-font" style={{ color: '#39ff14' }}>{String(snakeBest).padStart(5,'0')}</span>
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
      <button className="stats-reset-btn pixel-font" onClick={handleReset} title="Reset all best scores">↺</button>
    </div>
  );
}
