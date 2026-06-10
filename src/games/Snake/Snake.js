import React, { useRef } from 'react';
import useSnakeGame from './useSnakeGame';
import './Snake.css';

const INITIAL_SPEED = 150;
const MIN_SPEED = 60;
const SPEED_LEVELS = 5;

function getSpeedLevel(speed) {
  const range = INITIAL_SPEED - MIN_SPEED;
  const step = range / SPEED_LEVELS;
  return Math.min(SPEED_LEVELS, Math.floor((INITIAL_SPEED - speed) / step) + 1);
}

export default function Snake() {
  const { snake, food, score, highScore, gameState, resetGame, setDirection, BOARD_SIZE, speed } = useSnakeGame();
  const boardRef = useRef(null);

  const isSnakeHead = (x, y) => snake[0].x === x && snake[0].y === y;
  const isSnakeBody = (x, y) => snake.slice(1).some(s => s.x === x && s.y === y);
  const isFood = (x, y) => food.x === x && food.y === y;
  const getSnakeIndex = (x, y) => snake.findIndex(s => s.x === x && s.y === y);

  const speedLevel = getSpeedLevel(speed);

  // Swipe support
  const touchStart = useRef(null);
  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
    } else {
      setDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
    }
    touchStart.current = null;
  };

  const handleDir = (dir) => {
    setDirection(dir);
    if (gameState === 'idle' || gameState === 'over') resetGame();
  };

  return (
    <div className="snake-wrapper">
      {/* Score Bar */}
      <div className="score-bar">
        <div className="score-item">
          <span className="score-label pixel-font">SCORE</span>
          <span className="score-value pixel-font">{String(score).padStart(5, '0')}</span>
        </div>

        <div className="speed-indicator">
          {Array.from({ length: SPEED_LEVELS }, (_, i) => (
            <div key={i} className={`speed-dot ${i < speedLevel ? 'active' : ''}`} />
          ))}
        </div>

        <div className="score-item">
          <span className="score-label pixel-font">BEST</span>
          <span className="score-value hi pixel-font">{String(highScore).padStart(5, '0')}</span>
        </div>
      </div>

      {/* Game Board */}
      <div
        className="board-container"
        ref={boardRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="board" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}>
          {Array.from({ length: BOARD_SIZE }, (_, y) =>
            Array.from({ length: BOARD_SIZE }, (_, x) => {
              const head = isSnakeHead(x, y);
              const body = isSnakeBody(x, y);
              const foodCell = isFood(x, y);
              const idx = getSnakeIndex(x, y);
              const green = Math.round(255 * Math.max(0.35, 1 - idx * 0.04));
              return (
                <div
                  key={`${x}-${y}`}
                  className={`cell${head ? ' snake-head' : ''}${body ? ' snake-body' : ''}${foodCell ? ' food' : ''}`}
                  style={body ? {
                    background: `rgb(0, ${green}, 0)`,
                    opacity: Math.max(0.45, 1 - idx * 0.025),
                  } : {}}
                />
              );
            })
          )}
        </div>

        {/* START overlay */}
        {gameState === 'idle' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2 className="pixel-font overlay-title">🐍 SNAKE</h2>
              <div className="overlay-divider" />
              <div className="how-to-play">
                <div className="key-hint">
                  <span className="key-box">↑↓←→</span>
                  <span className="key-desc">MOVE</span>
                </div>
                <div className="key-hint">
                  <span className="key-box">WASD</span>
                  <span className="key-desc">ALSO MOVE</span>
                </div>
                <div className="key-hint">
                  <span className="key-box">SPC</span>
                  <span className="key-desc">PAUSE</span>
                </div>
              </div>
              <div className="overlay-divider" />
              <button className="start-btn pixel-font" onClick={resetGame}>▶ START</button>
            </div>
          </div>
        )}

        {/* GAME OVER overlay */}
        {gameState === 'over' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2 className="pixel-font overlay-title red">GAME OVER</h2>
              <div className="overlay-divider" />
              <p className="overlay-score pixel-font">SCORE: {String(score).padStart(5, '0')}</p>
              {score > 0 && score === highScore && (
                <p className="overlay-best pixel-font">🏆 NEW RECORD!</p>
              )}
              <div className="overlay-divider" />
              <button className="start-btn pixel-font" onClick={resetGame}>↺ RETRY</button>
            </div>
          </div>
        )}

        {/* PAUSED overlay */}
        {gameState === 'paused' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2 className="pixel-font overlay-title">⏸ PAUSED</h2>
              <p className="overlay-sub">PRESS SPACE TO RESUME</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile D-pad */}
      <div className="mobile-controls">
        <div className="ctrl-row">
          <button className="ctrl-btn" onClick={() => handleDir({ x: 0, y: -1 })}>▲</button>
        </div>
        <div className="ctrl-row">
          <button className="ctrl-btn" onClick={() => handleDir({ x: -1, y: 0 })}>◄</button>
          <button className="ctrl-btn" onClick={() => handleDir({ x: 0, y: 1 })}>▼</button>
          <button className="ctrl-btn" onClick={() => handleDir({ x: 1, y: 0 })}>►</button>
        </div>
      </div>
    </div>
  );
}
