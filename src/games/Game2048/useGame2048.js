import { useState, useCallback, useRef, useEffect } from 'react';
import { sounds } from '../../utils/sound';
import { newBoard, move, addRandomTile, hasWon, isGameOver, SIZE } from './logic';

const BEST_KEY = 'game2048_best';

const KEY_DIRECTIONS = {
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
};

const emptyBoard = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

// A saved best score is only trusted if it is a positive whole number; anything else
// (missing, garbage, negative) counts as no best yet instead of showing NaN.
function readBest() {
  const saved = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
  return Number.isFinite(saved) && saved > 0 ? saved : 0;
}

// gameState: 'idle' (before the first game), 'playing', 'won' (a 2048 tile exists and the
// player has not yet chosen to keep going) or 'over' (no move left).
//
// `random` and `createBoard` can be injected so tests can script spawns and set up an
// exact starting position; the game itself never needs to pass them.
export default function useGame2048({ random = Math.random, createBoard } = {}) {
  const [board, setBoard] = useState(emptyBoard);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const [gameState, setGameState] = useState('idle');

  // Refs mirror the state so a move reads the latest values and computes its result once,
  // then applies plain values. Doing the scoring, sounds and storage writes inside state
  // updater functions would run them twice under React.StrictMode (as it did in Snake).
  const boardRef = useRef(board);
  const scoreRef = useRef(0);
  const bestRef = useRef(best);
  const statusRef = useRef('idle');
  const keptPlayingRef = useRef(false);
  const randomRef = useRef(random);
  const createBoardRef = useRef(createBoard);
  randomRef.current = random;
  createBoardRef.current = createBoard;

  const setStatus = useCallback((status) => {
    statusRef.current = status;
    setGameState(status);
  }, []);

  const startGame = useCallback(() => {
    const fresh = createBoardRef.current ? createBoardRef.current() : newBoard(randomRef.current);
    boardRef.current = fresh;
    setBoard(fresh);
    scoreRef.current = 0;
    setScore(0);
    keptPlayingRef.current = false;
    setStatus('playing');
  }, [setStatus]);

  // Returns true if the move changed the board. A move that changes nothing does not
  // spawn a tile, score, or make a sound.
  const slide = useCallback((direction) => {
    if (statusRef.current !== 'playing') return false;
    const result = move(boardRef.current, direction);
    if (!result.moved) return false;

    const next = addRandomTile(result.board, randomRef.current);
    boardRef.current = next;
    setBoard(next);

    if (result.score > 0) {
      scoreRef.current += result.score;
      setScore(scoreRef.current);
      if (scoreRef.current > bestRef.current) {
        bestRef.current = scoreRef.current;
        setBest(bestRef.current);
        localStorage.setItem(BEST_KEY, String(bestRef.current));
      }
      sounds.eat();
    } else {
      sounds.move();
    }

    if (!keptPlayingRef.current && hasWon(next)) {
      setStatus('won');
      sounds.win();
    } else if (isGameOver(next)) {
      setStatus('over');
      sounds.gameOver();
    }
    return true;
  }, [setStatus]);

  // After reaching 2048 the player can carry on. If the board happens to be stuck at that
  // moment there is nothing left to play, so the game ends.
  const keepPlaying = useCallback(() => {
    if (statusRef.current !== 'won') return;
    keptPlayingRef.current = true;
    if (isGameOver(boardRef.current)) {
      setStatus('over');
      sounds.gameOver();
    } else {
      setStatus('playing');
    }
  }, [setStatus]);

  // Keyboard: arrow keys or WASD move; Space or Enter starts a game from the idle or
  // game-over screen and dismisses the win screen.
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts (Ctrl+S, ...) alone
      if (e.key === ' ' || e.key === 'Enter') {
        if (gameState === 'idle' || gameState === 'over') {
          e.preventDefault();
          startGame();
        } else if (gameState === 'won') {
          e.preventDefault();
          keepPlaying();
        }
        return;
      }
      const direction = KEY_DIRECTIONS[e.key];
      if (!direction || gameState !== 'playing') return;
      // Only block the page from scrolling while the arrows are actually steering a game.
      if (e.key.startsWith('Arrow')) e.preventDefault();
      slide(direction);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, slide, startGame, keepPlaying]);

  return { board, score, best, gameState, startGame, slide, keepPlaying, SIZE };
}
