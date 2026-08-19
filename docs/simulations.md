# Duel rule simulations

Turn-based fight. Both pick at the same time, then both resolve. 100 HP, 20 turns max. KO wins; otherwise higher HP. Tie on equal HP.

**Ship this (combat):** Strike, Push, Parry, Heal. Damage 18 / 18 / 18, Heal 20. When a hit lands, the winner also loses 4 HP. No stun. No stamina.

**Names:** In the game, call the Strike-punish **Parry** (code still says `Block` in many files). Keep **Push** as the anti-Parry — or rename it Grab/Trip if “Push” sounds like a shove. It does **not** move them a tile; they stumble in place.

**Optional walking:** Back (one step away), Forward (one step in). Strike also steps one tile in. Push does not. **Back vs Strike is a tie** (they hop to you, punch misses, same HP, still adjacent). Max gap is **one** step. Code `maxDist: 2` is that leash, not a 2-tile dash. Code `dist === 1` means adjacent.

If a move is never the right answer, that is a bug.

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

Do not write “chip”, “lunge”, or “Nash” in player-facing text. In this doc: **winner also loses 4**, **Strike steps in**, **even mix** (what a perfect mixer would throw).

---

## Why each combat move exists

| You pick | Right when they… | You were right | You were wrong |
|----------|------------------|----------------|----------------|
| **Strike** | Push or Heal (or walk into you) | They lose 18, you lose 4 | **Parry**: you lose 18, they lose 4 |
| **Push** | Parry or Heal | They lose 18, you lose 4. Stumble in place, no shove, no stun | **Strike**: you lose 18. **Back**: grab misses, they are one step away |
| **Parry** (code: Block) | Strike | They lose 18, you lose 4 | **Push**: you lose 18. **Heal**: they gain 20, you do nothing |
| **Heal** | Parry (or also Heal) | You gain 20 | Strike or Push: you lose 18, no heal |

Same-move combat (both Strike, both Push, both Parry): nothing, unless you turn on “both lose 2 on ties.”

**Push exists to hurt a Parry from full health.** Heal also “beats” Parry, but Heal does nothing at 100 HP, so “always Parry” wins the opening if Push is gone. Push is the grab even if the sprite just falls over.

Heal 20, not 15: at 15, Push is better in every matchup (bug). At 20 vs Parry, Heal is greedier than Push’s 18, so both stay honest.

The code name `fun-chip4` is this set.

---

## Parry vs Block, and do we need Push?

Parry is a better **name** for Block. Same numbers (`parry-for-block` in `catalog.ts`).

**Do not drop Push** while Parry still means “I beat Strike.” Tried (`npm run sim:catalog`):

| Set | Idea | Result |
|-----|------|--------|
| Strike, Parry, Heal | Drop Push. Clean cycle. | Always-Parry beats a mixer (~24%). Heal is too weak at full HP. Long fights, few KOs. |
| + Back that ties Strike, nothing vs Parry | Neutral Back | Back is never better than Parry. Dead. |
| + Back gains 10 or 20 vs Parry | “Partial/free heal on Parry” | Back still unused. Same always-Parry problem. If Back heals as much as Heal and Strike only ties, Heal is the stupid one. |
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

Someone who only runs vs someone who only Strikes mostly **ties** (20 turns of 0–0). Not a winning strategy — Heal when they never attack.

**If you add walking:** 18/20/winner-loses-4, Strike steps 1, Push does not, max one step apart. Six buttons. Packs in `bin/sim/space.ts`; `npm run sim:space`. Broken if “always walk away” or “always Heal from far” beats a normal player.

Distance in code: `1` = adjacent, `2` = one step apart. `close[]` is Strike, Push, Block, Heal, Back, Forward (positive = closer). Recommended pack: `lunge-strike-max2` (Strike close 1, Push 0, Back −1, Forward 1, max 2).

Tried and rejected: attacks that do not step in (free turn for the runner); Strike steps 2 (Back never escapes a jab); both Strike and Push step in (Back is a wasted input); start one step away (runner is 50/50 again); Forward deals extra bump damage (doesn’t fix runaways); overlapping tiles (`minDist: 0` — looks like a sprite stack).

---

## Numbers we already know

- Strike = Push = Parry = 18 is an even three-way mix (~33% each). Heal is ~0% of that mix at full HP. You Heal when hurt and they are Parrying. Intended, not dead.
- Forcing all four into that infinite mix needs Heal ≈ 36 (`knife-edge-18-36`). Loses to “always Parry” in real 100-HP matches. Do not chase.
- Clean hits (winner loses 0): `v1-18-20`. Feels more clinical (~16 turns, ~80% KO vs ~14 turns, ~92% KO with winner-also-loses-4).
- Parry must deal 18 back on a successful Strike. If it deals 0, Strike is the only move (`nullify-block`).
- Heavier Push (16/20/18) without winner-also-loses-4 loses to “always Push.” With winner-also-loses-4, 18/20/22 can work (`fun-push-chip4`).
- Stun (winner skips their next pick): too swingy; loses to one-button Strike/Push. Don’t.
- Stamina: second bar. First tunings stalled to the turn cap (~0% KO). `stamina-light` / `stamina-block-tax` still stall. Not v1. Revisit if humans loop Strike or Parry forever.
- Next Strike/Push deals +4 after a win (`fun-chip-bonus`): snowball without skipped turns. Extra rule; don’t stack with walking and stamina.

Other named sets live in `bin/sim/rulesets.ts`. Copy a `defaults({ name: '...' })`, then `npm run sim`. `clashChip` = both lose that HP when they pick the same combat move.

---

## Don’t bother (already a bug)

- Parry/Block deals 0 vs Strike
- Stun as the punish
- Heal 15 (Push is better in every matchup)
- Drop Push while Parry still only beats Strike
- Attacks that do not step in, plus Back
- Shield-Parry (tie vs Strike) plus Push
- Parry that also beats Push
- Inflating Heal to ~36 so all four show up in the infinite mix
- Stamina as the first version
