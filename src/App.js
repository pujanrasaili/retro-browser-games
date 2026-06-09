import React, { useState } from 'react';
import './App.css';
import Snake from './games/Snake/Snake';

function App() {
  const [activeGame, setActiveGame] = useState('snake');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="pixel-font app-title">🎮 RETRO GAMES</h1>
        <nav className="game-nav">
          <button
            className={`nav-btn ${activeGame === 'snake' ? 'active' : ''}`}
            onClick={() => setActiveGame('snake')}
          >
            🐍 SNAKE
          </button>
          <button className="nav-btn coming-soon" disabled title="Coming soon!">
            🧱 TETRIS
          </button>
          <button className="nav-btn coming-soon" disabled title="Coming soon!">
            💣 MINES
          </button>
        </nav>
      </header>
      <main className="app-main">
        {activeGame === 'snake' && <Snake />}
      </main>
      <footer className="app-footer">
        <span className="pixel-font footer-text">
          MADE BY PUJANRASAILI · 2026
        </span>
      </footer>
    </div>
  );
}

export default App;
