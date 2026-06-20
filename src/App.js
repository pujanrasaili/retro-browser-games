import React, { useState } from 'react';
import './App.css';
import Snake from './games/Snake/Snake';
import Tetris from './games/Tetris/Tetris';
import Minesweeper from './games/Minesweeper/Minesweeper';
import StatsBar from './components/StatsBar';
import { isMuted, toggleMuted } from './utils/sound';

function App() {
  const [activeGame, setActiveGame] = useState('snake');
  const [muted, setMutedState] = useState(isMuted);

  const handleMuteToggle = () => {
    const newMuted = toggleMuted();
    setMutedState(newMuted);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="title-row">
          <h1 className="pixel-font app-title">🎮 RETRO GAMES</h1>
          <button className="mute-btn" onClick={handleMuteToggle} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
        <nav className="game-nav">
          <button className={`nav-btn ${activeGame === 'snake' ? 'active' : ''}`} onClick={() => setActiveGame('snake')}>🐍 SNAKE</button>
          <button className={`nav-btn ${activeGame === 'tetris' ? 'active' : ''}`} onClick={() => setActiveGame('tetris')}>🧱 TETRIS</button>
          <button className={`nav-btn ${activeGame === 'mines' ? 'active' : ''}`} onClick={() => setActiveGame('mines')}>💣 MINES</button>
        </nav>
        <StatsBar />
      </header>
      <main className="app-main" key={activeGame}>
        {activeGame === 'snake' && <Snake />}
        {activeGame === 'tetris' && <Tetris />}
        {activeGame === 'mines' && <Minesweeper />}
      </main>
      <footer className="app-footer">
        <span className="pixel-font footer-text">MADE BY PUJANRASAILI · 2026</span>
      </footer>
    </div>
  );
}

export default App;
