import { useState, useEffect, useCallback, useRef } from 'react';
import { DIFFICULTIES, createBoard, floodReveal } from './mineUtils';

export default function useMinesweeper() {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState(null);
  const [gameState, setGameState] = useState('idle'); // idle | playing | won | lost
  const [minesLeft, setMinesLeft] = useState(DIFFICULTIES.easy.mines);
  const [time, setTime] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const timerRef = useRef(null);

  const { rows, cols, mines } = DIFFICULTIES[difficulty];

  // Timer
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
  }, [difficulty]);

  const checkWin = useCallback((b) => {
    const { rows, cols, mines } = DIFFICULTIES[difficulty];
    let unrevealed = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (!b[r][c].revealed) unrevealed++;
    return unrevealed === mines;
  }, [difficulty]);

  const handleReveal = useCallback((r, c) => {
    if (gameState === 'lost' || gameState === 'won') return;

    let currentBoard = board;

    // First click — generate board
    if (firstClick || !currentBoard) {
      currentBoard = createBoard(rows, cols, mines, r, c);
      setFirstClick(false);
      setGameState('playing');
    }

    const cell = currentBoard[r][c];
    if (cell.revealed || cell.flagged) return;

    if (cell.mine) {
      // Reveal all mines
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

    if (checkWin(newBoard)) {
      setGameState('won');
    }
  }, [board, gameState, firstClick, rows, cols, mines, checkWin]);

  const handleFlag = useCallback((e, r, c) => {
    e.preventDefault();
    if (gameState !== 'playing' && gameState !== 'idle') return;
    if (!board) return;
    const cell = board[r][c];
    if (cell.revealed) return;

    const newBoard = board.map(row => row.map(c => ({ ...c })));
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setBoard(newBoard);
    setMinesLeft(m => newBoard[r][c].flagged ? m - 1 : m + 1);
  }, [board, gameState]);

  return {
    board, difficulty, gameState, minesLeft, time,
    rows, cols, mines,
    resetGame, handleReveal, handleFlag,
  };
}
