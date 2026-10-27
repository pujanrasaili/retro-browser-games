// Hand-built Minesweeper boards for tests. createBoard places mines randomly, which
// makes win/lose/chord behavior impossible to assert exactly, so tests that need a
// known layout swap createBoard for this. Adjacent counts are computed here from the
// mine positions alone, independently of createBoard, so the fixture is not just a
// copy of the code it is used to test.
//
// Default layout (9x9, matching the "easy" dimensions and mine count of 10):
// a wall of mines down the right-hand column plus one at (0,7). Clicking any cell in
// the zero region (e.g. 4,0) floods the whole board in one move; the numbered cells
// beside the wall (e.g. 4,7, which touches three mines) reveal only themselves.
export const MINE_POSITIONS = [
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [0, 7],
];

export function buildFixtureBoard(mines = MINE_POSITIONS, size = 9) {
  const isMine = (r, c) => mines.some(([mr, mc]) => mr === r && mc === c);
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      let adjacent = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && isMine(nr, nc)) adjacent++;
        }
      }
      return {
        r, c, mine: isMine(r, c), revealed: false, flagged: false,
        adjacent: isMine(r, c) ? 0 : adjacent,
      };
    })
  );
}
