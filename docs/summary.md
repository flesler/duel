# Duel — Project Summary for Agents

**What it is:** A 2D browser fighting game ("duel") by Ariel Flesler (github.com/flesler/duel). Built with **Phaser 4.2** + **TypeScript**, bundled with **tsup**. Version 0.9.0, private repo.

## Quick start

```bash
npm install
npm run serve     # watch build + static host at http://localhost:4000
npm run build     # production build → public/dist/
npm run test      # types + vitest unit tests
npm run lint:full # parallel typecheck + eslint --fix
```

- `npm run serve` runs `preserve` (regenerates asset data in dev mode, copies `templates/index.html` → `public/index.html`), then `tsup --watch` + `serve -l 4000 public` (bundle lives in `public/dist/`).
- **Smoke:** `npm test`. **Rules and balance:** `npm run sim`. **UI feel:** browser only — not for verifying matchups (see `.cursor/rules/headless-engine.mdc`).

**Turn-based combat v1 (shipped):** simultaneous picks, 100 HP, 20 turns. **Strike / Push / Parry / Heal** at 18 / 18 / 18 / 20 (`fun-chip4`), winner of a connecting hit also loses 4 HP. Full design: **`docs/simulations.md`**.

## Headless engine (key rule)

**All rules and execution are headless.** `src/engine/` is the source of truth; `bin/sim/` re-exports it for `npm run sim*`. No Phaser in the engine.

**Phaser (`src/`) is view-only.** `Fight.ts` calls `createMatch` / `submitPick` / `resolveTurn` from `src/engine/match.ts` — no duplicate payoff tables in the UI.

See `.cursor/rules/headless-engine.mdc`.

## How it works (big picture)

1. **`templates/index.html`** — shell copied to `public/index.html`; loads Phaser 4 from CDN + `public/dist/game.js`. Fonts via **webfontloader**.
2. **`src/game.ts`** — creates `Phaser.Game`, boots scenes: **`Boot` → `Preloader` → `Select` → `Fight`**.
3. **`src/config.ts`** — layout constants (`GameWidth`, tiles). Combat numbers live in the engine ruleset, not here.
4. **Asset pipeline:** `assets/` → `bin/generate_assets_data.ts` → **`src/assets.ts`** (generated). `src/utils/asset.ts` loads into Phaser.
5. **`src/entities/Char.ts`** — fighter sprite + animations (`setCharState`, `Anim` names).
6. **`src/states/Fight.ts`** — turn pick → engine resolve → animate → HUD. View only.
7. **Input:** `TurnController` + `KeyboardController` map keys to engine `Action` picks.

## File map

```
templates/index.html
public/dist/                # tsup output (gitignored)
assets/
bin/sim/                    # re-exports src/engine for sim scripts
src/engine/                 # resolve, rulesets, match API, *.test.ts
src/states/                 # Boot, Preloader, Select, Fight
src/entities/               # Char, Scene
src/input/
src/test/                   # vitest helpers (not collected as tests)
tsup.config.ts
```

## Conventions & gotchas

- **Phaser 4 API:** `Phaser.Scene`, `this.scene.start()`, `this.load.*`, `this.cameras.main`. Phaser loads from CDN; `src/phaser-shim.ts` maps the import to `globalThis.Phaser`.
- Asset keys from filenames — run `npm run assets` after adding files under `assets/`.
- `DIST=1` for minified production build (`npm run build`).
- **Headless engine:** rules only in `src/engine/`; Phaser never applies damage or win logic.
