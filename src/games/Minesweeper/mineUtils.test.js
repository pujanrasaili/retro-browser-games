import { createBoard, floodReveal } from './mineUtils';

// Builds a hand-crafted 4x4 board with a single mine at (3,3), bypassing
// createBoard's randomness entirely so floodReveal can be tested against
// exact, known adjacent counts rather than random layouts.
function buildFixedBoard() {
  const board = Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 4 }, (_, c) => ({
      r, c, mine: false, revealed: false, flagged: false, adjacent: 0,
    }))
  );
  board[3][3].mine = true;
  // Only (2,2), (2,3), (3,2) touch the mine at (3,3)
  board[2][2].adjacent = 1;
  board[2][3].adjacent = 1;
  board[3][2].adjacent = 1;
  return board;
}

describe('floodReveal', () => {
  test('cascades through the connected zero-adjacent region from a corner click', () => {
    const board = buildFixedBoard();
    const result = floodReveal(board, 0, 0, 4, 4);
    // Every cell except the mine itself should end up revealed
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (r === 3 && c === 3) continue;
        expect(result[r][c].revealed).toBe(true);
      }
    }
  });

  test('never reveals the mine cell itself during a cascade', () => {
    const board = buildFixedBoard();
    const result = floodReveal(board, 0, 0, 4, 4);
    expect(result[3][3].revealed).toBe(false);
  });

  test('stops expanding past a numbered (non-zero adjacent) cell', () => {
    const board = buildFixedBoard();
    const result = floodReveal(board, 0, 0, 4, 4);
    // The numbered cells should be revealed themselves...
    expect(result[2][2].revealed).toBe(true);
    // ...but clicking directly on one in isolation should not cascade further
    const isolated = floodReveal(buildFixedBoard(), 2, 2, 4, 4);
    expect(isolated[2][2].revealed).toBe(true);
    expect(isolated[0][0].revealed).toBe(false); // unrelated corner untouched
  });

  test('does not reveal a flagged cell', () => {
    const board = buildFixedBoard();
    board[1][1].flagged = true;
    const result = floodReveal(board, 0, 0, 4, 4);
    expect(result[1][1].revealed).toBe(false);
  });

  test('does not mutate the original board (returns a new one)', () => {
    const board = buildFixedBoard();
    floodReveal(board, 0, 0, 4, 4);
    expect(board[0][0].revealed).toBe(false);
  });
});

describe('createBoard', () => {
  test('places exactly the requested number of mines', () => {
    const board = createBoard(9, 9, 10, 4, 4);
    const mineCount = board.flat().filter(cell => cell.mine).length;
    expect(mineCount).toBe(10);
  });

  test('never places a mine in the 3x3 safety zone around the first click', () => {
    const board = createBoard(9, 9, 10, 4, 4);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        expect(board[4 + dr][4 + dc].mine).toBe(false);
      }
    }
  });

  test('correctly computes adjacent counts for every non-mine cell', () => {
    const rows = 9, cols = 9;
    const board = createBoard(rows, cols, 10, 4, 4);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c].mine) continue;
        let actualNeighborMines = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
              actualNeighborMines++;
            }
          }
        }
        expect(board[r][c].adjacent).toBe(actualNeighborMines);
      }
    }
  });

  test('produces a board with the requested dimensions', () => {
    const board = createBoard(16, 30, 99, 0, 0);
    expect(board.length).toBe(16);
    expect(board[0].length).toBe(30);
  });
});
