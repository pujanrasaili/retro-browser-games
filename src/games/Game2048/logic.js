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
