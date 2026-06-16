import React from 'react';
import './StatsBar.css';

export default function StatsBar() {
  const snakeBest   = localStorage.getItem('snake_best')       || '0';
  const tetrisBest  = localStorage.getItem('tetris_best')      || '0';
  const mineBestRaw = localStorage.getItem('mine_best');
  let mineBest = '—';
  if (mineBestRaw) {
    try {
      const parsed = JSON.parse(mineBestRaw);
      const times = Object.entries(parsed).map(([d, t]) => `${d}: ${t}s`);
      if (times.length) mineBest = times[0];
    } catch {}
  }

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
