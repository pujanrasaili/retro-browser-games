import React, { useRef, useEffect } from 'react';
import usePongGame from './usePongGame';
import './Pong.css';

export default function Pong() {
  const {
    leftScore, rightScore, gameState, winner, mode, cpuWins, aiDifficulty, setAiDifficulty,
    stateRef, resetGame, setMode,
    CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE,
  } = usePongGame();

  const canvasRef = useRef(null);
  const touchRef = useRef({ leftY: null, rightY: null });

  // Canvas render loop — runs independently of React state for smooth 60fps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const draw = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      ctx.fillStyle = '#07070f';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center dashed line
      ctx.strokeStyle = '#1a2a1a';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Left paddle (green)
      ctx.fillStyle = '#39ff14';
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 12;
      ctx.fillRect(10, s.leftY, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Right paddle (red)
      ctx.fillStyle = '#ff4757';
      ctx.shadowColor = '#ff4757';
      ctx.shadowBlur = 12;
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH - 10, s.rightY, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillRect(s.ballX, s.ballY, BALL_SIZE, BALL_SIZE);
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [stateRef, CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE]);

  // Touch controls — drag to move paddle vertically
  const handleTouchMove = (side) => (e) => {
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = CANVAS_HEIGHT / rect.height;
    const y = (touch.clientY - rect.top) * scale - PADDLE_HEIGHT / 2;
    const clamped = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y));
    if (side === 'left') stateRef.current.leftY = clamped;
    else stateRef.current.rightY = clamped;
  };

  return (
    <div className="pong-wrapper">
      {/* Score bar */}
      <div className="pong-score-bar">
        <div className="pong-score-item">
          <span className="pong-score-label pixel-font">YOU</span>
          <span className="pong-score-value pixel-font">{leftScore}</span>
        </div>
        <span className="pong-vs pixel-font">VS</span>
        <div className="pong-score-item">
          <span className="pong-score-label pixel-font">
            {mode === 'ai' ? `CPU (${aiDifficulty.charAt(0).toUpperCase()})` : 'P2'}
          </span>
          <span className="pong-score-value right pixel-font">{rightScore}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="pong-canvas-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="pong-canvas"
          onTouchMove={handleTouchMove('left')}
        />

        {gameState === 'idle' && (
          <div className="pong-overlay">
            <div className="pong-overlay-content">
              <h2 className="pixel-font pong-title">🏓 PONG</h2>
              <div className="pong-divider" />
              <div className="pong-controls">
                <div className="pong-key-hint">
                  <span className="pong-key-box pixel-font">W/S</span>
                  <span className="pong-key-desc">MOVE</span>
                </div>
                <div className="pong-key-hint">
                  <span className="pong-key-box pixel-font">P</span>
                  <span className="pong-key-desc">PAUSE</span>
                </div>
              </div>
              <div className="pong-divider" />
              {cpuWins > 0 && (
                <p className="pong-sub">🏆 BEAT CPU: {cpuWins}x</p>
              )}
              <div className="pong-diff-row">
                {['easy', 'medium', 'hard'].map(d => (
                  <button
                    key={d}
                    className={`pong-diff-btn pixel-font ${aiDifficulty === d ? 'active' : ''}`}
                    onClick={() => setAiDifficulty(d)}
                    title={`CPU difficulty: ${d}`}
                  >
                    {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="pong-controls">
                <button className="pong-btn pixel-font" onClick={() => resetGame('ai')}>▶ VS CPU</button>
                <button className="pong-btn pixel-font" onClick={() => resetGame('2p')}>▶ 2 PLAYER</button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'over' && (
          <div className="pong-overlay">
            <div className="pong-overlay-content">
              <h2 className={`pixel-font pong-title ${winner === 'right' ? 'red' : ''}`}>
                {winner === 'left' ? '🏆 YOU WIN!' : mode === 'ai' ? '💻 CPU WINS' : '🏆 P2 WINS!'}
              </h2>
              <p className="pong-sub">{leftScore} - {rightScore}</p>
              <button className="pong-btn pixel-font" onClick={() => resetGame(mode)}>↺ RETRY</button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="pong-overlay">
            <div className="pong-overlay-content">
              <h2 className="pixel-font pong-title">⏸ PAUSED</h2>
              <p className="pong-sub">PRESS P TO RESUME</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="pong-mobile-controls">
        <div className="pong-mobile-col">
          <span className="pong-mobile-label">DRAG SCREEN TO MOVE</span>
        </div>
      </div>
    </div>
  );
}
