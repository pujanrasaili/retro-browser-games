import React, { useState, useEffect } from 'react';
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
        <span className="stat-value pixel-font" style={{ color: '#bf5fff' }}>{String(tetrisBest).padStart(6,'0')}</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <span className="stat-icon">💣</span>
        <span className="stat-label pixel-font">BEST</span>
        <span className="stat-value pixel-font" style={{ color: '#ff8c00' }}>{mineBest}</span>
      </div>
    </div>
  );
}
