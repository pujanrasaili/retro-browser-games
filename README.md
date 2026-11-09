<div align="center">

# Retro Browser Games

**A collection of classic arcade games built with React — pure neon nostalgia in your browser.**

[![React](https://img.shields.io/badge/React-18.2-61dafb?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-f7df1e?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Animations-1572b6?style=flat-square&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

[ Play Now](#getting-started) · [ Report Bug](https://github.com/pujanrasaili/retro-browser-games/issues) · [ Request Feature](https://github.com/pujanrasaili/retro-browser-games/issues)

</div>

---

## Games

| Game | Status | Description |
|------|--------|-------------|
| 🐍 **Snake** | Live | Classic snake — eat food, grow longer, don't crash! Speed increases as you score. |
| 🧱 **Tetris** | Live | Stack falling tetrominoes, clear lines, survive as long as possible. Speed increases every 10 lines. |
| 💣 **Minesweeper** | Live | Uncover all safe tiles without triggering a mine. 3 difficulty levels: Easy, Medium, Hard. |
| 🏓 **Pong** | Live | Two-paddle ball game — beat the AI or play 2-player locally. First to 7 wins. |
| 🔢 **2048** | Live | Slide and merge numbered tiles to make 2048, then keep going for a higher score. Arrows, WASD or swipe. |

---

## Features

-  **5 fully playable games** — Snake, Tetris, Minesweeper, Pong, 2048
-  **No extra dependencies** — pure React + CSS, zero UI libraries
-  **Neon retro aesthetic** — glowing greens, deep blacks, pixel fonts
-  **Mobile friendly** — on-screen D-pad + swipe gesture support
-  **Persistent high scores** — saved to localStorage, survives refresh
-  **Increasing difficulty** — Snake speeds up, Tetris gets faster each level
-  **Pause / resume** — hit `Space` or `P` anytime
-  **Sound effects** — synthesized via Web Audio API, global mute button
-  **Tetris hold piece** — save a piece for later with `C` or `Shift`
-  **Snake walls mode** — toggle between wrap-around and lethal borders
-  **Milestone celebrations** — mid-game callouts for length/progress achievements

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher
- npm v8 or higher

### Installation

```bash
# Clone the repo
git clone https://github.com/pujanrasaili/retro-browser-games.git

# Navigate into the project
cd retro-browser-games

# Install dependencies
npm install --legacy-peer-deps

# Fix ajv module (required for react-scripts 5)
npm install ajv@^8 --legacy-peer-deps

# Start the dev server
npm start
```

The app will open at **http://localhost:3000** 

### Build for Production

```bash
npm run build
```

---

## How to Play — Snake

```
┌─────────────────────────────┐
│                             │
│   ↑  W    Move Up           │
│   ↓  S    Move Down         │
│   ←  A    Move Left         │
│   →  D    Move Right        │
│   SPACE   Pause / Resume    │
│                             │
│   Mobile: Swipe or D-pad    │
│                             │
└─────────────────────────────┘
```

**Scoring:**
-  Eat food → **+10 points**
-  Snake gets longer with every food eaten
-  Speed increases every 5 foods
-  Hit yourself → Game Over
-  **Difficulty selector**: Easy / Medium / Hard — affects starting speed and speed growth
-  **Walls mode**: hitting the border kills you; **Wrap mode**: you pass through walls
-  Hit **10, 20, 30...** length milestones for a special callout during play
-  Game over shows your **score + length + personal bests** for both

**Speed indicator** (5 dots in the score bar):
- `● ○ ○ ○ ○` = Slow
- `● ● ● ● ●` = Maximum speed — good luck!

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework, component architecture |
| **React Hooks** | `useState`, `useEffect`, `useCallback`, `useRef` for game loop & state |
| **CSS3** | Animations, `@keyframes`, CSS variables, `box-shadow` glow effects |
| **CSS Grid** | Game board rendering (20×20) |
| **Google Fonts** | Press Start 2P (pixel font) + Orbitron (retro sci-fi) |

**No Redux. No Tailwind. No game engine.** Just React and CSS doing heavy lifting.

---

## Project Structure

```
retro-browser-games/
├── public/
│   ├── index.html                # HTML shell with Google Fonts
│   └── manifest.json             # Web app manifest
├── src/
│   ├── games/                    # One folder per game; tests sit beside the code
│   │   ├── Snake/                # Snake.js, useSnakeGame.js, Snake.css
│   │   ├── Tetris/               # Tetris.js, useTetrisGame.js, pieces.js, Tetris.css
│   │   ├── Minesweeper/          # Minesweeper.js, useMinesweeper.js, mineUtils.js, Minesweeper.css
│   │   ├── Pong/                 # Pong.js, usePongGame.js, Pong.css
│   │   └── Game2048/             # Game2048.js, useGame2048.js, logic.js, Game2048.css
│   ├── components/
│   │   └── StatsBar.js           # Best scores for every game + reset button
│   ├── utils/
│   │   ├── sound.js              # Synthesized Web Audio sounds + mute switch
│   │   ├── formatScore.js        # Zero-padded scores, "1.2M" for huge ones
│   │   ├── formatTime.js         # Seconds to "42s" or "1:05"
│   │   └── swipeDirection.js     # Finger movement to left / right / up / down
│   ├── App.js                    # Root component + nav
│   ├── App.css                   # Global layout + header styles
│   ├── index.js                  # React entry point
│   ├── index.css                 # CSS variables + reset
│   └── setupTests.js             # Test setup (jest-dom matchers)
├── package.json
├── .gitignore
└── README.md
```

Each game is split the same way: a React component for the screen, a hook that holds the game
state, and (where it helps) a file of pure logic. 2048 keeps its rules in `logic.js` with no React
in it, which is what makes them easy to test exactly.

---

## Contributing

Contributions make this project better! Here's how:

### Adding a New Game

1. **Fork** the repo and create a branch:
   ```bash
   git checkout -b feature/tetris
   ```

2. **Create your game folder:**
   ```
   src/games/Tetris/
   ├── Tetris.js         # Component
   ├── Tetris.css        # Styles
   └── useTetrisGame.js  # Game logic hook
   ```

3. **Register it in `App.js`** — add a nav button and import the component

4. **Commit with clear messages:**
   ```bash
   git commit -m " Tetris: Add piece rotation logic"
   git commit -m " Tetris: Add line clearing and scoring"
   ```

5. **Open a Pull Request** with a short description

### Bug Reports & Feature Requests
Open an [issue](https://github.com/pujanrasaili/retro-browser-games/issues) with:
- What you expected vs what happened
- Steps to reproduce
- Browser & OS

---

## License

MIT © [pujanrasaili](https://github.com/pujanrasaili)

---

<div align="center">

**Made with 💚 and way too much `box-shadow`**

Star this repo if you had fun playing!

</div>

---

## How to Play — Tetris

```
┌─────────────────────────────┐
│                             │
│   ←  →    Move Left/Right   │
│   ↑        Rotate Piece     │
│   ↓        Soft Drop        │
│   SPACE    Hard Drop        │
│   C/SHIFT  Hold Piece       │
│   P        Pause / Resume   │
│                             │
│   Mobile: Buttons on screen │
│                             │
└─────────────────────────────┘
```

**Hold Piece:**
- Press **C** or **Shift** to pocket the current piece for later
- Swap your held piece back by pressing hold again
- You can only hold once per piece placement — the HOLD panel dims when unavailable

**Scoring:**
| Lines Cleared | Points        |
|---------------|---------------|
| 1 line        | 100 × level   |
| 2 lines       | 300 × level   |
| 3 lines       | 500 × level   |
| 4 lines (Tetris!) | 800 × level |

**Tips:**
-  The **ghost piece** shows where your piece will land
-  Speed increases every 10 lines
-  Clear 4 lines at once (Tetris!) for maximum points
-  Watch the **NEXT** preview to plan ahead

---

## How to Play — Minesweeper

```
┌─────────────────────────────┐
│                             │
│   LEFT CLICK   Reveal cell  │
│   RIGHT CLICK  Place flag   │
│   DOUBLE CLICK Auto-clear   │
│    Button    New game     │
│                             │
│   Difficulties:             │
│    Easy   9×9,  10 mines  │
│    Medium 16×16, 40 mines │
│    Hard   16×30, 99 mines │
│                             │
└─────────────────────────────┘
```

**Tips:**
-  First click is always **safe** — no mine on first click
-  Numbers show how many mines are in adjacent cells
-  Flag suspected mines with right click
-  Empty cells auto-reveal connected safe areas
-  Double-click a revealed number to instantly reveal all its neighbors, once you've flagged the correct number of mines around it

---

## How to Play — Pong

```
┌─────────────────────────────┐
│                             │
│   W          Move Up        │
│   S          Move Down      │
│   ↑ (2P)     P2 Move Up     │
│   ↓ (2P)     P2 Move Down   │
│   P          Pause / Resume │
│                             │
│   Mobile (VS CPU): Drag     │
│   anywhere to move          │
│   Mobile (2P): Touch left   │
│   half for P1, right half   │
│   for P2 — both work at once│
│                             │
└─────────────────────────────┘
```

**Modes:**
-  **VS CPU** — play against an AI opponent with 3 difficulty levels:
  -  **Easy** — slow reactions, good for learning the controls
  -  **Medium** — the default, a fair fight
  -  **Hard** — near-instant reactions, genuinely tough
-  **2 Player** — you control the left paddle (W/S), a friend controls the right (↑/↓ or right-half touch on mobile)

**Rules:**
- First to **7 points** wins the match
- Ball speed increases slightly with every paddle hit, capped so it can never move fast enough to skip through a paddle
- Where you hit the ball on your paddle affects its bounce angle — hit with the edge for sharper angles
- Reaching **6 points** triggers a pulsing MATCH POINT indicator and a distinct sound cue
- Beating the CPU is tracked permanently — check your win count on the idle screen
- Beat **Hard** difficulty for a special LEGENDARY WIN! screen

---

## How to Play — 2048

```
┌─────────────────────────────────┐
│   ← ↑ → ↓  or  W A S D   Slide  │
│   Swipe (touch screens)  Slide  │
│   Space / Enter     Start / Keep│
└─────────────────────────────────┘
```

**Rules:**
- Each move slides **every** tile as far as it can go. Two tiles with the same number that touch
  **merge into one tile of double the value**, and that value is added to your score
- A tile merges **at most once per move**, so a row of 2 2 2 2 becomes 4 4, not 8
- After every move that changes the board, a new **2** (nine times in ten) or **4** appears in a
  random empty cell. A move that changes nothing does not add a tile
- Make a **2048** tile to win, then choose **KEEP GOING** to play on for a higher score
- The game ends when the board is full and no two neighbouring tiles match
- Your best score is saved and shown in the stats bar

**Tips:**
- Swipes need to travel a short distance (20 pixels) to count, so a plain tap on the board never moves anything
- Pressing a modifier key (Ctrl, Cmd, Alt) with an arrow or letter is treated as a browser shortcut, not a move

---

## Persistent Scores & Preferences

All best scores (Snake high score + length, Tetris high score + best lines, Minesweeper best time per difficulty, Pong CPU wins, 2048 best score) are saved to your browser's `localStorage` and survive page refreshes. They're visible at all times in the **stats bar** under the navigation menu.

Your last-selected difficulty and mode settings also persist across sessions — Snake's difficulty/walls mode, Minesweeper's difficulty, and Pong's AI difficulty are all remembered the next time you open the app.

Want to start fresh? Click the **↺** button at the end of the stats bar to reset all **best scores**. This intentionally does *not* clear your difficulty/mode preferences, since those aren't records to reset — just your last choice.

---

## Testing

This project has an automated test suite covering game logic, React hooks, and
component rendering — run it yourself with:

```bash
npm test              # watch mode
npm run test:coverage # one-off run with a coverage report
```

**457 tests, ~92% statement coverage** as of the last measurement. Coverage is
uneven by design, not oversight:

- **Fully covered**: pure logic utilities (formatScore, formatTime, Tetris
  piece rotation/spawning, Minesweeper board generation and flood-fill,
  chord-click logic), all 4 game hooks' core behavior, and all 4 game
  components' presentational rendering (button clicks, overlay text, correct
  hook calls).
- **Also covered**: Tetris's line-clearing sequence end to end (stacked
  pieces fill rows, the 300ms flash runs, the cleared-line count updates), tested
  with fake timers. Score and level changes during a clear are not asserted.
- **Also covered**: Pong's real-time physics loop (ball movement, bounces, the speed
  cap that prevents tunneling through a paddle, paddle and AI control, scoring, game
  over), driven frame by frame through a manually stepped `requestAnimationFrame`
  mock; the keyboard handlers in Snake and Tetris, using real `keydown` events;
  and Minesweeper's win and lose paths, best-time saving, chord-click and board
  rendering, using a hand-built board in place of the random one; the Tetris
  component's drawing of the falling piece, ghost piece, next and hold previews; and
  the touch controls: Snake's swipe gestures (with a minimum distance so a tap does
  not steer) and Pong's drag-to-move, including the 2-player left/right split,
  multi-touch, and a canvas that is scaled or offset on screen; and the sound
  engine, using a fake audio device that records what it is asked to play; and all
  of 2048 (move and merge rules, spawning, win and game over, the state hook,
  keyboard and swipe controls, the screen). Many of
  these were
  mutation-checked: deliberately breaking the code makes exactly the intended test
  fail.
- **Not covered**: the `index.js` entry point and a handful of individual lines in
  the components. Nothing is tested on a real device: touch behavior is simulated
  with synthetic events, the `touch-action: none` CSS that stops the page scrolling
  during a drag or swipe cannot be exercised by the test environment at all, and the
  sound tests check what the audio API is asked to play, not what anyone hears.

See the commit history for the reasoning behind specific testing decisions —
several commits document real bugs the tests caught, including a
temporal-dead-zone crash in Tetris, a crash-on-reload in Snake (a corrupted
saved difficulty), dev-mode double counting in Snake and Pong (React
StrictMode runs state updaters twice, so side effects inside them ran twice),
and a plain tap turning the Snake's direction on touch screens.

## Project Stats

![Games](https://img.shields.io/badge/Games-5%20Live-39ff14?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-457%20passing-39ff14?style=flat-square)
![Commits](https://img.shields.io/badge/Commits-170%2B-bf5fff?style=flat-square)
![Lines](https://img.shields.io/badge/Code-8000%2B%20lines-00f5ff?style=flat-square)
![No Dependencies](https://img.shields.io/badge/Extra%20Deps-Zero-ff4757?style=flat-square)

## Author
**Pujan Rasaili**
