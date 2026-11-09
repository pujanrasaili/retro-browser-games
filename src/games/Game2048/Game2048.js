import React, { useRef } from 'react';
import useGame2048 from './useGame2048';
import { formatScore } from '../../utils/formatScore';
import { swipeDirection } from '../../utils/swipeDirection';
import './Game2048.css';

// 2048 and anything higher have their own look; every tile below that is styled by value.
const tileClass = (value) => (value > 2048 ? 'super' : String(value));

export default function Game2048() {
  const { board, score, best, gameState, startGame, keepPlaying, slide } = useGame2048();
  const touchStart = useRef(null);

  // Swipe to slide. The gesture is measured from where the finger went down to where it came
  // up, and swipeDirection decides whether that was a swipe at all (taps and jitter are not).
  // A second finger (a pinch, or a stray palm) cancels the gesture instead of steering.
  const handleTouchStart = (e) => {
    touchStart.current = e.touches.length === 1
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : null;
  };
  const handleTouchEnd = (e) => {
    const start = touchStart.current;
    touchStart.current = null; // each gesture is used once
    if (!start) return;
    const touch = e.changedTouches[0];
    const direction = swipeDirection(touch.clientX - start.x, touch.clientY - start.y);
    if (direction) slide(direction);
  };
  // A touch interrupted by the system (a call, a gesture) is not a swipe.
  const handleTouchCancel = () => { touchStart.current = null; };

  return (
    <div className="g2048-wrapper">
      <div className="g2048-score-bar">
        <div className="g2048-score-item">
          <span className="g2048-label pixel-font">SCORE</span>
          <span className="g2048-value pixel-font">{formatScore(score, 5)}</span>
        </div>
        <button className="g2048-new-btn pixel-font" onClick={startGame} title="Start a new game">
          ↺ NEW
        </button>
        <div className="g2048-score-item">
          <span className="g2048-label pixel-font">BEST</span>
          <span className="g2048-value g2048-best pixel-font">{formatScore(best, 5)}</span>
        </div>
      </div>

      <div
        className="g2048-board-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <div className="g2048-board">
          {board.map((row, r) => row.map((value, c) => (
            <div
              key={`${r}-${c}`}
              className={value
                ? `g2048-cell g2048-tile g2048-tile-${tileClass(value)}${value >= 1000 ? ' g2048-long' : ''}`
                : 'g2048-cell'}
              aria-label={value ? `Tile ${value}` : 'Empty'}
            >
              {value || ''}
            </div>
          )))}
        </div>

        {gameState === 'idle' && (
          <div className="g2048-overlay">
            <div className="g2048-overlay-content">
              <h2 className="g2048-title pixel-font">2048</h2>
              <p className="g2048-hint">Join equal tiles to make 2048</p>
              <p className="g2048-hint">ARROWS / WASD or SWIPE to slide</p>
              <button className="g2048-btn pixel-font" onClick={startGame}>▶ START</button>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="g2048-overlay">
            <div className="g2048-overlay-content">
              <h2 className="g2048-title g2048-win pixel-font">YOU MADE 2048!</h2>
              <p className="g2048-hint">SCORE: {formatScore(score, 5)}</p>
              <div className="g2048-btn-row">
                <button className="g2048-btn pixel-font" onClick={keepPlaying}>KEEP GOING</button>
                <button className="g2048-btn g2048-btn-alt pixel-font" onClick={startGame}>NEW GAME</button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div className="g2048-overlay">
            <div className="g2048-overlay-content">
              <h2 className="g2048-title g2048-lose pixel-font">GAME OVER</h2>
              <p className="g2048-hint">SCORE: {formatScore(score, 5)}</p>
              {score > 0 && score === best && <p className="g2048-record pixel-font">🏆 NEW RECORD</p>}
              <button className="g2048-btn pixel-font" onClick={startGame}>↺ NEW GAME</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
