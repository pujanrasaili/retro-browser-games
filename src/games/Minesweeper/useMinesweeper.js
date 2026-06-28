import { useState, useEffect, useCallback, useRef } from 'react';
import { DIFFICULTIES, createBoard, floodReveal } from './mineUtils';
import { sounds } from '../../utils/sound';

export default function useMinesweeper() {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState(null);
  const [gameState, setGameState] = useState('idle');
  const [minesLeft, setMinesLeft] = useState(DIFFICULTIES.easy.mines);
  const [time, setTime] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [halfwayCelebrated, setHalfwayCelebrated] = useState(false);
  const halfwayShownRef = useRef(false);
  const [bestTimes, setBestTimes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mine_best') || '{}');
    } catch { return {}; }
  });
  const timerRef = useRef(null);

  const { rows, cols, mines } = DIFFICULTIES[difficulty];

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => setTime(t => Math.min(t + 1, 999)), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const resetGame = useCallback((diff = difficulty) => {
    setDifficulty(diff);
    setBoard(null);
    setGameState('idle');
    setMinesLeft(DIFFICULTIES[diff].mines);
    setTime(0);
    setFirstClick(true);
    halfwayShownRef.current = false;
  }, [difficulty]);

  const checkProgress = useCallback((b) => {
    const { rows, cols, mines } = DIFFICULTIES[difficulty];
    const totalCells = rows * cols;
    const totalSafeCells = totalCells - mines;
    let unrevealed = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (!b[r][c].revealed) unrevealed++;
    const revealedSafeCells = totalSafeCells - (unrevealed - mines);
    const percent = totalSafeCells > 0 ? revealedSafeCells / totalSafeCells : 0;
    return { won: unrevealed === mines, percent };
  }, [difficulty]);

  const handleReveal = useCallback((r, c) => {
    if (gameState === 'lost' || gameState === 'won') return;
    let currentBoard = board;
    if (firstClick || !currentBoard) {
      currentBoard = createBoard(rows, cols, mines, r, c);
      setFirstClick(false);
      setGameState('playing');
    }
    const cell = currentBoard[r][c];
    if (cell.revealed || cell.flagged) return;
    if (cell.mine) {
      sounds.explode();
      const newBoard = currentBoard.map(row =>
        row.map(cell => cell.mine ? { ...cell, revealed: true } : cell)
      );
      newBoard[r][c] = { ...newBoard[r][c], exploded: true };
      setBoard(newBoard);
      setGameState('lost');
      return;
    }
    const newBoard = floodReveal(currentBoard, r, c, rows, cols);
    setBoard(newBoard);
    const { won, percent } = checkProgress(newBoard);

    if (!halfwayShownRef.current && percent >= 0.5 && !won) {
      halfwayShownRef.current = true;
      sounds.milestone();
      setHalfwayCelebrated(true);
      setTimeout(() => setHalfwayCelebrated(false), 1200);
    }

    if (won) {
      if (difficulty === 'hard') {
        sounds.legendaryWin();
      } else {
        sounds.win();
      }
      setGameState('won');
      // Save best time
      setBestTimes(prev => {
        const current = prev[difficulty];
        if (!current || time < current) {
          const updated = { ...prev, [difficulty]: time };
          localStorage.setItem('mine_best', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    } else {
      sounds.reveal();
    }
  }, [board, gameState, firstClick, rows, cols, mines, checkProgress, difficulty, time]);

  const handleFlag = useCallback((e, r, c) => {
    e.preventDefault();
    if (gameState !== 'playing' && gameState !== 'idle') return;
    if (!board) return;
    const cell = board[r][c];
    if (cell.revealed) return;
    sounds.flag();
    const newBoard = board.map(row => row.map(c => ({ ...c })));
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setBoard(newBoard);
    setMinesLeft(m => newBoard[r][c].flagged ? m - 1 : m + 1);
  }, [board, gameState]);

  return {
    board, difficulty, gameState, minesLeft, time, bestTimes, halfwayCelebrated,
    rows, cols, mines,
    resetGame, handleReveal, handleFlag,
  };
}

export function chordReveal(board, r, c, rows, cols) {
  // Count adjacent flags
  let flagCount = 0;
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        if (board[nr][nc].flagged) flagCount++;
        else if (!board[nr][nc].revealed) neighbors.push([nr, nc]);
      }
    }
  }
  return { flagCount, neighbors };
}

export function useChord(board, gameState, rows, cols, handleReveal) {
  const handleChord = (r, c) => {
    if (!board || gameState !== 'playing') return;
    const cell = board[r][c];
    if (!cell.revealed || cell.adjacent === 0) return;
    const { flagCount, neighbors } = chordReveal(board, r, c, rows, cols);
    if (flagCount === cell.adjacent) {
      neighbors.forEach(([nr, nc]) => handleReveal(nr, nc));
    }
  };
  return handleChord;
}
