import { rotatePiece, PIECES } from './pieces';

describe('rotatePiece', () => {
  test('rotates the I piece from horizontal to vertical', () => {
    const rotated = rotatePiece(PIECES.I.shape);
    expect(rotated).toEqual([[1], [1], [1], [1]]);
  });

  test('rotating the O piece (2x2 square) is invariant', () => {
    const rotated = rotatePiece(PIECES.O.shape);
    expect(rotated).toEqual(PIECES.O.shape);
  });

  test('rotates the T piece to the manually traced expected shape', () => {
    // T piece: [[0,1,0],[1,1,1]] rotated 90° clockwise
    const rotated = rotatePiece(PIECES.T.shape);
    expect(rotated).toEqual([[1, 0], [1, 1], [1, 0]]);
  });

  test('swaps row/column dimensions correctly', () => {
    const shape = PIECES.L.shape; // 2 rows x 3 cols
    const rotated = rotatePiece(shape);
    expect(rotated.length).toBe(shape[0].length); // new rows = old cols
    expect(rotated[0].length).toBe(shape.length); // new cols = old rows
  });

  test('rotating any piece 4 times returns it to the original shape', () => {
    Object.values(PIECES).forEach(({ shape }) => {
      let rotated = shape;
      for (let i = 0; i < 4; i++) {
        rotated = rotatePiece(rotated);
      }
      expect(rotated).toEqual(shape);
    });
  });
});
