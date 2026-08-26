# Duel rule simulations

Turn-based fight. Both pick at the same time, then both resolve. 100 HP, 20 turns max. KO wins; otherwise higher HP. Tie on equal HP.

**Ship this (combat):** Strike, Push, Parry, Heal. Damage 18 / 18 / 18, Heal 20. When a hit lands, the winner also loses 4 HP. No stun. No stamina.

**Names:** In the game, call the Strike-punish **Parry** (code still says `Block` in many files). Keep **Push** as the anti-Parry — or rename it Grab/Trip if “Push” sounds like a shove. It does **not** move them a tile; they stumble in place.

**Optional walking:** Back (one step away), Forward (one step in). Strike also steps one tile in. Push does not. **Back vs Strike is a tie** (they hop to you, punch misses, same HP, still adjacent). Max gap is **one** step. Code `maxDist: 2` is that leash, not a 2-tile dash. Code `dist === 1` means adjacent.

If a move is never the right answer, that is a bug.

**Architecture:** Rules run only in the headless engine (`bin/sim/`). The Phaser game is a visual client — same `resolve` / match code as `npm run sim`, no duplicate logic in `src/`. Never use “play in the browser” to verify a rule change. See `.cursor/rules/headless-engine.mdc`.

```bash
npm run sim          # named number sets (bin/sim/rulesets.ts)
npm run sim:search   # grid-search 18-ish damage numbers
npm run sim:fun      # winner-also-loses-HP / clash / next-hit bonus
npm run sim:space    # Back / Forward / Strike stepping in
npm run sim:catalog  # different move lists (Parry, drop Push, …)
```

| File | What it is |
|------|------------|
| `bin/sim/engine.ts` | 4-move resolve, mixes, matches. Field `chip` = winner also loses that much HP. |
| `bin/sim/rulesets.ts` | Named number sets |
| `bin/sim/space.ts` | Walking packs |
| `bin/sim/catalog.ts` | Different move lists |
| `bin/search-*.ts` | Runners for the commands above |

Do not write “chip”, “lunge”, or “Nash” in player-facing text. In this doc: **winner also loses 4**, **Strike steps in**, **even mix** (the equilibrium mix for that move list).

---

## How we test (opponent models)

Claims like “beats the mix” or “loses to one-button Parry” only make sense with the opponent named.

| Label | What it is | Where |
|-------|------------|--------|
| **Even mix** | Equilibrium mix for that ruleset (not uniform random). Static — does not adapt to you. | `catalog.ts`, `balance-sim.ts` |
| **One-button** | Always the same move. | `sim:catalog`, `balance-sim` “vs pure” |
| **HP-aware** | Counters your *last* move; Heals when hurt and you just Parried. Adaptive, but simple. | `engine.ts` `hpAware`, `balance-sim` |
| **Styles** | Fixed mixes (Aggro / Turtle / Greedy) plus noisy equilibrium. | `balance-sim.ts` |
| **Duelist** | Space bot: closes distance, then plays a rough 4-move mix. | `space.ts`, `sim:space` |
| **Clock-turtle** | Ahead on HP: Back to burn clock, Parry when cornered. Tested at 72 vs 88 HP. | `space.ts` `leadingClockTurtle`, `sim:space` |

The drop-Push finding (“always Parry ~76% vs the 3-move even mix”) is **static even mix vs one-button**, not HP-aware vs one-button. It still flags a real hole: no full-health answer to Parry without Push.

---

## Why each combat move exists

| You pick | Right when they… | You were right | You were wrong |
|----------|------------------|----------------|----------------|
| **Strike** | Push or Heal (or walk into you) | They lose 18, you lose 4 | **Parry**: you lose 18, they lose 4 |
| **Push** | Parry or Heal | They lose 18, you lose 4. Stumble in place, no shove, no stun | **Strike**: you lose 18. **Back**: grab misses, they are one step away |
| **Parry** (code: Block) | Strike | They lose 18, you lose 4 | **Push**: you lose 18. **Heal**: they gain 20, you do nothing |
| **Heal** | Parry (or also Heal) | You gain 20 | Strike or Push: you lose 18, no heal |

Same-move combat (both Strike, both Push, both Parry): nothing, unless you turn on “both lose 2 on ties” (`fun-chip-clash`).

**Push exists to hurt a Parry from full health.** Heal also “beats” Parry, but Heal does nothing at 100 HP, so “always Parry” wins the opening if Push is gone. Push is the grab even if the sprite just falls over.

**Heal 20, not 15 (with clean hits):** On `v1-18-20` (winner loses 0), Heal 15 is **dominated by Push** in the static matrix — Push is ≥ Heal in every row. With winner-also-loses-4, that domination goes away; 15 vs 20 is mostly greed margin (Push vs Parry nets 14, Heal nets 15). We ship 20 for headroom.

The code name `fun-chip4` is this set.

---

## Parry vs Block, and do we need Push?

Parry is a better **name** for Block. Same numbers (`parry-for-block` in `catalog.ts`).

**Do not drop Push** while Parry still means “I beat Strike.” Tried (`npm run sim:catalog`, even mix vs one-button):

| Set | Idea | Result |
|-----|------|--------|
| Strike, Parry, Heal | Drop Push. Clean cycle. | Always-Parry beats even mix (~24% mix win). Heal too weak at full HP. Long fights, few KOs. |
| + Back that ties Strike, nothing vs Parry | Neutral Back | Back is never better than Parry. Dead. |
| + Back gains 10 or 20 vs Parry | “Partial/free heal on Parry” | Back still unused. Same always-Parry problem. |
| Parry also beats Push | Grab loses to Parry | Push is never better than Strike. Dead grab. |
| Parry vs Strike is 0/0 | A real shield | Strike is the only move. |

If Heal later works at full HP (overheal as score, or Heal also hurts them a little), the three-move cycle is worth another `sim:catalog`. Until then, dropping Push is a bug.

---

## Walking (optional)

Same four combat moves plus Back and Forward.

**Back vs Strike = tie.** They step in, miss, same HP, still next to you. You Parry when you want to *punish* a Strike (18 onto them). You Back when you think they will **Push**.

| You Back, they… | Result |
|-----------------|--------|
| Strike | Tie. Followed, missed, still in your face. |
| Push | Grab misses. You are one step away. |
| Parry | Nothing. You made space. |
| Heal | They gain 20 while you fade. |
| Forward | Steps cancel. Still adjacent, no damage. |

If Back vs Strike dealt 18, Back would only be correct vs Push (feels like a trap). If Back made Strike *and* Push miss *and* left you far away, Back would beat every attack (Parry useless).

Symmetric “always Back vs always Strike” mostly **ties** — not a winning strategy. The harder case is **clock-turtle**: already ahead (tested 88 vs 72 HP), Back/Parry to run out the 20-turn cap. On `lunge-strike-max2`, Duelist only wins **~35%** vs clock-turtle — **a real gap before shipping walking**. Symmetric turtle-far is fine (~77% Duelist win).

**If you add walking:** 18/20/winner-also-loses-4, Strike steps 1, Push does not, max one step apart. Six buttons. Packs in `bin/sim/space.ts`; `npm run sim:space`. Broken if loop bots beat Duelist — **clock-turtle with a lead currently qualifies.**

Distance in code: `1` = adjacent, `2` = one step apart. `close[]` is Strike, Push, Block, Heal, Back, Forward (positive = closer). Recommended pack: `lunge-strike-max2`.

Tried and rejected: attacks that do not step in (free turn for the runner); Strike steps 2; both Strike and Push step in; start one step away; Forward bump damage; overlapping tiles (`minDist: 0`).

---

## Numbers we already know

- Strike = Push = Parry = 18 is an even three-way mix (~33% each). Heal is ~0% of that mix at full HP. You Heal when hurt and they are Parrying. Intended, not dead.
- **Dead rounds:** when both pick the same combat move, nothing happens (~**34%** of turns for static even mix vs itself on `fun-chip4`; ~30% for HP-aware vs self). Matches still end (~92% KO). If playtests feel stall-y, try `fun-chip-clash` (both lose 2 on ties). `npm run sim` prints `dead` per ruleset.
- Forcing all four into that infinite mix needs Heal ≈ 36 (`knife-edge-18-36`). Loses to “always Parry” in real 100-HP matches. Do not chase.
- Clean hits (winner loses 0): `v1-18-20`. Feels more clinical (~16 turns, ~80% KO vs ~14 turns, ~92% with winner-also-loses-4).
- Parry must deal 18 back on a successful Strike. If it deals 0, Strike is the only move (`nullify-block`).
- Heavier Push (16/20/18) without winner-also-loses-4 loses to “always Push.” With winner-also-loses-4, 18/20/22 can work (`fun-push-chip4`).
- Stun (winner skips their next pick): too swingy; loses to one-button Strike/Push. Don’t.
- Stamina: second bar. First tunings stalled to the turn cap (~0% KO). Not v1.
- **`fun-chip-bonus`** (winner loses 3, next Strike/Push +4 after a win): scores the same as `fun-chip4` in sims (~71). Left out of v1 for **scope** (extra state), not balance. If wins feel weightless in human play, try this before adding stun or stamina.

Other named sets live in `bin/sim/rulesets.ts`. Copy a `defaults({ name: '...' })`, then `npm run sim`. `clashChip` = both lose that HP when they pick the same combat move.

---

## Don’t bother (already a bug)

- Parry/Block deals 0 vs Strike
- Stun as the punish
- Heal 15 on **clean hits** (`v1-18-20`) — Push dominates Heal in the static matrix
- Drop Push while Parry still only beats Strike
- Attacks that do not step in, plus Back
- Shield-Parry (tie vs Strike) plus Push
- Parry that also beats Push
- Inflating Heal to ~36 so all four show up in the infinite mix
- Stamina as the first version

---

## Next steps (implementation)

Combat v1 is in the game (`src/states/Fight.ts` + `src/engine/match.ts`). Remaining:

1. **Human playtest** — Feel only (dead rounds, win weight). Balance stays on `npm run sim`.
2. **Fight polish** — Audio on reveal, damage numbers, clearer pick UX (`docs/backlog.md`).
3. **Walking (blocked on clock-turtle)** — Tune with `npm run sim:space` before shipping.
4. **Online** — `docs/multiplayer.md`.
