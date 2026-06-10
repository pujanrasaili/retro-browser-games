import { useState, useEffect, useCallback, useRef } from 'react';

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_SPEED = 150;

function randomFood(snake) {
  let food;
  do {
    food = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
  return food;
}

export default function useSnakeGame() {
  const [snake, setSnake] = useState([]);
  const [direction, setDirectionState] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState('idle');
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  directionRef.current = direction;
  snakeRef.current = snake;

  const setDirection = useCallback((newDir) => {
    const dir = directionRef.current;
    if (newDir.x === -dir.x && newDir.y === -dir.y) return;
    setDirectionState(newDir);
    directionRef.current = newDir;
  }, []);

  const resetGame = useCallback(() => {
    const initSnake = INITIAL_SNAKE;
    setSnake(initSnake);
    setDirectionState(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(randomFood(initSnake));
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState('playing');
  }, []);

  const moveSnake = useCallback(() => {
    const dir = directionRef.current;
    const current = snakeRef.current;
    if (!current.length) return;
    const head = current[0];
    const newHead = {
      x: (head.x + dir.x + BOARD_SIZE) % BOARD_SIZE,
      y: (head.y + dir.y + BOARD_SIZE) % BOARD_SIZE,
    };

    if (current.some(s => s.x === newHead.x && s.y === newHead.y)) {
      setGameState('over');
      return;
    }

    setSnake(prev => {
      const newSnake = [newHead, ...prev];
      setFood(prevFood => {
        if (newHead.x === prevFood.x && newHead.y === prevFood.y) {
          setScore(s => {
            const ns = s + 10;
            setHighScore(h => Math.max(h, ns));
            setSpeed(sp => Math.max(60, sp - 2));
            return ns;
          });
          return randomFood(newSnake);
        } else {
          newSnake.pop();
          return prevFood;
        }
      });
      return newSnake;
    });
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [gameState, speed, moveSnake]);

  // Keyboard controls — only work when game is active
  useEffect(() => {
    const handleKey = (e) => {
      // Pause/resume with space only when playing or paused
      if (e.key === ' ') {
        e.preventDefault();
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
        return;
      }
      // Direction keys only when playing
      if (gameState !== 'playing') return;
      const keys = {
        ArrowUp:    { x: 0,  y: -1 },
        ArrowDown:  { x: 0,  y: 1  },
        ArrowLeft:  { x: -1, y: 0  },
        ArrowRight: { x: 1,  y: 0  },
        w: { x: 0,  y: -1 },
        s: { x: 0,  y: 1  },
        a: { x: -1, y: 0  },
        d: { x: 1,  y: 0  },
      };
      const newDir = keys[e.key];
      if (!newDir) return;
      setDirection(newDir);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, setDirection]);

  return { snake, food, score, highScore, gameState, resetGame, setDirection, BOARD_SIZE, speed };
}
