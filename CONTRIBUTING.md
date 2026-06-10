# 🤝 Contributing to Retro Browser Games

Thanks for your interest in contributing! Every improvement — big or small — is welcome.

## 🚀 Quick Start

```bash
git clone https://github.com/pujanrasaili/retro-browser-games.git
cd retro-browser-games
npm install --legacy-peer-deps
npm install ajv@^8 --legacy-peer-deps
npm start
```

## 🌿 Branch Naming

| Type | Format | Example |
|------|--------|---------|
| New game | `feature/game-name` | `feature/tetris` |
| Bug fix | `fix/description` | `fix/snake-wall-collision` |
| Improvement | `improve/description` | `improve/snake-animations` |
| Docs | `docs/description` | `docs/readme-update` |

## ✅ Commit Message Format

Use emojis to categorize commits:

```
🎉  Initial / setup
🧠  Game logic
🎮  Gameplay / UX
🎨  UI / layout
💅  Styles / animations  
📚  Documentation
🐛  Bug fix
⚡  Performance
✨  New feature
♻️  Refactor
```

## 📐 Code Style

- Functional React components with hooks only
- Each game lives in `src/games/GameName/`
- Logic in `useGameName.js` hook, UI in `GameName.js`, styles in `GameName.css`
- CSS variables from `index.css` for all colors
- No external UI libraries

## 🐛 Reporting Bugs

Open an issue with:
1. Browser + OS
2. Steps to reproduce
3. Expected vs actual behavior

---

Happy coding! 🎮
