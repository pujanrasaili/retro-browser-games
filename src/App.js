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
        </nav>
      </header>
      <main className="app-main">
        {activeGame === 'snake' && <Snake />}
      </main>
    </div>
  );
}

export default App;
