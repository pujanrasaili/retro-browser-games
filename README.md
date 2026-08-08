<div align="center">

# 🎮 Retro Browser Games

**A collection of classic arcade games built with React — pure neon nostalgia in your browser.**

[![React](https://img.shields.io/badge/React-18.2-61dafb?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-f7df1e?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Animations-1572b6?style=flat-square&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

[▶ Play Now](#getting-started) · [🐛 Report Bug](https://github.com/pujanrasaili/retro-browser-games/issues) · [✨ Request Feature](https://github.com/pujanrasaili/retro-browser-games/issues)

</div>

---

## 🕹️ Games

| Game | Status | Description |
|------|--------|-------------|
| 🐍 **Snake** | ✅ Live | Classic snake — eat food, grow longer, don't crash! Speed increases as you score. |
| 🧱 **Tetris** | ✅ Live | Stack falling tetrominoes, clear lines, survive as long as possible. Speed increases every 10 lines. |
| 💣 **Minesweeper** | ✅ Live | Uncover all safe tiles without triggering a mine. 3 difficulty levels: Easy, Medium, Hard. |
| 🏓 **Pong** | ✅ Live | Two-paddle ball game — beat the AI or play 2-player locally. First to 7 wins. |

---

## 🎯 Features

- 🎮 **4 fully playable games** — Snake, Tetris, Minesweeper, Pong
- ⚡ **No extra dependencies** — pure React + CSS, zero UI libraries
- 🌈 **Neon retro aesthetic** — glowing greens, deep blacks, pixel fonts
- 📱 **Mobile friendly** — on-screen D-pad + swipe gesture support
- 🏆 **Persistent high scores** — saved to localStorage, survives refresh
- 🚀 **Increasing difficulty** — Snake speeds up, Tetris gets faster each level
- ⏸️ **Pause / resume** — hit `Space` or `P` anytime
- 🔊 **Sound effects** — synthesized via Web Audio API, global mute button
- 📦 **Tetris hold piece** — save a piece for later with `C` or `Shift`
- 🧱 **Snake walls mode** — toggle between wrap-around and lethal borders
- 🎯 **Milestone celebrations** — mid-game callouts for length/progress achievements

---

## 🚀 Getting Started

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

The app will open at **http://localhost:3000** 🎉

### Build for Production

```bash
npm run build
```

---

## 🎮 How to Play — Snake

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
- 🔴 Eat food → **+10 points**
- 🐍 Snake gets longer with every food eaten
- ⚡ Speed increases every 5 foods
- 💥 Hit yourself → Game Over
- 🎯 **Difficulty selector**: Easy / Medium / Hard — affects starting speed and speed growth
- 🧱 **Walls mode**: hitting the border kills you; **Wrap mode**: you pass through walls
- 🎉 Hit **10, 20, 30...** length milestones for a special callout during play
- 📊 Game over shows your **score + length + personal bests** for both

**Speed indicator** (5 dots in the score bar):
- `● ○ ○ ○ ○` = Slow
- `● ● ● ● ●` = Maximum speed — good luck!

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework, component architecture |
| **React Hooks** | `useState`, `useEffect`, `useCallback`, `useRef` for game loop & state |
| **CSS3** | Animations, `@keyframes`, CSS variables, `box-shadow` glow effects |
| **CSS Grid** | Game board rendering (20×20) |
| **Google Fonts** | Press Start 2P (pixel font) + Orbitron (retro sci-fi) |

**No Redux. No Tailwind. No game engine.** Just React and CSS doing heavy lifting.

---

## 📁 Project Structure

```
retro-browser-games/
├── public/
│   └── index.html              # HTML shell with Google Fonts
├── src/
│   ├── games/
│   │   ├── Snake/
│   │   └── Tetris/
│   │       ├── Snake.js        # Board renderer + overlays + controls
│   │       ├── Snake.css       # All neon visuals & animations
│   │       └── useSnakeGame.js # Pure game logic (hook)
│   ├── App.js                  # Root component + nav
│   ├── App.css                 # Global layout + header styles
│   ├── index.js                # React entry point
│   └── index.css               # CSS variables + reset
├── package.json
├── .gitignore
└── README.md
```

---

## 🤝 Contributing

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
   git commit -m "🧱 Tetris: Add piece rotation logic"
   git commit -m "🧱 Tetris: Add line clearing and scoring"
   ```

5. **Open a Pull Request** with a short description

### Bug Reports & Feature Requests
Open an [issue](https://github.com/pujanrasaili/retro-browser-games/issues) with:
- What you expected vs what happened
- Steps to reproduce
- Browser & OS

---

## 📜 License

MIT © [pujanrasaili](https://github.com/pujanrasaili)

---

<div align="center">

**Made with 💚 and way too much `box-shadow`**

⭐ Star this repo if you had fun playing!

</div>

---

## 🧱 How to Play — Tetris

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
- 👻 The **ghost piece** shows where your piece will land
- ⚡ Speed increases every 10 lines
- 🎯 Clear 4 lines at once (Tetris!) for maximum points
- 📦 Watch the **NEXT** preview to plan ahead

---

## 💣 How to Play — Minesweeper

```
┌─────────────────────────────┐
│                             │
│   LEFT CLICK   Reveal cell  │
│   RIGHT CLICK  Place flag   │
│   DOUBLE CLICK Auto-clear   │
│   😊 Button    New game     │
│                             │
│   Difficulties:             │
│   🟢 Easy   9×9,  10 mines  │
│   🟡 Medium 16×16, 40 mines │
│   🔴 Hard   16×30, 99 mines │
│                             │
└─────────────────────────────┘
```

**Tips:**
- 🛡️ First click is always **safe** — no mine on first click
- 🔢 Numbers show how many mines are in adjacent cells
- 🚩 Flag suspected mines with right click
- 💡 Empty cells auto-reveal connected safe areas
- ⚡ Double-click a revealed number to instantly reveal all its neighbors, once you've flagged the correct number of mines around it

---

## 🏓 How to Play — Pong

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
- 🤖 **VS CPU** — play against an AI opponent with 3 difficulty levels:
  - 🟢 **Easy** — slow reactions, good for learning the controls
  - 🟡 **Medium** — the default, a fair fight
  - 🔴 **Hard** — near-instant reactions, genuinely tough
- 👥 **2 Player** — you control the left paddle (W/S), a friend controls the right (↑/↓ or right-half touch on mobile)

**Rules:**
- First to **7 points** wins the match
- Ball speed increases slightly with every paddle hit, capped so it can never move fast enough to skip through a paddle
- Where you hit the ball on your paddle affects its bounce angle — hit with the edge for sharper angles
- Beating the CPU is tracked permanently — check your win count on the idle screen
- Beat **Hard** difficulty for a special 🏆 LEGENDARY WIN! screen

---

## 💾 Persistent Scores

All best scores (Snake high score + length, Tetris high score + best lines, Minesweeper best time per difficulty, Pong CPU wins) are saved to your browser's `localStorage` and survive page refreshes. They're visible at all times in the **stats bar** under the navigation menu.

Want to start fresh? Click the **↺** button at the end of the stats bar to reset everything (with a confirmation prompt first).

---

## 📊 Project Stats

![Games](https://img.shields.io/badge/Games-3%20Live-39ff14?style=flat-square)
![Commits](https://img.shields.io/badge/Commits-130%2B-bf5fff?style=flat-square)
![Lines](https://img.shields.io/badge/Code-4000%2B%20lines-00f5ff?style=flat-square)
![No Dependencies](https://img.shields.io/badge/Extra%20Deps-Zero-ff4757?style=flat-square)

## 👨‍💻 Author
**Pujan Rasaili**
