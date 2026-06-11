// Tetris pieces (Tetrominoes)
export const PIECES = {
  I: {
    shape: [[1,1,1,1]],
    color: '#00f5ff',
    shadow: 'rgba(0, 245, 255, 0.4)',
  },
  O: {
    shape: [[1,1],[1,1]],
    color: '#ffd700',
    shadow: 'rgba(255, 215, 0, 0.4)',
  },
  T: {
    shape: [[0,1,0],[1,1,1]],
    color: '#bf5fff',
    shadow: 'rgba(191, 95, 255, 0.4)',
  },
  S: {
    shape: [[0,1,1],[1,1,0]],
    color: '#39ff14',
    shadow: 'rgba(57, 255, 20, 0.4)',
  },
  Z: {
    shape: [[1,1,0],[0,1,1]],
    color: '#ff4757',
    shadow: 'rgba(255, 71, 87, 0.4)',
  },
  J: {
    shape: [[1,0,0],[1,1,1]],
    color: '#ff8c00',
    shadow: 'rgba(255, 140, 0, 0.4)',
  },
  L: {
    shape: [[0,0,1],[1,1,1]],
    color: '#00bfff',
    shadow: 'rgba(0, 191, 255, 0.4)',
  },
};

export const PIECE_KEYS = Object.keys(PIECES);

export function randomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  return { key, ...PIECES[key], x: 3, y: 0 };
}

export function rotatePiece(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  return rotated;
}
