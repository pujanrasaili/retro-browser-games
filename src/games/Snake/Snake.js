import React from 'react';
import useSnakeGame from './useSnakeGame';
import './Snake.css';

export default function Snake() {
  const { snake, food, score, highScore, gameState, resetGame, setDirection, BOARD_SIZE } = useSnakeGame();

  const isSnakeHead = (x, y) => snake[0].x === x && snake[0].y === y;
  const isSnakeBody = (x, y) => snake.slice(1).some(s => s.x === x && s.y === y);
  const isFood = (x, y) => food.x === x && food.y === y;

  const getSnakeIndex = (x, y) => snake.findIndex(s => s.x === x && s.y === y);

  const handleSwipe = (() => {
    let startX, startY;
    return {
      onTouchStart: (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      },
      onTouchEnd: (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
          setDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
        } else {
          setDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
        }
      }
    };
  })();

  return (
    <div className="snake-wrapper">
      {/* Score Bar */}
      <div className="score-bar">
        <div className="score-item">
          <span className="score-label pixel-font">SCORE</span>
          <span className="score-value pixel-font">{String(score).padStart(5, '0')}</span>
        </div>
        <div className="score-item">
          <span className="score-label pixel-font">BEST</span>
          <span className="score-value pixel-font hi">{String(highScore).padStart(5, '0')}</span>
        </div>
      </div>

      {/* Game Board */}
      <div className="board-container" {...handleSwipe}>
        <div
          className="board"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
        >
          {Array.from({ length: BOARD_SIZE }, (_, y) =>
            Array.from({ length: BOARD_SIZE }, (_, x) => {
              const head = isSnakeHead(x, y);
              const body = isSnakeBody(x, y);
              const food = isFood(x, y);
              const idx = getSnakeIndex(x, y);
              return (
                <div
                  key={`${x}-${y}`}
                  className={`cell ${head ? 'snake-head' : ''} ${body ? 'snake-body' : ''} ${food ? 'food' : ''}`}
                  style={body ? { opacity: Math.max(0.4, 1 - idx * 0.03) } : {}}
                />
              );
            })
          )}
        </div>

        {/* Overlays */}
        {gameState === 'idle' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2 className="pixel-font overlay-title">🐍 SNAKE</h2>
              <p className="overlay-sub">Use arrow keys or WASD</p>
              <p className="overlay-sub">SPACE to pause</p>
              <button className="start-btn pixel-font" onClick={resetGame}>START GAME</button>
            </div>
          </div>
        )}
        {gameState === 'over' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2 className="pixel-font overlay-title red">GAME OVER</h2>
              <p className="overlay-score pixel-font">SCORE: {score}</p>
              {score === highScore && score > 0 && <p className="overlay-best pixel-font">🏆 NEW BEST!</p>}
              <button className="start-btn pixel-font" onClick={resetGame}>PLAY AGAIN</button>
            </div>
          </div>
        )}
        {gameState === 'paused' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2 className="pixel-font overlay-title">PAUSED</h2>
              <p className="overlay-sub">Press SPACE to resume</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mobile-controls">
        <div className="ctrl-row">
          <button className="ctrl-btn pixel-font" onClick={() => setDirection({ x: 0, y: -1 })}>▲</button>
        </div>
        <div className="ctrl-row">
          <button className="ctrl-btn pixel-font" onClick={() => setDirection({ x: -1, y: 0 })}>◄</button>
          <button className="ctrl-btn pixel-font" onClick={() => setDirection({ x: 0, y: 1 })}>▼</button>
          <button className="ctrl-btn pixel-font" onClick={() => setDirection({ x: 1, y: 0 })}>►</button>
        </div>
      </div>
    </div>
  );
}
