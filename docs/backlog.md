# Backlog — what's missing for a playable MVP

> **Superseded for combat rules** by turn-based design in [`docs/simulations.md`](simulations.md) and implementation plan in [`docs/handoff-combat-v1.md`](handoff-combat-v1.md). Items below describe the **old real-time** prototype; many are obsolete.

Current state: Select → Fight with real-time tile combat (`Fight.ts`). Target: turn-based v1 per handoff (engine-driven, no walking).

- [ ] Apply damage: hit detection between attacker and enemy on `attack` (use existing `config.ATTACK_DAMAGE` / `CHARGE_DAMAGE`)
- [ ] Health on `Char` (start at `MAX_HEALTH`), track, and decrement on hits
- [ ] Health bars / HUD for both players (sprites or text objects above characters)
- [ ] Play `hit` state on the character when they take damage (state already exists in `CharStates`)
- [ ] Die when health <= 0: play `dead` state, stop input for that player
- [ ] Win condition + game-over screen (winner announcement, restart / back-to-menu prompt)
- [ ] Un-comment / wire up the commented-out audio calls in `Fight.ts` (`attack`, `die`, `power`)
- [ ] Block mechanic: consume `BLOCK_MITIGATION` to reduce incoming damage, plus a `block` input + animation
- [ ] Heal mechanic: consume `HEAL_DAMAGE` (negative = restore) so heal actually does something
- [ ] Attack cooldowns / action locking so players can't spam every frame (tween lock exists, but actions need real timing)
- [ ] Charge mechanic: charge builds up a stronger attack over time (currently charge just walks one tile)
- [ ] Title / start menu state (how to play, choose character instead of random, press key to start)
- [ ] Character select screen (replaces random `shuffle` in `Fight.create`)
- [ ] "Ready?" pre-fight countdown
- [ ] Restart without page reload (state transition Fight → title)
- [ ] Screen shake / hit flash / particles as hit feedback (shake exists for wall/attack only)
- [ ] Keep characters within tile bounds on charge (currently only `back` clamps)
- [ ] Face the enemy: re-orient `CharDirection` when players cross or after being pushed
- [ ] Round timer or time-out rule so matches can't stall forever
- [ ] Basic AI or a pass-and-play note: confirm two-keyboard layout is documented in a README/how-to-play
- [ ] Min README update: controls table (P1/P2 keys), how to run, what the MVP is
- [ ] Persist a small win/loss counter between rounds (nice-to-have)
- [ ] Add tests or at least a manual smoke-test checklist doc once core loop lands
