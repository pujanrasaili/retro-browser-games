import React from 'react';
import useMinesweeper from './useMinesweeper';
import { NUM_COLORS, DIFFICULTIES } from './mineUtils';
import './Minesweeper.css';

function SevenSeg({ value, digits = 3 }) {
  const display = String(Math.max(0, Math.min(999, value))).padStart(digits, '0');
  return (
    <div className="seven-seg pixel-font">
      {display}
    </div>
  );
}

export default function Minesweeper() {
  const {
    board, difficulty, gameState, minesLeft, time,
    rows, cols,
    resetGame, handleReveal, handleFlag,
  } = useMinesweeper();

  const faceMap = { idle: '🙂', playing: '🙂', won: '😎', lost: '😵' };

  return (
    <div className="mine-wrapper">
      {/* Difficulty selector */}
      <div className="mine-diff-bar">
        {Object.keys(DIFFICULTIES).map(d => (
          <button
            key={d}
            className={`diff-btn pixel-font ${difficulty === d ? 'active' : ''}`}
            onClick={() => resetGame(d)}
          >
            {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Header bar */}
      <div className="mine-header">
        <SevenSeg value={minesLeft} />
        <button className="face-btn" onClick={() => resetGame(difficulty)}>
          {faceMap[gameState]}
        </button>
        <SevenSeg value={time} />
      </div>

      {/* Board */}
      <div className="mine-board-wrap">
        <div
          className={`mine-board ${gameState === 'lost' ? 'lost' : ''} ${gameState === 'won' ? 'won' : ''}`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          onContextMenu={e => e.preventDefault()}
        >
          {board ? board.map((row, r) =>
            row.map((cell, c) => {
              let content = '';
              let cellClass = 'mcell';

              if (cell.revealed) {
                cellClass += ' revealed';
                if (cell.mine) {
                  content = cell.exploded ? '💥' : '💣';
                  if (cell.exploded) cellClass += ' exploded';
                } else if (cell.adjacent > 0) {
                  content = cell.adjacent;
                }
              } else if (cell.flagged) {
                content = '🚩';
                cellClass += ' flagged';
              } else {
                cellClass += ' hidden';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className={cellClass}
                  style={cell.revealed && !cell.mine && cell.adjacent > 0
                    ? { color: NUM_COLORS[cell.adjacent] }
                    : {}
                  }
                  onClick={() => handleReveal(r, c)}
                  onContextMenu={(e) => handleFlag(e, r, c)}
                >
                  {content}
                </div>
              );
            })
          ) : (
            // Empty board before first click
            Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => (
                <div
                  key={`${r}-${c}`}
                  className="mcell hidden"
                  onClick={() => handleReveal(r, c)}
                  onContextMenu={(e) => handleFlag(e, r, c)}
                />
              ))
            )
          )}
        </div>

        {/* Win overlay */}
        {gameState === 'won' && (
          <div className="mine-overlay">
            <div className="mine-overlay-content">
              <div className="mine-overlay-icon">😎</div>
              <h2 className="pixel-font mine-overlay-title green">YOU WIN!</h2>
              <p className="mine-overlay-stat pixel-font">TIME: {time}s</p>
              <button className="mine-btn pixel-font" onClick={() => resetGame(difficulty)}>▶ PLAY AGAIN</button>
            </div>
          </div>
        )}

        {/* Lose overlay */}
        {gameState === 'lost' && (
          <div className="mine-overlay">
            <div className="mine-overlay-content">
              <div className="mine-overlay-icon">💥</div>
              <h2 className="pixel-font mine-overlay-title red">BOOM!</h2>
              <p className="mine-overlay-sub">Better luck next time</p>
              <button className="mine-btn pixel-font" onClick={() => resetGame(difficulty)}>↺ RETRY</button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mine-instructions">
        <span className="pixel-font mine-hint">LEFT CLICK: Reveal</span>
        <span className="pixel-font mine-hint">RIGHT CLICK: Flag 🚩</span>
      </div>
    </div>
  );
}
