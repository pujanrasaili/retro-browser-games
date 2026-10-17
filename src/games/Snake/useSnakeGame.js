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
  const [difficulty, setDifficultyState] = useState(() => {
    // Validate rather than trust localStorage: an unrecognised value (including one
    // saved by an older buggy build) falls back to medium instead of crashing the
    // component on DIFFICULTIES[difficulty].label.
    const saved = localStorage.getItem('snake_difficulty');
    return DIFFICULTIES[saved] ? saved : 'medium';
  });
  const [walls, setWallsState] = useState(
    () => localStorage.getItem('snake_walls') === 'true'
  );
  const setDifficulty = useCallback((d) => {
    if (!DIFFICULTIES[d]) return; // only real difficulty names are ever stored
    setDifficultyState(d);
    localStorage.setItem('snake_difficulty', d);
  }, []);
  const setWalls = useCallback((updater) => {
    setWallsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('snake_walls', String(next));
      return next;
    });
  }, []);
  const [snake, setSnake] = useState([]);
  const [direction, setDirectionState] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('snake_best') || '0', 10));
  const [bestLength, setBestLength] = useState(() => parseInt(localStorage.getItem('snake_best_length') || '0', 10));
  const [gameState, setGameState] = useState('idle');
  const [eatBurst, setEatBurst] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [scoreBump, setScoreBump] = useState(false);
  const [speed, setSpeed] = useState(DIFFICULTIES.medium.speed);

  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const wallsRef = useRef(walls);
  const foodRef = useRef(food);
  const scoreRef = useRef(score);
  const highScoreRef = useRef(highScore);
  const bestLengthRef = useRef(bestLength);
  const difficultyRef = useRef(difficulty);
  directionRef.current = direction;
  snakeRef.current = snake;
  wallsRef.current = walls;
  foodRef.current = food;
  scoreRef.current = score;
  highScoreRef.current = highScore;
  bestLengthRef.current = bestLength;
  difficultyRef.current = difficulty;

  const setDirection = useCallback((newDir) => {
    const dir = directionRef.current;
    if (newDir.x === -dir.x && newDir.y === -dir.y) return;
    setDirectionState(newDir);
    directionRef.current = newDir;
  }, []);

  const resetGame = useCallback((diff = difficulty, w = walls) => {
    const initSnake = INITIAL_SNAKE;
    const initFood = randomFood(initSnake);
    setSnake(initSnake);
    snakeRef.current = initSnake;
    setDirectionState(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(initFood);
    foodRef.current = initFood;
    setScore(0);
    scoreRef.current = 0;
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

    // Everything below is computed from refs and applied with plain values, so each
    // side effect (sounds, localStorage, scoring) runs exactly once per tick. Side
    // effects inside state-updater functions run twice under React.StrictMode in
    // development, which used to double the score, skip growth and over-speed the snake.
    const food = foodRef.current;
    const ate = newHead.x === food.x && newHead.y === food.y;
    const newSnake = ate ? [newHead, ...current] : [newHead, ...current.slice(0, -1)];
    snakeRef.current = newSnake;
    setSnake(newSnake);

    if (!ate) return;

    sounds.eat();
    const burstId = Date.now();
    setEatBurst({ x: food.x, y: food.y, id: burstId });
    setTimeout(() => {
      setEatBurst(curr => (curr && curr.id === burstId ? null : curr));
    }, 400);
    setScoreBump(true);
    setTimeout(() => setScoreBump(false), 200);
    if (newSnake.length % 10 === 0) {
      sounds.milestone();
      setMilestone(newSnake.length);
      setTimeout(() => setMilestone(null), 1200);
    }

    const newScore = scoreRef.current + 10;
    scoreRef.current = newScore;
    setScore(newScore);
    if (newScore > highScoreRef.current) {
      highScoreRef.current = newScore;
      setHighScore(newScore);
      localStorage.setItem('snake_best', newScore);
    }
    if (newSnake.length > bestLengthRef.current) {
      bestLengthRef.current = newSnake.length;
      setBestLength(newSnake.length);
      localStorage.setItem('snake_best_length', newSnake.length);
    }
    const speedStep = DIFFICULTIES[difficultyRef.current].speedDec;
    setSpeed(sp => Math.max(40, sp - speedStep));

    const nextFood = randomFood(newSnake);
    foodRef.current = nextFood;
    setFood(nextFood);
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
    snake, food, score, highScore, bestLength, gameState, speed, eatBurst, milestone, scoreBump,
    difficulty, setDifficulty, walls, setWalls,
    resetGame, setDirection, BOARD_SIZE,
  };
}
