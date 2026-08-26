# Duel

A 2D browser fighting game for two players on one keyboard. **Turn-based combat** — both pick a move each turn, then both resolve. Built with [Phaser 4](https://phaser.io) + TypeScript, bundled with [tsup](https://tsup.egoist.dev).

## Run it

```bash
npm install
npm run serve       # watch build + static host at http://localhost:4000
```

Other scripts:

```bash
npm run build       # production build → public/dist/
npm run test        # types + unit tests
npm run lint:full   # types + eslint
npm run sim         # headless ruleset balance sim
npm run assets      # regenerate src/assets.ts (after adding art/audio)
```

## Controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Strike | Space | Enter |
| Push | D | Right Arrow |
| Parry | W | Up Arrow |
| Heal | S | Down Arrow |

**Select screen:** P1 A/D to cycle character, P2 ←/→, Space or Enter to start.

## How to play

- **100 HP**, **20 turns**. Both players pick simultaneously each turn (Strike / Push / Parry / Heal).
- Rules and damage come from the headless engine (`fun-chip4`: 18/18/18 damage, Heal 20, winner of a hit also loses 4 HP). See [`docs/simulations.md`](docs/simulations.md).
- **KO** ends the match early. After turn 20, higher HP wins (draw on tie).
- Press **R** after a match to return to character select.

Balance changes: `npm run sim` — not by eyeballing the browser.

## Project layout

See [`docs/summary.md`](docs/summary.md) for architecture and [`docs/backlog.md`](docs/backlog.md) for remaining work.

```
templates/index.html        # HTML shell copied to public/ at build
public/dist/                # bundled game.js + hashed assets (gitignored)
assets/                     # art/audio sources
src/engine/                 # headless rules (shared with bin/sim re-exports)
src/states/                 # Boot → Preloader → Select → Fight
```
