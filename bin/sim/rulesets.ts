import { defaults, type Ruleset } from './engine.ts'

/**
 * Named rulesets for `bin/balance-sim.ts`.
 * Playable pick: `fun-chip4`. Theory baseline: `v1-18-20`.
 * See docs/simulations.md.
 */
const candidates: Ruleset[] = [
	defaults({
		name: 'fun-chip4',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 20,
		chip: 4,
	}),
	defaults({
		name: 'fun-push-chip4',
		strike: 18,
		push: 20,
		counter: 18,
		heal: 22,
		chip: 4,
	}),
	defaults({
		name: 'fun-chip-clash',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 20,
		chip: 3,
		clashChip: 2,
	}),
	defaults({
		name: 'fun-chip-bonus',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 20,
		chip: 3,
		nextHitBonus: 4,
	}),
	defaults({
		name: 'v1-18-20',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 20,
	}),
	defaults({
		name: 'v1-push-reward',
		strike: 16,
		push: 20,
		counter: 18,
		heal: 20,
	}),
	defaults({
		name: 'v1-low-dmg',
		strike: 12,
		push: 12,
		counter: 12,
		heal: 14,
	}),
	defaults({
		name: 'knife-edge-18-36',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 36,
	}),
	defaults({
		name: 'claude-18-15-stun',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 15,
		stun: true,
	}),
	defaults({
		name: 'claude-18-15-nostun',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 15,
	}),
	defaults({
		name: 'grok-16-20-18-26',
		strike: 16,
		push: 20,
		counter: 18,
		heal: 26,
	}),
	defaults({
		name: 'soft-counter',
		strike: 18,
		push: 20,
		counter: 12,
		heal: 20,
	}),
	defaults({
		name: 'soft-advantage',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 20,
		nextHitBonus: 5,
	}),
	defaults({
		name: 'stamina-heal-rest',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 16,
		staminaMax: 8,
		stamCost: [2, 3, 0, 0],
		healStamina: 4,
	}),
	/** Anti-aggro: cheap Strike still burns out. Block stays free (turtle still works). */
	defaults({
		name: 'stamina-light',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 20,
		staminaMax: 6,
		stamCost: [1, 2, 0, 0],
		healStamina: 3,
	}),
	/** Anti-turtle: Block costs stam too, so holding forever eventually opens you. */
	defaults({
		name: 'stamina-block-tax',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 20,
		staminaMax: 8,
		stamCost: [2, 3, 1, 0],
		healStamina: 4,
	}),
	defaults({
		name: 'clash-chip2',
		strike: 18,
		push: 18,
		counter: 18,
		heal: 20,
		clashChip: 2,
	}),
	defaults({
		name: 'nullify-block',
		strike: 18,
		push: 18,
		counter: 0,
		heal: 20,
	}),
	defaults({
		name: 'nullify-block-stun',
		strike: 18,
		push: 18,
		counter: 0,
		heal: 20,
		stun: true,
	}),
]

const rulesets = { candidates }

export default rulesets
