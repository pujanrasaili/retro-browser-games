export const DIFFICULTIES = {
  easy:   { rows: 9,  cols: 9,  mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard:   { rows: 16, cols: 30, mines: 99 },
};

export function createBoard(rows, cols, mines, firstRow, firstCol) {
  // Place mines avoiding first click area
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r, c, mine: false, revealed: false, flagged: false, adjacent: 0,
    }))
  );

  const safe = new Set();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = firstRow + dr, nc = firstCol + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
        safe.add(`${nr},${nc}`);
    }

  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!cells[r][c].mine && !safe.has(`${r},${c}`)) {
      cells[r][c].mine = true;
      placed++;
    }
  }

  // Calculate adjacent counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cells[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cells[nr][nc].mine)
            count++;
        }
      cells[r][c].adjacent = count;
    }
  }
  return cells;
}

export function floodReveal(board, r, c, rows, cols) {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const stack = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop();
    const cell = newBoard[cr][cc];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adjacent === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = cr + dr, nc = cc + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !newBoard[nr][nc].revealed)
            stack.push([nr, nc]);
        }
    }
  }
  return newBoard;
}

export const NUM_COLORS = ['', '#00f5ff', '#39ff14', '#ff4757', '#bf5fff', '#ff8c00', '#00bfff', '#ff1493', '#ffffff'];
