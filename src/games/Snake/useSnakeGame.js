import { useState, useEffect, useCallback, useRef } from 'react';
import { sounds } from '../../utils/sound';

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
const INITIAL_DIRECTION = { x: 1, y: 0 };

export const DIFFICULTIES = {
  easy:   { speed: 200, label: '🟢 EASY',   speedDec: 1 },
  medium: { speed: 130, label: '🟡 MEDIUM', speedDec: 2 },
  hard:   { speed: 70,  label: '🔴 HARD',   speedDec: 3 },
};

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
  const [difficulty, setDifficulty] = useState('medium');
  const [walls, setWalls] = useState(false);
  const [snake, setSnake] = useState([]);
  const [direction, setDirectionState] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('snake_best') || '0', 10));
  const [gameState, setGameState] = useState('idle');
  const [speed, setSpeed] = useState(DIFFICULTIES.medium.speed);

  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const wallsRef = useRef(walls);
  directionRef.current = direction;
  snakeRef.current = snake;
  wallsRef.current = walls;

  const setDirection = useCallback((newDir) => {
    const dir = directionRef.current;
    if (newDir.x === -dir.x && newDir.y === -dir.y) return;
    setDirectionState(newDir);
    directionRef.current = newDir;
  }, []);

  const resetGame = useCallback((diff = difficulty, w = walls) => {
    const initSnake = INITIAL_SNAKE;
    setSnake(initSnake);
    setDirectionState(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(randomFood(initSnake));
    setScore(0);
    setSpeed(DIFFICULTIES[diff].speed);
    setGameState('playing');
  }, [difficulty, walls]);

  const moveSnake = useCallback(() => {
    const dir = directionRef.current;
    const current = snakeRef.current;
    const useWalls = wallsRef.current;
    if (!current.length) return;
    const head = current[0];

    let nx = head.x + dir.x;
    let ny = head.y + dir.y;

    // Wall mode — hit wall = game over
    if (useWalls) {
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
        sounds.gameOver();
        setGameState('over');
        return;
      }
    } else {
      nx = (nx + BOARD_SIZE) % BOARD_SIZE;
      ny = (ny + BOARD_SIZE) % BOARD_SIZE;
    }

    const newHead = { x: nx, y: ny };

    if (current.some(s => s.x === newHead.x && s.y === newHead.y)) {
      sounds.gameOver();
      setGameState('over');
      return;
    }

    setSnake(prev => {
      const newSnake = [newHead, ...prev];
      setFood(prevFood => {
        if (newHead.x === prevFood.x && newHead.y === prevFood.y) {
          sounds.eat();
          setScore(s => {
            const ns = s + 10;
            setHighScore(h => { const newH = Math.max(h, ns); localStorage.setItem('snake_best', newH); return newH; });
            setDifficulty(diff => {
              setSpeed(sp => Math.max(40, sp - DIFFICULTIES[diff].speedDec));
              return diff;
            });
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

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [gameState, speed, moveSnake]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
        return;
      }
      if (gameState !== 'playing') return;
      const keys = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
        a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
      };
      const newDir = keys[e.key];
      if (!newDir) return;
      setDirection(newDir);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, setDirection]);

  return {
    snake, food, score, highScore, gameState, speed,
    difficulty, setDifficulty, walls, setWalls,
    resetGame, setDirection, BOARD_SIZE,
  };
}
