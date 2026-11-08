import { emptyCells, addRandomTile, newBoard, hasWon, canMove, isGameOver } from './logic';

// Returns a stand-in for Math.random that yields the given numbers in order, so a test
// decides exactly which cell and which value get picked.
const scripted = (...values) => {
  let i = 0;
  return () => values[i++];
};

const count = (board) => board.flat().filter(v => v !== 0).length;

describe('emptyCells', () => {
  test('lists the empty cells in reading order', () => {
    const board = [
      [2, 0, 0, 4],
      [0, 8, 0, 0],
      [2, 2, 2, 2],
      [4, 4, 4, 4],
    ];
    expect(emptyCells(board)).toEqual([[0, 1], [0, 2], [1, 0], [1, 2], [1, 3]]);
  });

  test('a full board has none', () => {
    expect(emptyCells([[2, 4], [8, 16]])).toEqual([]);
  });
});

describe('addRandomTile', () => {
  const board = [
    [2, 0, 4, 8],
    [0, 0, 0, 0],
    [2, 4, 2, 4],
    [4, 2, 4, 0],
  ]; // empty cells: (0,1) (1,0) (1,1) (1,2) (1,3) (3,3)

  test('uses the first random number to choose the cell: low picks the first, high the last', () => {
    expect(addRandomTile(board, scripted(0, 0))[0][1]).toBe(2);
    expect(addRandomTile(board, scripted(0.999, 0))[3][3]).toBe(2);
  });

  test('maps the random number onto the empty cells evenly', () => {
    // 6 empty cells, so 0.5 -> index 3 -> (1,2)
    expect(addRandomTile(board, scripted(0.5, 0))[1][2]).toBe(2);
  });

  test('uses the second random number for the value: a 2 below 0.9, a 4 from 0.9 up', () => {
    expect(addRandomTile(board, scripted(0, 0.89))[0][1]).toBe(2);
    expect(addRandomTile(board, scripted(0, 0.9))[0][1]).toBe(4);
    expect(addRandomTile(board, scripted(0, 0.999))[0][1]).toBe(4);
  });

  test('adds exactly one tile and never overwrites an existing one', () => {
    const next = addRandomTile(board, scripted(0.3, 0.1));
    expect(count(next)).toBe(count(board) + 1);
    board.forEach((row, r) => row.forEach((value, c) => {
      if (value !== 0) expect(next[r][c]).toBe(value);
    }));
  });

  test('does not change the board it is given', () => {
    const copy = board.map(row => [...row]);
    addRandomTile(board, scripted(0, 0));
    expect(board).toEqual(copy);
  });

  test('a full board comes back unchanged', () => {
    const full = [[2, 4], [8, 16]];
    expect(addRandomTile(full, scripted(0, 0))).toEqual(full);
  });

  test('about nine spawns in ten are a 2 (seeded, so it cannot flake)', () => {
    let seed = 987654321;
    const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    let twos = 0;
    const N = 5000;
    const empty = Array.from({ length: 4 }, () => Array(4).fill(0));
    for (let i = 0; i < N; i++) {
      const tile = addRandomTile(empty, random).flat().find(v => v !== 0);
      if (tile === 2) twos++;
    }
    expect(twos / N).toBeGreaterThan(0.87);
    expect(twos / N).toBeLessThan(0.93);
  });
});

describe('newBoard', () => {
  test('is a 4x4 board holding exactly two starting tiles, each a 2 or a 4', () => {
    for (let i = 0; i < 50; i++) {
      const board = newBoard();
      expect(board).toHaveLength(4);
      board.forEach(row => expect(row).toHaveLength(4));
      expect(count(board)).toBe(2);
      board.flat().filter(v => v !== 0).forEach(v => expect([2, 4]).toContain(v));
    }
  });

  test('places the two tiles in different cells', () => {
    // Both draws ask for index 0 of the remaining empties: the second lands in the next cell
    const board = newBoard(scripted(0, 0, 0, 0));
    expect(board[0][0]).toBe(2);
    expect(board[0][1]).toBe(2);
    expect(count(board)).toBe(2);
  });
});

describe('hasWon', () => {
  const withTile = (value) => [[0, 0, 0, 0], [0, value, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

  test('is true once a 2048 tile exists', () => {
    expect(hasWon(withTile(2048))).toBe(true);
  });
  test('is still true for tiles above 2048 (play can continue past it)', () => {
    expect(hasWon(withTile(4096))).toBe(true);
  });
  test('is false below 2048', () => {
    expect(hasWon(withTile(1024))).toBe(false);
  });
  test('accepts a different target', () => {
    expect(hasWon(withTile(8), 8)).toBe(true);
    expect(hasWon(withTile(4), 8)).toBe(false);
  });
});

describe('canMove and isGameOver', () => {
  // Every tile is a different number, so no two neighbours are equal anywhere. Each test
  // below then makes exactly ONE pair equal by copying a neighbour's value into a cell,
  // which guarantees the pair it creates is the only one. (Editing a checkerboard instead
  // creates horizontal and vertical pairs at once, so a test could not tell the two
  // checks apart.)
  const stuck = () => [
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [512, 1024, 2048, 4096],
    [8192, 16384, 32768, 65536],
  ];

  test('a full board where no two neighbours are equal is game over', () => {
    expect(canMove(stuck())).toBe(false);
    expect(isGameOver(stuck())).toBe(true);
  });

  test('a board with an empty cell can always move', () => {
    const board = stuck();
    board[3][3] = 0;
    expect(canMove(board)).toBe(true);
    expect(isGameOver(board)).toBe(false);
  });

  test.each([
    ['side by side at the start of a row', 0, 1, 0, 0],
    ['side by side in the last two columns', 3, 3, 3, 2],
    ['stacked at the top of a column', 1, 0, 0, 0],
    ['stacked in the last two rows', 3, 3, 2, 3],
  ])('exactly one equal pair, %s, means a move exists', (_name, r, c, fromR, fromC) => {
    const board = stuck();
    board[r][c] = board[fromR][fromC]; // copy a neighbour's value: the only equal pair
    expect(canMove(board)).toBe(true);
    expect(isGameOver(board)).toBe(false);
  });

  test('agrees with move(): on a full board a move exists exactly when some direction changes it', () => {
    const { move } = require('./logic');
    const dirs = ['left', 'right', 'up', 'down'];
    expect(dirs.some(d => move(stuck(), d).moved)).toBe(false);
    const horizontal = stuck(); horizontal[0][1] = horizontal[0][0];
    const vertical = stuck(); vertical[1][0] = vertical[0][0];
    [horizontal, vertical].forEach((board) => {
      expect(dirs.some(d => move(board, d).moved)).toBe(true);
      expect(canMove(board)).toBe(true);
    });
  });
});
