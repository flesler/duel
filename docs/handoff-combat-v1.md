# Handoff: turn-based combat v1 (Phaser)

**Use this convo for:** rulesets, balance, `npm run sim*`, movement experiments.

**Start a new convo for:** implementing the playable game. Paste the prompt at the bottom.

---

## Authoritative docs (read these; don’t re-derive rules in chat)

| Doc | Purpose |
|-----|---------|
| [`docs/simulations.md`](simulations.md) | **What to ship:** `fun-chip4`, move names, rejected ideas, sim commands |
| [`.cursor/rules/headless-engine.mdc`](../.cursor/rules/headless-engine.mdc) | **Architecture:** engine owns rules; Phaser is view-only |
| [`docs/summary.md`](summary.md) | Repo layout, Phaser CE, how to run |
| [`docs/backlog.md`](backlog.md) | **Stale** — written for old real-time loop; ignore items about frame cooldowns, charge-as-walk, `config.ATTACK_DAMAGE`. Use this handoff instead. |

---

## Current code reality

- **Headless engine:** `bin/sim/engine.ts` (`resolve`, `playMatch`, `Ruleset`, `fun-chip4` in `rulesets.ts`). Used by `npm run sim` only — **not imported by `src/` yet**.
- **Phaser game:** `src/states/Fight.ts` is still **real-time** (per-frame `check()`, tweens, tile movement, local `dealDamage()` using `config.ATTACK_DAMAGE`). Has HUD, round timer, countdown, game-over — **reuse patterns, replace the loop**.
- **Select:** `src/states/Select.ts` exists; boot is `Boot → Preloader → Select → Fight`.
- **Input:** `KeyboardController` maps keys to `CharStates` (back/charge/block/heal/attack). Will need remapping to four turn actions (+ later Back/Forward).

---

## v1 scope (explicit)

| In | Out |
|----|-----|
| 4 moves: Strike, Push, Parry (rename from Block), Heal | Walking (Back/Forward) — blocked on clock-turtle; see `simulations.md` |
| `fun-chip4`: 18/18/18, Heal 20, winner also loses 4 | Stun, stamina, `fun-chip-bonus` unless playtest asks |
| Simultaneous pick → resolve → animate | Real-time movement between turns |
| 100 HP, 20 turns, KO or higher HP on timeout | Rebalancing in Phaser/`config.ts` — numbers come from engine ruleset |
| 2P keyboard, pass-and-play | AI |

---

## Implementation order

1. **Shared engine in the bundle**
   - Move or re-export `bin/sim/engine.ts` (+ `rulesets.ts` for `fun-chip4`) to something `src/` can import (e.g. `src/engine/`). Update `bin/search-*.ts` imports to match.
   - Add a thin **match API** if needed: `createMatch(ruleset)`, `submitPicks(a, b)`, `getState()` — wrap `resolve` / turn loop; don’t duplicate payoff tables.

2. **Replace `Fight.ts` loop**
   - Turn phases: countdown (keep) → **pick** (both players) → **reveal** → **resolve via engine** → **animate** → next turn or game over.
   - Delete or bypass real-time `check()`, `dealDamage()`, charge buildup, tile combat. HP changes only from engine `Outcome`.

3. **Input & UI**
   - Map keys to Strike / Push / Parry / Heal (document in UI or README).
   - Show picks (hidden until both locked, or simultaneous reveal).
   - HUD: HP (already have bars), turn counter, “waiting for P2” etc.
   - Animations: map engine outcome to `Char` states (`hit`, `block`→parry, etc.) — cosmetic only.

4. **Wire ruleset**
   - `import { funChip4 } from '…'` (or `rulesets.candidates` by name). No damage constants in `config.ts` for combat.

5. **Verify**
   - `npm run typecheck && npm run lint`
   - Spot-check: same picks as `resolve()` in a one-off script or REPL — **not** “does it look right in browser” for math.

---

## Engine reference (ship set)

```ts
// rulesets.ts → fun-chip4
{ strike: 18, push: 18, counter: 18, heal: 20, chip: 4, maxTurns: 20, hp: 100 }
// resolve(actionA, actionB, rules) → { dA, dB, hitA, hitB, … }
```

Player-facing names: **Parry** not Block. Push label flexible (Grab/Trip).

---

## Out of scope for first PR

- `bin/sim/space.ts` / walking
- Menu polish beyond existing Select → Fight
- Automated tests (nice later: import engine in a small `tsx` test file)

---

## Prompt for new convo

```
Implement turn-based combat v1 for the Duel Phaser game.

Read first:
- docs/handoff-combat-v1.md
- docs/simulations.md (fun-chip4 section)
- .cursor/rules/headless-engine.mdc

Goal: Replace the real-time Fight.ts loop with simultaneous turn picks using the headless engine (fun-chip4). Phaser is view-only — all damage/win logic from bin/sim/engine (move to src/engine/ if needed for tsup). No walking. Strike/Push/Parry/Heal, 20 turns, KO or timeout.

Keep Select state and existing HUD/countdown patterns where useful. Remap keyboard input to the four actions.
```
