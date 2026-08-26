# Backlog

Current state: **turn-based combat v1** — Select → Fight, engine-driven (`fun-chip4`), 2P keyboard pass-and-play.

## Done (v1)

- [x] Shared engine in `src/engine/` (game + `npm run sim` use same `resolve` / match API)
- [x] Turn picks → resolve → animate in `Fight.ts`
- [x] HP bars, turn counter, countdown, game-over + **R** rematch
- [x] Character select (`Select.ts`)
- [x] Parry label in UI (engine still says `Block`)
- [x] Phaser 4 migration (CDN global + `phaser-shim`)
- [x] Engine unit tests (`src/engine/*.test.ts`)

## Next (polish)

- [ ] Fight audio on pick/reveal (assets exist: `attack`, `block`, `power`, `hit`)
- [ ] Clearer reveal moment (show both picks before animating)
- [ ] Brief damage/heal numbers on HUD
- [ ] Human playtest notes: dead-round feel, win weight (chip-4)

## Later (design-gated)

- [ ] Walking (Back/Forward) — blocked on clock-turtle tuning (`npm run sim:space`)
- [ ] `fun-chip-bonus` or clash variants — only if playtest asks
- [ ] Online multiplayer — see `docs/multiplayer.md`
- [ ] Win/loss counter between rounds (nice-to-have)

## Docs

- [x] README controls + turn-based rules
- [ ] Archive or trim `docs/phaser-migration.md` (migration complete)
