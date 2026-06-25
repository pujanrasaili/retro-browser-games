import { useState, useEffect, useCallback, useRef } from 'react';
import { randomPiece, rotatePiece } from './pieces';
import { sounds } from '../../utils/sound';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 800;

function emptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

function isValid(shape, x, y, board) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = x + c, ny = y + r;
      if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
  }
  return true;
}

function placePiece(piece, board) {
  const newBoard = board.map(row => [...row]);
  piece.shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell && piece.y + r >= 0) {
        newBoard[piece.y + r][piece.x + c] = { color: piece.color, shadow: piece.shadow };
      }
    });
  });
  return newBoard;
}

function clearLines(board) {
  const cleared = board.filter(row => row.some(cell => !cell));
  const linesCleared = BOARD_HEIGHT - cleared.length;
  const empty = Array.from({ length: linesCleared }, () => Array(BOARD_WIDTH).fill(null));
  return { newBoard: [...empty, ...cleared], linesCleared };
}

function getGhost(piece, board) {
  let ghostY = piece.y;
  while (isValid(piece.shape, piece.x, ghostY + 1, board)) ghostY++;
  return { ...piece, y: ghostY };
}

const SCORE_TABLE = [0, 100, 300, 500, 800];

export default function useTetrisGame() {
  const [board, setBoard] = useState(emptyBoard());
  const [current, setCurrent] = useState(null);
  const [next, setNext] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('tetris_best') || '0', 10));
  const [lines, setLines] = useState(0);
  const [bestLines, setBestLines] = useState(() => parseInt(localStorage.getItem('tetris_best_lines') || '0', 10));
  const [level, setLevel] = useState(1);
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [tetrisCallout, setTetrisCallout] = useState(false);
  const [gameState, setGameState] = useState('idle');
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const boardRef = useRef(board);
  const currentRef = useRef(current);
  const levelRef = useRef(level);
  boardRef.current = board;
  currentRef.current = current;
  levelRef.current = level;

  const spawnPiece = useCallback((boardState) => {
    const piece = randomPiece();
    if (!isValid(piece.shape, piece.x, piece.y, boardState)) {
      sounds.gameOver();
      setGameState('over');
      return;
    }
    setCurrent(piece);
    setNext(randomPiece());
  }, []);

  const resetGame = useCallback(() => {
    const b = emptyBoard();
    setBoard(b);
    setScore(0);
    setLines(0);
    setLevel(1);
    setSpeed(INITIAL_SPEED);
    setGameState('playing');
    setCurrent(randomPiece());
    setNext(randomPiece());
  }, []);

  const lockPiece = useCallback(() => {
    const piece = currentRef.current;
    const b = boardRef.current;
    if (!piece) return;
    const newBoard = placePiece(piece, b);
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
    setBoard(clearedBoard);
    if (linesCleared > 0) {
      if (linesCleared === 4) {
        sounds.tetrisClear();
        setTetrisCallout(true);
        setTimeout(() => setTetrisCallout(false), 900);
      } else {
        sounds.lineClear();
      }
      setLines(prev => {
        const total = prev + linesCleared;
        const newLevel = Math.floor(total / 10) + 1;
        setLevel(currentLevel => {
          if (newLevel > currentLevel) {
            sounds.levelUp();
            setJustLeveledUp(true);
            setTimeout(() => setJustLeveledUp(false), 500);
          }
          return newLevel;
        });
        setSpeed(Math.max(100, INITIAL_SPEED - (newLevel - 1) * 70));
        setBestLines(b => { const nb = Math.max(b, total); localStorage.setItem('tetris_best_lines', nb); return nb; });
        return total;
      });
      setScore(prev => {
        const ns = prev + SCORE_TABLE[linesCleared] * levelRef.current;
        setHighScore(h => { const nh = Math.max(h, ns); localStorage.setItem('tetris_best', nh); return nh; });
        return ns;
      });
    } else {
      sounds.drop();
    }
    spawnPiece(clearedBoard);
  }, [spawnPiece]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      const piece = currentRef.current;
      const b = boardRef.current;
      if (!piece) return;
      if (isValid(piece.shape, piece.x, piece.y + 1, b)) {
        setCurrent(p => ({ ...p, y: p.y + 1 }));
      } else {
        lockPiece();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [gameState, speed, lockPiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      // Prevent page scroll on arrow keys and space
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && gameState === 'idle') { resetGame(); return; }
      if (e.key === ' ' && gameState === 'over') { resetGame(); return; }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
        return;
      }
      if (gameState !== 'playing') return;

      const piece = currentRef.current;
      const b = boardRef.current;
      if (!piece) return;

      if (e.key === 'ArrowLeft') {
        if (isValid(piece.shape, piece.x - 1, piece.y, b))
          setCurrent(p => ({ ...p, x: p.x - 1 }));
      } else if (e.key === 'ArrowRight') {
        if (isValid(piece.shape, piece.x + 1, piece.y, b))
          setCurrent(p => ({ ...p, x: p.x + 1 }));
      } else if (e.key === 'ArrowDown') {
        if (isValid(piece.shape, piece.x, piece.y + 1, b)) {
          setCurrent(p => ({ ...p, y: p.y + 1 }));
          setScore(s => s + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X') {
        const rotated = rotatePiece(piece.shape);
        if (isValid(rotated, piece.x, piece.y, b)) {
          sounds.rotate();
          setCurrent(p => ({ ...p, shape: rotated }));
        } else if (isValid(rotated, piece.x - 1, piece.y, b)) {
          sounds.rotate();
          setCurrent(p => ({ ...p, shape: rotated, x: p.x - 1 }));
        } else if (isValid(rotated, piece.x + 1, piece.y, b)) {
          sounds.rotate();
          setCurrent(p => ({ ...p, shape: rotated, x: p.x + 1 }));
        }
      } else if (e.key === ' ') {
        // Hard drop
        let dropY = piece.y;
        while (isValid(piece.shape, piece.x, dropY + 1, b)) dropY++;
        sounds.drop();
        setScore(s => s + (dropY - piece.y) * 2);
        setCurrent(p => ({ ...p, y: dropY }));
        setTimeout(() => lockPiece(), 30);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, resetGame, lockPiece]);

  const moveLeft  = useCallback(() => { const p = currentRef.current; const b = boardRef.current; if (p && isValid(p.shape, p.x-1, p.y, b)) { sounds.move(); setCurrent(prev => ({...prev, x: prev.x-1})); } }, []);
  const moveRight = useCallback(() => { const p = currentRef.current; const b = boardRef.current; if (p && isValid(p.shape, p.x+1, p.y, b)) { sounds.move(); setCurrent(prev => ({...prev, x: prev.x+1})); } }, []);
  const moveDown  = useCallback(() => { const p = currentRef.current; const b = boardRef.current; if (p && isValid(p.shape, p.x, p.y+1, b)) { sounds.move(); setCurrent(prev => ({...prev, y: prev.y+1})); setScore(s => s+1); } }, []);
  const rotate    = useCallback(() => {
    const p = currentRef.current; const b = boardRef.current; if (!p) return;
    const rotated = rotatePiece(p.shape);
    if (isValid(rotated, p.x, p.y, b)) { sounds.rotate(); setCurrent(prev => ({...prev, shape: rotated})); }
    else if (isValid(rotated, p.x-1, p.y, b)) { sounds.rotate(); setCurrent(prev => ({...prev, shape: rotated, x: prev.x-1})); }
    else if (isValid(rotated, p.x+1, p.y, b)) { sounds.rotate(); setCurrent(prev => ({...prev, shape: rotated, x: prev.x+1})); }
  }, []);
  const hardDrop  = useCallback(() => {
    const p = currentRef.current; const b = boardRef.current; if (!p) return;
    let dropY = p.y;
    while (isValid(p.shape, p.x, dropY+1, b)) dropY++;
    sounds.drop();
    setScore(s => s + (dropY - p.y) * 2);
    setCurrent(prev => ({...prev, y: dropY}));
    setTimeout(() => lockPiece(), 30);
  }, [lockPiece]);

  const ghost = current && gameState === 'playing' ? getGhost(current, board) : null;

  // bestLines exposed
  return {
    board, current, next, ghost,
    score, highScore, lines, level, justLeveledUp, tetrisCallout,
    gameState, resetGame, bestLines,
    moveLeft, moveRight, moveDown, rotate, hardDrop,
    BOARD_WIDTH, BOARD_HEIGHT,
  };
}
