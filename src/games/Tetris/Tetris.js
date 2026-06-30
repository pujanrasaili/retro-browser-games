import React from 'react';
import useTetrisGame from './useTetrisGame';
import { formatScore } from '../../utils/formatScore';
import './Tetris.css';

function MiniPiece({ shape, color }) {
  if (!shape) return null;
  return (
    <div className="mini-piece" style={{ gridTemplateColumns: `repeat(${shape[0].length}, 1fr)` }}>
      {shape.map((row, r) =>
        row.map((cell, c) => (
          <div key={`${r}-${c}`} className="mini-cell" style={cell ? { background: color, boxShadow: `0 0 6px ${color}` } : {}} />
        ))
      )}
    </div>
  );
}

export default function Tetris() {
  const {
    board, current, next, ghost,
    score, highScore, lines, level, bestLines, justLeveledUp, tetrisCallout,
    gameState, resetGame,
    moveLeft, moveRight, moveDown, rotate, hardDrop,
    BOARD_WIDTH, BOARD_HEIGHT,
  } = useTetrisGame();

  // Build display board
  const displayBoard = board.map(row => [...row]);

  // Draw ghost
  if (ghost && gameState === 'playing') {
    ghost.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const ny = ghost.y + r, nx = ghost.x + c;
          if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH && !displayBoard[ny][nx]) {
            displayBoard[ny][nx] = { color: 'transparent', ghost: true, ghostColor: ghost.color };
          }
        }
      });
    });
  }

  // Draw current piece
  if (current && gameState === 'playing') {
    current.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const ny = current.y + r, nx = current.x + c;
          if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
            displayBoard[ny][nx] = { color: current.color, shadow: current.shadow };
          }
        }
      });
    });
  }

  return (
    <div className="tetris-wrapper">
      {/* Left panel */}
      <div className="tetris-side left-panel">
        <div className="panel-box">
          <div className="panel-label pixel-font">SCORE</div>
          <div className="panel-value pixel-font" style={{ color: '#39ff14' }}>{formatScore(score)}</div>
        </div>
        <div className="panel-box">
          <div className="panel-label pixel-font">BEST</div>
          <div className="panel-value pixel-font" style={{ color: '#ffd700' }}>{formatScore(highScore)}</div>
        </div>
        <div className="panel-box">
          <div className="panel-label pixel-font">LINES</div>
          <div className="panel-value pixel-font" style={{ color: '#00f5ff' }}>{String(lines).padStart(4, '0')}</div>
          <div className="panel-sublabel pixel-font">BEST {bestLines}</div>
        </div>
        <div className="panel-box">
          <div className="panel-label pixel-font">LEVEL</div>
          <div className="panel-value pixel-font" style={{ color: '#bf5fff' }}>{String(level).padStart(2, '0')}</div>
        </div>
      </div>

      {/* Board */}
      <div className="tetris-board-container">
        <div className={`tetris-board ${gameState === 'over' ? 'game-over' : ''} ${justLeveledUp ? 'level-up' : ''}`} style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)` }}>
          {displayBoard.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className={`tcell ${cell ? (cell.ghost ? 'ghost' : 'filled') : ''}`}
                style={cell && !cell.ghost ? {
                  background: cell.color,
                  boxShadow: `0 0 6px ${cell.shadow || cell.color}, inset 0 0 4px rgba(255,255,255,0.15)`,
                } : cell && cell.ghost ? {
                  border: `1px solid ${cell.ghostColor}`,
                  opacity: 0.25,
                } : {}}
              />
            ))
          )}
        </div>

        {tetrisCallout && (
          <div className="tetris-callout pixel-font">TETRIS!</div>
        )}

        {/* Overlays */}
        {gameState === 'idle' && (
          <div className="t-overlay">
            <div className="t-overlay-content">
              <h2 className="pixel-font t-title">🧱 TETRIS</h2>
              <div className="t-divider" />
              <div className="t-controls">
                <div className="t-key-row"><span className="t-key pixel-font">←→</span><span className="t-desc">Move</span></div>
                <div className="t-key-row"><span className="t-key pixel-font">↑</span><span className="t-desc">Rotate</span></div>
                <div className="t-key-row"><span className="t-key pixel-font">↓</span><span className="t-desc">Soft Drop</span></div>
                <div className="t-key-row"><span className="t-key pixel-font">SPC</span><span className="t-desc">Hard Drop</span></div>
                <div className="t-key-row"><span className="t-key pixel-font">P</span><span className="t-desc">Pause</span></div>
              </div>
              <div className="t-divider" />
              <button className="t-btn pixel-font" onClick={resetGame}>▶ START</button>
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div className="t-overlay">
            <div className="t-overlay-content">
              <h2 className="pixel-font t-title red">GAME OVER</h2>
              <div className="t-divider" />
              <p className="pixel-font t-stat">SCORE: {formatScore(score)}</p>
              <p className="pixel-font t-stat">LINES: {lines}</p>
              <p className="pixel-font t-stat">LEVEL: {level}</p>
              {score > 0 && score === highScore && <p className="pixel-font t-best">🏆 NEW SCORE RECORD!</p>}
              {lines > 0 && lines === bestLines && score !== highScore && <p className="pixel-font t-best">🔥 NEW LINES RECORD!</p>}
              <div className="t-divider" />
              <button className="t-btn pixel-font" onClick={resetGame}>↺ RETRY</button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="t-overlay">
            <div className="t-overlay-content">
              <h2 className="pixel-font t-title">⏸ PAUSED</h2>
              <p className="t-desc-lg">Press P to resume</p>
            </div>
          </div>
        )}
      </div>

      {/* Right panel — Next piece */}
      <div className="tetris-side right-panel">
        <div className="panel-box">
          <div className="panel-label pixel-font">NEXT</div>
          {next && <MiniPiece shape={next.shape} color={next.color} />}
        </div>

        {/* Mobile controls */}
        <div className="t-mobile">
          <div className="t-ctrl-row">
            <button className="t-ctrl-btn pixel-font" onClick={rotate}>↻</button>
          </div>
          <div className="t-ctrl-row">
            <button className="t-ctrl-btn pixel-font" onClick={moveLeft}>◄</button>
            <button className="t-ctrl-btn pixel-font" onClick={moveDown}>▼</button>
            <button className="t-ctrl-btn pixel-font" onClick={moveRight}>►</button>
          </div>
          <div className="t-ctrl-row">
            <button className="t-ctrl-btn drop pixel-font" onClick={hardDrop}>⬇</button>
          </div>
        </div>
      </div>
    </div>
  );
}
