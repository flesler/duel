# Duel

A 2D browser fighting game for two players on one keyboard. Built with [Phaser CE](https://github.com/photonstorm/phaser-ce) (Phaser 2) + TypeScript, bundled with [tsup](https://tsup.skiptypedevs.com).

## Run it

```bash
npm install
npm run server      # dev server on http://localhost:4000 (watch build)
```

Other scripts:

```bash
npm run dist        # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run fix         # eslint --fix
npm run assets      # regenerate src/assets.ts from assets/ (after adding/changing art or audio)
```

## Controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Back (step away) | A | Left Arrow |
| Charge (step toward) | D | Right Arrow |
| Block | W | Up Arrow |
| Heal | S | Down Arrow |
| Attack | Space | Enter |

Debug (press while idle): `1` heal, `2` attack, `3` win pose, `4` hit, `5` dead.

## How to play

- Both fighters share a 10-tile row. Attacks only land when the enemy is on the same or adjacent tile; charge-stepping into the enemy deals a weaker ram.
- Blocking halves incoming damage. Healing restores a small amount of health (max 100).
- Attacks have a short cooldown, so you can't spam every frame.
- Kill the opponent to win. If the 60-second round timer expires, the player with more health wins (draw if equal).
- Press **R** after a match to rematch.

## Project layout

See [`docs/summary.md`](docs/summary.md) for architecture and [`docs/backlog.md`](docs/backlog.md) for remaining work.

```
templates/index.html        # HTML shell copied to public/ at build
assets/                     # art/audio sources (atlases, spritesheets, images, audio, fonts)
scripts/generate_assets_data.ts  # codegen: assets/ -> src/assets.ts (generated, don't hand-edit)
src/game.ts                 # entry: Phaser game + font loading + state boot
src/config.ts               # all game constants
src/states/                 # Boot -> Preloader -> Fight
src/entities/               # Char (fighter + state machine), Scene (arena)
src/input/                  # Controller abstraction + keyboard implementation
src/utils/                  # asset keying, math/random/screen helpers
```