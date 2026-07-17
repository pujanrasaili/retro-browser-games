import React from 'react';
import useMinesweeper, { useChord } from './useMinesweeper';
import { NUM_COLORS, DIFFICULTIES } from './mineUtils';
import './Minesweeper.css';

function SevenSeg({ value, digits = 3 }) {
  const isNegative = value < 0;
  const clamped = Math.max(-99, Math.min(999, value));
  const display = isNegative
    ? '-' + String(Math.abs(clamped)).padStart(digits - 1, '0')
    : String(clamped).padStart(digits, '0');
  return <div className="seven-seg pixel-font">{display}</div>;
}

function TimeDisplay({ value }) {
  const clamped = Math.min(5999, value); // cap at 99:59
  if (clamped < 60) {
    return <div className="seven-seg pixel-font">{String(clamped).padStart(3, '0')}</div>;
  }
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return (
    <div className="seven-seg pixel-font">
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Minesweeper() {
  const {
    board, difficulty, gameState, minesLeft, time, bestTimes, halfwayCelebrated,
    rows, cols,
    resetGame, handleReveal, handleChordReveal, handleFlag,
  } = useMinesweeper();

  const faceMap = { idle: '🙂', playing: '🙂', won: '😎', lost: '😵' };
  const bestTime = bestTimes[difficulty];
  const isNewBest = gameState === 'won' && (!bestTime || time <= bestTime);
  const handleChord = useChord(board, gameState, rows, cols, handleChordReveal);

  // Count correctly placed flags (on actual mines) for the lose screen
  const correctFlags = board
    ? board.flat().filter(c => c.flagged && c.mine).length
    : 0;
  const totalMines = board
    ? board.flat().filter(c => c.mine).length
    : 0;

  return (
    <div className="mine-wrapper">
      {/* Difficulty selector */}
      <div className="mine-diff-bar">
        {Object.keys(DIFFICULTIES).map(d => {
          const { rows, cols, mines } = DIFFICULTIES[d];
          return (
            <button
              key={d}
              className={`diff-btn pixel-font ${difficulty === d ? 'active' : ''}`}
              onClick={() => resetGame(d)}
              title={`${d.charAt(0).toUpperCase() + d.slice(1)}: ${rows}×${cols} grid, ${mines} mines`}
            >
              {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Header bar */}
      <div className="mine-header">
        <SevenSeg value={minesLeft} />
        <div className="mine-header-center">
          <button className="face-btn" onClick={() => resetGame(difficulty)} title="New game">
            {faceMap[gameState]}
          </button>
          {bestTime !== undefined && (
            <div className="best-time pixel-font">BEST: {formatTime(bestTime)}</div>
          )}
        </div>
        <TimeDisplay value={time} />
      </div>

      {/* Board */}
      <div className="mine-board-wrap">
        <div
          className={`mine-board ${gameState === 'lost' ? 'lost' : ''} ${gameState === 'won' ? 'won' : ''}`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          onContextMenu={e => e.preventDefault()}
        >
          {(board
            ? board.map((row, r) => row.map((cell, c) => {
                let content = '';
                let cellClass = 'mcell';
                // On win: auto-flag all unrevealed mines for the satisfying reveal
                const autoFlagged = gameState === 'won' && cell.mine && !cell.revealed;
                if (cell.revealed) {
                  cellClass += ' revealed';
                  if (cell.mine) { content = cell.exploded ? '💥' : '💣'; if (cell.exploded) cellClass += ' exploded'; }
                  else if (cell.adjacent > 0) content = cell.adjacent;
                } else if (cell.flagged || autoFlagged) {
                  content = '🚩';
                  cellClass += autoFlagged ? ' flagged win-flag' : ' flagged';
                } else cellClass += ' hidden';
                return (
                  <div key={`${r}-${c}`} className={cellClass}
                    style={cell.revealed && !cell.mine && cell.adjacent > 0 ? { color: NUM_COLORS[cell.adjacent] } : {}}
                    onClick={() => handleReveal(r, c)}
                    onDoubleClick={() => handleChord(r, c)}
                    onContextMenu={(e) => handleFlag(e, r, c)}>
                    {content}
                  </div>
                );
              }))
            : Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => (
                  <div key={`${r}-${c}`} className="mcell hidden"
                    onClick={() => handleReveal(r, c)}
                    onContextMenu={(e) => handleFlag(e, r, c)} />
                )))
          )}
        </div>

        {halfwayCelebrated && (
          <div className="halfway-callout pixel-font">⚡ HALFWAY THERE!</div>
        )}

        {gameState === 'won' && (
          <div className="mine-overlay">
            <div className="mine-overlay-content">
              <div className="mine-overlay-icon">{difficulty === 'hard' ? '🏆' : '😎'}</div>
              <h2 className="pixel-font mine-overlay-title green">
                {difficulty === 'hard' ? 'LEGENDARY WIN!' : 'YOU WIN!'}
              </h2>
              <p className="pixel-font mine-diff-badge">
                {difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴'} {difficulty.toUpperCase()}
              </p>
              <p className="mine-overlay-stat pixel-font">TIME: {formatTime(time)}</p>
              {isNewBest && <p className="mine-overlay-best pixel-font">🏆 NEW BEST!</p>}
              <button className="mine-btn pixel-font" onClick={() => resetGame(difficulty)}>▶ PLAY AGAIN</button>
            </div>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="mine-overlay">
            <div className="mine-overlay-content">
              <div className="mine-overlay-icon">💥</div>
              <h2 className="pixel-font mine-overlay-title red">BOOM!</h2>
              <p className="mine-overlay-stat pixel-font">FOUND: {correctFlags}/{totalMines} 🚩</p>
              <p className="mine-overlay-sub">TIME: {formatTime(time)}</p>
              <button className="mine-btn pixel-font" onClick={() => resetGame(difficulty)}>↺ RETRY</button>
            </div>
          </div>
        )}
      </div>

      <div className="mine-instructions">
        <span className="pixel-font mine-hint">LEFT CLICK: Reveal</span>
        <span className="pixel-font mine-hint">RIGHT CLICK: Flag 🚩</span>
        <span className="pixel-font mine-hint">DOUBLE CLICK: Auto-clear ⚡</span>
      </div>
    </div>
  );
}
