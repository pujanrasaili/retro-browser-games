import { useState, useEffect, useCallback, useRef } from 'react';
import { sounds } from '../../utils/sound';

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 450;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 70;
const PADDLE_SPEED = 6;
const BALL_SIZE = 8;
const INITIAL_BALL_SPEED = 4;
// Capped below PADDLE_WIDTH so the ball can never move farther than a paddle's
// width in one frame — otherwise a long rally could speed the ball up enough
// to tunnel straight through a paddle without ever triggering the collision check.
const MAX_BALL_SPEED = 9;
const WINNING_SCORE = 7;

function initialState() {
  return {
    leftY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    rightY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballVX: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    ballVY: (Math.random() * 2 - 1) * INITIAL_BALL_SPEED,
  };
}

export default function usePongGame() {
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle | playing | paused | over
  const [winner, setWinner] = useState(null);
  const [cpuWins, setCpuWins] = useState(() => parseInt(localStorage.getItem('pong_cpu_wins') || '0', 10));
  const [mode, setMode] = useState('ai'); // 'ai' or '2p'
  const [aiDifficulty, setAiDifficulty] = useState('medium'); // 'easy' | 'medium' | 'hard'

  const stateRef = useRef(initialState());
  const keysRef = useRef({});
  const rafRef = useRef(null);

  const resetGame = useCallback((selectedMode = mode) => {
    setMode(selectedMode);
    setLeftScore(0);
    setRightScore(0);
    setWinner(null);
    stateRef.current = initialState();
    setGameState('playing');
  }, [mode]);

  const resetBall = useCallback((direction) => {
    stateRef.current.ballX = CANVAS_WIDTH / 2;
    stateRef.current.ballY = CANVAS_HEIGHT / 2;
    stateRef.current.ballVX = INITIAL_BALL_SPEED * direction;
    stateRef.current.ballVY = (Math.random() * 2 - 1) * INITIAL_BALL_SPEED;
  }, []);

  // Keyboard input
  useEffect(() => {
    const handleDown = (e) => { keysRef.current[e.key] = true; };
    const handleUp = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  // Pause toggle
  useEffect(() => {
    const handlePause = (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setGameState(s => (s === 'playing' ? 'paused' : s === 'paused' ? 'playing' : s));
      }
    };
    window.addEventListener('keydown', handlePause);
    return () => window.removeEventListener('keydown', handlePause);
  }, []);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      const s = stateRef.current;
      const keys = keysRef.current;

      // Left paddle: W/S
      if (keys['w'] || keys['W']) s.leftY -= PADDLE_SPEED;
      if (keys['s'] || keys['S']) s.leftY += PADDLE_SPEED;
      s.leftY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.leftY));

      if (mode === '2p') {
        // Right paddle: Arrow Up/Down
        if (keys['ArrowUp']) s.rightY -= PADDLE_SPEED;
        if (keys['ArrowDown']) s.rightY += PADDLE_SPEED;
        s.rightY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.rightY));
      } else {
        // AI: track ball with lag that scales by difficulty
        const AI_SPEED_MULT = { easy: 0.5, medium: 0.75, hard: 0.95 };
        const paddleCenter = s.rightY + PADDLE_HEIGHT / 2;
        const diff = s.ballY - paddleCenter;
        const aiSpeed = PADDLE_SPEED * (AI_SPEED_MULT[aiDifficulty] || 0.75);
        if (Math.abs(diff) > 4) {
          s.rightY += Math.sign(diff) * aiSpeed;
        }
        s.rightY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, s.rightY));
      }

      // Ball movement
      s.ballX += s.ballVX;
      s.ballY += s.ballVY;

      // Top/bottom collision
      if (s.ballY <= 0 || s.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
        s.ballVY *= -1;
        s.ballY = Math.max(0, Math.min(CANVAS_HEIGHT - BALL_SIZE, s.ballY));
        sounds.wallBounce();
      }

      // Left paddle collision
      if (
        s.ballX <= PADDLE_WIDTH + 10 &&
        s.ballX >= 10 &&
        s.ballY + BALL_SIZE >= s.leftY &&
        s.ballY <= s.leftY + PADDLE_HEIGHT &&
        s.ballVX < 0
      ) {
        s.ballVX *= -1.05;
        s.ballVX = Math.sign(s.ballVX) * Math.min(Math.abs(s.ballVX), MAX_BALL_SPEED);
        const hitPos = (s.ballY - s.leftY) / PADDLE_HEIGHT - 0.5;
        s.ballVY += hitPos * 3;
        s.ballVY = Math.sign(s.ballVY) * Math.min(Math.abs(s.ballVY), MAX_BALL_SPEED);
        sounds.paddleHit();
      }

      // Right paddle collision
      if (
        s.ballX + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH - 10 &&
        s.ballX <= CANVAS_WIDTH - 10 &&
        s.ballY + BALL_SIZE >= s.rightY &&
        s.ballY <= s.rightY + PADDLE_HEIGHT &&
        s.ballVX > 0
      ) {
        s.ballVX *= -1.05;
        s.ballVX = Math.sign(s.ballVX) * Math.min(Math.abs(s.ballVX), MAX_BALL_SPEED);
        const hitPos = (s.ballY - s.rightY) / PADDLE_HEIGHT - 0.5;
        s.ballVY += hitPos * 3;
        s.ballVY = Math.sign(s.ballVY) * Math.min(Math.abs(s.ballVY), MAX_BALL_SPEED);
        sounds.paddleHit();
      }

      // Scoring
      if (s.ballX < 0) {
        setRightScore(prev => {
          const ns = prev + 1;
          if (ns >= WINNING_SCORE) {
            setWinner('right');
            setGameState('over');
            sounds.pongLose();
          } else {
            sounds.pongScore();
          }
          return ns;
        });
        resetBall(1);
      } else if (s.ballX > CANVAS_WIDTH) {
        setLeftScore(prev => {
          const ns = prev + 1;
          if (ns >= WINNING_SCORE) {
            setWinner('left');
            setGameState('over');
            sounds.pongWin();
            if (mode === 'ai') {
              setCpuWins(w => { const nw = w + 1; localStorage.setItem('pong_cpu_wins', nw); return nw; });
            }
          } else {
            sounds.pongScore();
          }
          return ns;
        });
        resetBall(-1);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [gameState, mode, aiDifficulty, resetBall]);

  return {
    leftScore, rightScore, gameState, winner, mode, cpuWins, aiDifficulty, setAiDifficulty,
    stateRef, resetGame, setMode,
    CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE, WINNING_SCORE,
  };
}
