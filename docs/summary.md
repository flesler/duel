# Duel — Project Summary for Agents

**What it is:** A 2D browser fighting game ("duel") by Ariel Flesler (github.com/flesler/duel). Built with **Phaser CE (Phaser 2.11)** + **TypeScript**, bundled with **tsup**. Version 0.9.0, private repo.

## Quick start

```bash
npm install
npm run server    # dev: watch-builds (tsup) + serves on http://localhost:4000
npm run dist      # production build
npm run typecheck # tsc --noEmit
npm run lint      # eslint (npm run fix to autofix)
```

- `npm run server` runs `preserver` (regenerates asset data in dev mode, copies `templates/index.html` → `public/index.html`, copies `phaser.min.js` → `public/lib/`) then `tsup --watch` + `serve -l 4000 public dist`.
- There is no test suite yet. **Rules and balance:** `npm run sim` (headless engine in `bin/sim/`). **UI:** typecheck + lint; visual play is for feel only, not rule verification (see `.cursor/rules/headless-engine.mdc`).

**Turn-based rules (not wired into Phaser yet):** simultaneous picks, 100 HP. Ship **Strike / Push / Parry / Heal** at 18 / 18 / 18 / 20, winner of a connecting hit also loses 4 HP. Full design: **`docs/simulations.md`**.

## Headless engine (key rule)

**All rules and execution are headless.** `bin/sim/engine.ts` (and `space.ts`, `catalog.ts`) resolve moves, HP, and wins with no Phaser. `npm run sim*` is the authority for balance.

**Phaser (`src/`) is view-only.** It may read engine state and send player picks; it must not implement damage, matchups, or win logic on its own. When turn-based combat lands in `Fight.ts`, import the shared engine — do not duplicate tables in the UI layer.

See `.cursor/rules/headless-engine.mdc`.

## How it works (big picture)

1. **`templates/index.html`** is the shell template; it's copied to `public/index.html` at build/serve time and loads `public/lib/phaser.min.js` (Phaser global) plus the bundled `dist` output. Fonts load via **webfontloader**.
2. **`src/game.ts`** — entry point. Creates the Phaser game with dimensions/resolution from `src/config.ts`, waits for custom webfonts (`CustomWebFonts` from `src/assets.ts`), and boots the state sequence: **`Boot` → `Preloader` → `Fight`** (all in `src/states/`).
3. **`src/config.ts`** — central tuning constants: `GameWidth`/`GameHeight`, `Resolution`, and gameplay values. Change numbers here.
4. **Asset pipeline:**
   - Art/audio live in `assets/` (`atlases/`, `audiosprites/`, `spritesheets/`, `images/`, `audio/`, `fonts/`).
   - `bin/generate_assets_data.ts` scans `assets/` and generates **`src/assets.ts`** (auto-generated — don't hand-edit; run `npm run assets` after adding/changing files; `--dev` for dev mode).
   - `src/utils/asset.ts` (the `Loader` class) + `src/utils/index.ts` (case/extension helpers) do the keying: filenames become camelCase/PascalCase keys so code references assets like typed constants.
5. **`src/entities/Char.ts`** — fighter sprite. Uses a small state enum (`CharStates` / `State`) with a `setState` switch that throws on unknown states.
6. **`src/entities/Scene.ts`** — arena/background scene entity.
7. **`src/states/Fight.ts`** — main gameplay state: spawning/positioning characters, the fight loop, and the `Scene`.
8. **Input:** `src/input/Controller.ts` (abstraction) and `src/input/KeyboardController.ts` (keyboard implementation) feed the fight state.
9. **`src/utils/misc.ts`** — generic helpers: `pick`, `shuffle`, `rand`, `randint`, `ScreenOrientation`, `ScreenMetrics` (responsive scaling logic based on a Phaser tutorial for handling different screen sizes).
10. **`src/typings/globals.d.ts`** — global type shims (e.g., Phaser global). `tsconfig.json` includes Phaser's type defs from `node_modules/phaser-ce/typescript/phaser.comments.d.ts`.

## File map

```
templates/index.html        # HTML shell, copied to public/ at build
public/                     # build output dir (index.html, lib/, dist/)
assets/                     # raw art/audio sources (atlases, spritesheets, images, audio, fonts)
bin/generate_assets_data.ts  # codegen: assets/ → src/assets.ts
bin/sim/engine.ts           # headless rules (resolve, matches) — no Phaser
bin/sim/space.ts            # movement layer on engine
bin/sim/rulesets.ts         # named tunings; npm run sim
src/
  game.ts                   # entry: Phaser.Game + font loading + state boot
  config.ts                 # all game constants
  assets.ts                 # GENERATED — do not hand-edit
  states/Boot.ts            # minimal init, → Preloader
  states/Preloader.ts       # asset loading, → Fight
  states/Fight.ts           # gameplay UI (must delegate rules to engine)
  entities/Char.ts          # fighter + character state machine
  entities/Scene.ts         # arena
  input/Controller.ts       # input abstraction
  input/KeyboardController.ts
  utils/index.ts            # case conversion, file-ext helpers (asset keying)
  utils/misc.ts             # math/random/screen helpers
  utils/asset.ts            # Loader — loads generated asset data into Phaser
  typings/globals.d.ts
tsup.config.ts              # bundle config (entry src/game.ts → dist)
```

## Conventions & gotchas

- **Phaser 2 (CE) API**, not Phaser 3: `Phaser.State`, `this.state.start()`, `this.game.load.*`, sprite-based everything. Don't use Phaser 3 idioms.
- Asset keys come from filenames — add files under `assets/` in the right subfolder, then run `npm run assets` and use the generated names from `src/assets.ts`.
- Add a new state: create `src/states/<Name>.ts` extending `Phaser.State` (or follow `Boot`/`Preloader`), wire it into the `state.add` block in `src/game.ts`.
- Build quirk: `dist` build sets `DIST=1` env var for tsup; asset keys may differ between dev and dist generated data (`--dev` flag).
- Lint uses `@stylistic` formatting; run `npm run fix` after edits.
- **Headless engine:** rules only in `bin/sim/`; Phaser never applies damage or win logic. `.cursor/rules/headless-engine.mdc`.
