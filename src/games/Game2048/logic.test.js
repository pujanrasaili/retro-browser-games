import { slideRow, move } from './logic';

describe('slideRow', () => {
  test.each([
    // [description, input, expected row, expected score]
    ['an empty row stays empty', [0, 0, 0, 0], [0, 0, 0, 0], 0],
    ['a tile already at the edge stays put', [2, 0, 0, 0], [2, 0, 0, 0], 0],
    ['a tile slides to the edge', [0, 0, 0, 2], [2, 0, 0, 0], 0],
    ['two equal neighbours merge', [2, 2, 0, 0], [4, 0, 0, 0], 4],
    ['equal tiles merge across a gap', [2, 0, 2, 0], [4, 0, 0, 0], 4],
    ['different tiles do not merge, they just pack', [2, 0, 4, 0], [2, 4, 0, 0], 0],
    ['three in a row merge the leading pair only', [2, 2, 2, 0], [4, 2, 0, 0], 4],
    ['four in a row make two merges, not a chain', [2, 2, 2, 2], [4, 4, 0, 0], 8],
    ['a merged tile cannot merge again in the same move', [4, 4, 8, 0], [8, 8, 0, 0], 8],
    ['two separate merges score both', [2, 2, 4, 4], [4, 8, 0, 0], 12],
    ['a full row with no equal neighbours is unchanged', [2, 4, 2, 4], [2, 4, 2, 4], 0],
    ['far-apart equal tiles merge', [8, 0, 0, 8], [16, 0, 0, 0], 16],
  ])('%s', (_name, input, expectedRow, expectedScore) => {
    const result = slideRow(input);
    expect(result.row).toEqual(expectedRow);
    expect(result.score).toBe(expectedScore);
  });

  test('reports moved only when the row actually changed', () => {
    expect(slideRow([0, 0, 0, 2]).moved).toBe(true);
    expect(slideRow([2, 2, 0, 0]).moved).toBe(true);
    expect(slideRow([2, 0, 0, 0]).moved).toBe(false);
    expect(slideRow([2, 4, 2, 4]).moved).toBe(false);
    expect(slideRow([0, 0, 0, 0]).moved).toBe(false);
  });

  test('does not change the row it is given', () => {
    const input = [2, 2, 0, 4];
    slideRow(input);
    expect(input).toEqual([2, 2, 0, 4]);
  });

  test('works on a row of any length', () => {
    expect(slideRow([2, 2, 2]).row).toEqual([4, 2, 0]);
  });
});

describe('move', () => {
  // Each expected board below was worked out by hand.
  const board = [
    [2, 0, 2, 4],
    [0, 0, 0, 0],
    [4, 4, 0, 0],
    [2, 2, 2, 2],
  ];

  test('left slides every row toward the left edge', () => {
    const result = move(board, 'left');
    expect(result.board).toEqual([
      [4, 4, 0, 0],
      [0, 0, 0, 0],
      [8, 0, 0, 0],
      [4, 4, 0, 0],
    ]);
    expect(result.score).toBe(4 + 8 + 8);
    expect(result.moved).toBe(true);
  });

  test('right slides every row toward the right edge', () => {
    const result = move(board, 'right');
    expect(result.board).toEqual([
      [0, 0, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 8],
      [0, 0, 4, 4],
    ]);
    expect(result.score).toBe(4 + 8 + 8);
  });

  test('up slides every column toward the top', () => {
    const result = move(board, 'up');
    expect(result.board).toEqual([
      [2, 4, 4, 4],
      [4, 2, 0, 2],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    expect(result.score).toBe(4);
  });

  test('down slides every column toward the bottom', () => {
    const result = move(board, 'down');
    expect(result.board).toEqual([
      [0, 0, 0, 0],
      [2, 0, 0, 0],
      [4, 4, 0, 4],
      [2, 2, 4, 2],
    ]);
    expect(result.score).toBe(4);
  });

  test('a move that changes nothing reports moved: false and scores 0', () => {
    const stuck = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    ['left', 'right', 'up', 'down'].forEach((direction) => {
      const result = move(stuck, direction);
      expect(result.moved).toBe(false);
      expect(result.score).toBe(0);
      expect(result.board).toEqual(stuck);
    });
  });

  test('does not change the board it is given', () => {
    const copy = board.map(row => [...row]);
    ['left', 'right', 'up', 'down'].forEach(direction => move(board, direction));
    expect(board).toEqual(copy);
  });

  test('rejects an unknown direction', () => {
    expect(() => move(board, 'sideways')).toThrow('Unknown direction: sideways');
  });

  // A seeded generator keeps this deterministic: it is a property check over many
  // boards, not a source of flaky failures.
  test('merging never creates or destroys value: the board total is unchanged', () => {
    let seed = 12345;
    const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const values = [0, 0, 0, 2, 4, 8, 16, 32];
    for (let n = 0; n < 300; n++) {
      const random = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => values[Math.floor(next() * values.length)]));
      const total = (b) => b.flat().reduce((a, c) => a + c, 0);
      ['left', 'right', 'up', 'down'].forEach((direction) => {
        const result = move(random, direction);
        expect(total(result.board)).toBe(total(random));
        expect(result.moved).toBe(JSON.stringify(result.board) !== JSON.stringify(random));
      });
    }
  });
});
