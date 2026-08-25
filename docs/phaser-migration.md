# Phaser 2.11 (phaser-ce) → Phaser 4.2.1 Migration

Started Aug 19, 2026. PAUSED mid-migration — this is the handoff doc for the next session.
Decision: migrate to latest Phaser (4.2.1), keep Phaser as external in the web build (CDN `<script>` in index.html). We can always revert: pre-migration code is intact at the commit just before the WIP commit.

## Current git state

- `9520b5b` **WIP: swap to Phaser 4.2.1** — committed because the tree was mid-migration (build RED, known). Contents of that commit:
  - `package.json`: `phaser-ce` removed, `phaser@4.2.1` added (`npm i phaser@latest` verified 4.2.1, ships `dist/phaser.min.js` + `types/` (index.d.ts, phaser.d.ts, matter.d.ts))
  - `tsconfig.json`: type includes retargeted to `node_modules/phaser/types/phaser.d.ts` + `matter.d.ts` (was phaser-ce's d.ts + globals shim)
  - `templates/index.html`: `<script src="lib/phaser.min.js">` → `https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js`
  - `src/entities/Char.ts`: first (broken) partial port
  - `package-lock.json`
- **Uncommitted (working tree, built on the WIP commit):**
  - `src/entities/Char.ts` — FULL REWRITE, believed-correct: `extends Phaser.Physics.Arcade.Sprite`, constructor `(scene: Phaser.Scene, name, direction)`, per-state anims pre-created via `scene.anims.create(\`${name}-${state}\`, { texture, frames: number[], frameRate, repeat })`, `setCharState(name)` (no `state` field — Phaser 4's base GameObject has a `state: string|number` property; naming clash caused duplicate-identifier errors), exports `State` interface, `restore()`/`face()`, `update()` uses `performance.now()`, direction flip via `scale.x`.
  - `src/game.ts` — REWRITE: `new Phaser.Game({ parent: 'game', width, height, transparent, render: WEBGL|CANVAS, physics: { default: 'arcade', arcade: { debug: false } }, scale: { mode: Scale.RESIZE, autoCenter: Scale.CENTER_BOTH }, scene: [Boot, Preloader, Select, Fight] })`, `export default game`. No more `window.onload`/`game.state.start`.

Everything else is still written against the Phaser 2 API. **Build is RED.** The TypeScript error list (post-retarget) is the authoritative list of what Phaser 4 changed; notable ones:

```
Phaser.Color — does not exist (use number literals, e.g. 0x000000)
Phaser.KeyCode — does not exist (find the 4.x key-constant location in types)
Phaser.Sprite — does not exist (use Phaser.GameObjects.Sprite)
Phaser.ScaleManager — gone (config's scale object now)
Game: no .state, .camera, .load, .add, .forceSingleUpdate; GameConfig has `render` not `renderer`
game.cache.checkImageKey/checkSoundKey/... — gone (4.x: cache.has / textures.exists?)
KeyboardManager: no .addKeys, no .isDown (4.x keyboard API shape unknown — INVESTIGATE in types)
Animation: no .frameIndex (4.x equivalent unknown)
SoundManager: no .setDecodedCallback
textures.generateTextureNames — gone (use frames arrays)
```

## What to do (order)

0. **Re-fetch migration docs** (previous fetches were compacted out of context — lost):
   - `curl -s https://raw.githubusercontent.com/phaserjs/phaser/refs/heads/master/skills/v3-to-v4-migration/SKILL.md`
   - `curl -s https://raw.githubusercontent.com/phaserjs/phaser/refs/heads/v4.0.0/changelog/v4/4.0/MIGRATION-GUIDE.md`
   - Also `grep` `node_modules/phaser/types/phaser.d.ts` for `KeyboardManager`, `delayedCall`, `SoundManager`, `class Sprite` to learn exact 4.x signatures. The shipped types are the source of truth; my training predates Phaser 4.
1. **tsup.config.ts**: add `external: ['phaser']` so the bundle references the CDN global `window.Phaser` (iife external → global) instead of inlining a second copy. Verify dist/game.js does NOT contain the Phaser source.
2. `src/utils/asset.ts` + `assetLoader.ts` — big one: functions take a `Phaser.Scene` and use `scene.load.*` + `scene.cache.has` (verify names); asset classes are `new`-able instances; drop/replace the "wait for sound decoding" flow (or use the 4.x equivalent if it exists).
3. `src/entities/Scene.ts` — `Phaser.GameObjects.Sprite`, `this.cameras.main`, number tints, `this.anims`.
4. `src/states/Boot.ts` — `extends Phaser.Scene`, `this.load` in `preload()`, drop `Phaser.ScaleManager` usage, keep webfontloader bit.
5. `src/states/Preloader.ts` — Scene; `this.load` in `preload()`; `this.cameras.main.fade(...)`; `this.scene.start('Select')`.
6. `src/states/Select.ts` — Scene; `this.input.keyboard` (learn the 4.x API in types: how to register keys, how to read justDown/isDown); drop `import game` (use `this.game`).
7. `src/states/Fight.ts` — Scene; `this.time` (verify `delayedCall` vs `addEvent`), `this.cameras.main.shake/flash`, `this.sound.play`, `this.scene.start('Select')`; Char is now constructed with `this` as scene arg (`new Char(this, name, dir)`).
8. `src/input/Controller.ts` / `KeyboardController.ts` — `char.setCharState(...)` instead of the old `state` setter; keyboard API per step 6.
9. Check `src/types/globals.d.ts` — likely delete (Phaser 4 ships types; the CE global-namespace shim may now conflict or be dead).
10. `package.json` `assets:script` still references phaser-ce paths — fix or drop; `npm run assets` must still regenerate `src/assets.ts`.
11. Update `README.md` (Phaser 4 note) and `docs/backlog.md`; re-verify with `npm run lint:full`.
12. **Browser smoke test** (`npm run server`): assets load from CDN bundle, select screen, countdown, combat, audio, HUD. Balance untested since first build.

## Key decisions / notes

- Keep `import Phaser from 'phaser'` in source for types; tsup `external: ['phaser']` makes the emitted iife use the CDN global. If that proves fiddly, fallback: keep the import and let tsup inline it (drops the CDN tag) — but user asked for CDN external, so prefer external.
- Game must load with `scene: [...]` in config; first scene starts automatically (no `game.state.start('Boot')`).
- Physics: added arcade physics to config (Phaser 2 template had none; harmless and lets us use `Physics.Arcade.Sprite`).
- Do NOT fight the type defs with `any` hacks for API shapes — grep the shipped `phaser.d.ts` instead; it's the ground truth for 4.2.1.
- WIP commit is intentional — do NOT revert it; migrate forward on top. Only `git reset --hard 9520b5b^` if abandoning the whole migration.
