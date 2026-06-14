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
| 🏓 **Pong** | 🔜 Soon | Two-paddle ball game — beat the AI or play with a friend. |

---

## 🎯 Features

- 🎮 **3 fully playable games** — Snake, Tetris, Minesweeper
- ⚡ **No extra dependencies** — pure React + CSS, zero UI libraries
- 🌈 **Neon retro aesthetic** — glowing greens, deep blacks, pixel fonts
- 📱 **Mobile friendly** — on-screen D-pad + swipe gesture support
- 🏆 **Persistent high scores** — saved to localStorage, survives refresh
- 🚀 **Increasing difficulty** — Snake speeds up as your score grows
- ⏸️ **Pause / resume** — hit `Space` anytime

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
│   P        Pause / Resume   │
│                             │
│   Mobile: Buttons on screen │
│                             │
└─────────────────────────────┘
```

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

---

## 📊 Project Stats

![Games](https://img.shields.io/badge/Games-3%20Live-39ff14?style=flat-square)
![Commits](https://img.shields.io/badge/Commits-30%2B-bf5fff?style=flat-square)
![Lines](https://img.shields.io/badge/Code-1500%2B%20lines-00f5ff?style=flat-square)
![No Dependencies](https://img.shields.io/badge/Extra%20Deps-Zero-ff4757?style=flat-square)
