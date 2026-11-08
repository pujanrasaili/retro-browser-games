// Pure 2048 game logic: no React, no randomness, no storage. A board is a 4x4 array of
// numbers (0 = empty). Every function returns new arrays and never mutates its input.

export const SIZE = 4;

// Slides one row toward index 0 and merges equal neighbours. A tile merges at most once
// per move, and merging starts from the leading edge, so [2,2,2,0] becomes [4,2,0,0]
// (not [2,4,0,0]) and [2,2,2,2] becomes [4,4,0,0] (not [8,0,0,0]).
// Returns the new row, the points scored (the value of each tile created by a merge),
// and whether anything actually moved.
export function slideRow(row) {
  const tiles = row.filter(value => value !== 0);
  const slid = [];
  let score = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2;
      slid.push(merged);
      score += merged;
      i++; // the next tile was consumed by this merge and cannot merge again
    } else {
      slid.push(tiles[i]);
    }
  }
  while (slid.length < row.length) slid.push(0);
  const moved = slid.some((value, i) => value !== row[i]);
  return { row: slid, score, moved };
}

const transpose = (board) => board[0].map((_, c) => board.map(row => row[c]));
const reverseRows = (board) => board.map(row => [...row].reverse());

// Moves the whole board 'left', 'right', 'up' or 'down'. Every direction is the same
// slide-left operation applied to a flipped view of the board, then flipped back.
export function move(board, direction) {
  let view;
  let unflip;
  switch (direction) {
    case 'left':  view = board;                        unflip = b => b; break;
    case 'right': view = reverseRows(board);           unflip = reverseRows; break;
    case 'up':    view = transpose(board);             unflip = transpose; break;
    case 'down':  view = reverseRows(transpose(board)); unflip = b => transpose(reverseRows(b)); break;
    default: throw new Error(`Unknown direction: ${direction}`);
  }
  let score = 0;
  let moved = false;
  const slid = view.map((row) => {
    const result = slideRow(row);
    score += result.score;
    moved = moved || result.moved;
    return result.row;
  });
  return { board: unflip(slid), score, moved };
}

// Coordinates [row, col] of every empty cell, in reading order.
export function emptyCells(board) {
  const cells = [];
  board.forEach((row, r) => row.forEach((value, c) => {
    if (value === 0) cells.push([r, c]);
  }));
  return cells;
}

// Returns a new board with one new tile (a 2 nine times in ten, otherwise a 4) in a
// random empty cell. `random` is injectable so tests can script the outcome. It is
// called twice, in this order: first to choose the cell, then to choose the value.
// A board with no empty cell comes back unchanged.
export function addRandomTile(board, random = Math.random) {
  const next = board.map(row => [...row]);
  const empties = emptyCells(next);
  if (empties.length === 0) return next;
  const [r, c] = empties[Math.floor(random() * empties.length)];
  next[r][c] = random() < 0.9 ? 2 : 4;
  return next;
}

// A fresh game: an empty board with two starting tiles.
export function newBoard(random = Math.random) {
  const empty = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  return addRandomTile(addRandomTile(empty, random), random);
}

// True once any tile has reached the target (2048 by default). Higher tiles count too,
// because players can keep playing past 2048.
export function hasWon(board, target = 2048) {
  return board.some(row => row.some(value => value >= target));
}

// A move is possible if there is an empty cell or two equal tiles are side by side.
export function canMove(board) {
  if (emptyCells(board).length > 0) return true;
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (c + 1 < board[r].length && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < board.length && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

export function isGameOver(board) {
  return !canMove(board);
}
