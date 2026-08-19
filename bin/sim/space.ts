/** Distance + Back/Forward on top of the 4-action matrix. */
import { createRng, defaults, resolve, type Ruleset } from './engine.ts'

export const SPACE_ACTIONS = ['Strike', 'Push', 'Block', 'Heal', 'Back', 'Forward'] as const
export type SpaceAction = typeof SPACE_ACTIONS[number]
export const SPACE_IDX = { Strike: 0, Push: 1, Block: 2, Heal: 3, Back: 4, Forward: 5 } as const

export type SpaceRules = {
	name: string
	damage: Ruleset
	startDist: number
	minDist: number
	maxDist: number
	/** Positive closes. Back is negative. */
	close: [number, number, number, number, number, number]
	strikeRange: number
	pushRange: number
	healMaxDist: number
	ram: number
}

type Rng = () => number

export type SpaceCtx = {
	history: { me: SpaceAction; opp: SpaceAction }[]
	hpMe: number
	hpOpp: number
	dist: number
	rng: Rng
}

export type SpaceStrategy = {
	name: string
	choose: (ctx: SpaceCtx) => number
}

function clamp(n: number, lo: number, hi: number): number {
	return Math.min(hi, Math.max(lo, n))
}

function meleeId(i: number, dist: number, rules: SpaceRules): number {
	if (i === 0) {
		return dist <= rules.strikeRange ? 0 : -1
	}
	if (i === 1) {
		return dist <= rules.pushRange ? 1 : -1
	}
	if (i === 2) {
		return 2
	}
	if (i === 3) {
		return dist <= rules.healMaxDist ? 3 : -1
	}
	return -1
}

export function resolveSpace(
	a: number,
	b: number,
	dist: number,
	rules: SpaceRules,
): { dA: number; dB: number; dist: number } {
	const next = clamp(dist - rules.close[a] - rules.close[b], rules.minDist, rules.maxDist)
	const none = { dA: 0, dB: 0, dist: next }

	// Back vs Strike: they step in, punch misses. Same HP, still next to each other.
	if ((a === 0 && b === 4) || (a === 4 && b === 0)) {
		return none
	}

	const ia = meleeId(a, next, rules)
	const ib = meleeId(b, next, rules)
	const dmg = rules.damage

	if (ia >= 0 && ib >= 0) {
		const o = resolve(ia, ib, dmg)
		return { dA: o.dA, dB: o.dB, dist: next }
	}
	if (ia >= 0 && ib < 0) {
		if (ia === 0 || ia === 1) {
			const o = resolve(ia, 3, dmg)
			return { dA: o.dA, dB: o.dB, dist: next }
		}
		if (ia === 3) {
			return { dA: dmg.heal, dB: 0, dist: next }
		}
		return none
	}
	if (ib >= 0 && ia < 0) {
		if (ib === 0 || ib === 1) {
			const o = resolve(3, ib, dmg)
			return { dA: o.dA, dB: o.dB, dist: next }
		}
		if (ib === 3) {
			return { dA: 0, dB: dmg.heal, dist: next }
		}
		return none
	}

	if (!rules.ram) {
		return none
	}
	let dA = 0
	let dB = 0
	if (next === rules.minDist) {
		if (a === 5 && b !== 4) {
			dB -= rules.ram
		}
		if (b === 5 && a !== 4) {
			dA -= rules.ram
		}
	}
	return { dA, dB, dist: next }
}

function pick(probs: number[], rng: Rng): number {
	const r = rng() * probs.reduce((x, y) => x + y, 0)
	let acc = 0
	for (let i = 0; i < probs.length; i++) {
		acc += probs[i]
		if (r < acc) {
			return i
		}
	}
	return probs.length - 1
}

export function spacePure(action: SpaceAction): SpaceStrategy {
	const idx = SPACE_IDX[action]
	return { name: `Pure ${action}`, choose: () => idx }
}

const TRI = [0.31, 0.31, 0.31, 0.07]

/** Close if far; play the 4-mix (plus rare Back) in melee. */
export function duelist(rules: SpaceRules): SpaceStrategy {
	return {
		name: 'Duelist',
		choose(ctx) {
			if (ctx.dist > rules.minDist) {
				const lunge = rules.close[0]
				if (ctx.dist - lunge <= rules.strikeRange) {
					return pick([0.5, 0.1, 0.2, 0.05, 0, 0.15], ctx.rng)
				}
				return 5
			}
			return pick([0.3, 0.28, 0.3, 0.07, 0.05, 0], ctx.rng)
		},
	}
}

export function runner(): SpaceStrategy {
	return { name: 'Runner', choose: () => 4 }
}

export function snipeHeal(rules: SpaceRules): SpaceStrategy {
	return {
		name: 'Snipe-heal',
		choose(ctx) {
			if (ctx.dist > rules.minDist) {
				return 3
			}
			return pick([...TRI, 0, 0], ctx.rng)
		},
	}
}

export function turtleFar(rules: SpaceRules): SpaceStrategy {
	return {
		name: 'Turtle-far',
		choose(ctx) {
			if (ctx.dist < rules.maxDist) {
				return 4
			}
			return 3
		},
	}
}

export function rushdown(rules: SpaceRules): SpaceStrategy {
	return {
		name: 'Rushdown',
		choose(ctx) {
			if (ctx.dist > rules.minDist) {
				return rules.close[0] > 0 ? 0 : 5
			}
			return pick([0.55, 0.25, 0.15, 0.05, 0, 0], ctx.rng)
		},
	}
}

type SpaceMatch = {
	winner: 'A' | 'B' | 'draw'
	turns: number
	ko: boolean
	usageA: number[]
	avgDist: number
}

export function playSpace(
	stratA: SpaceStrategy,
	stratB: SpaceStrategy,
	rules: SpaceRules,
	seed: number,
): SpaceMatch {
	const maxHp = rules.damage.hp
	let hpA = maxHp
	let hpB = maxHp
	let dist = rules.startDist
	let distSum = 0
	const historyA: { me: SpaceAction; opp: SpaceAction }[] = []
	const historyB: { me: SpaceAction; opp: SpaceAction }[] = []
	const usageA = [0, 0, 0, 0, 0, 0]
	const rngA = createRng(seed)
	const rngB = createRng(seed ^ 0x9e3779b9)

	for (let turn = 1; turn <= rules.damage.maxTurns; turn++) {
		const a = stratA.choose({ history: historyA, hpMe: hpA, hpOpp: hpB, dist, rng: rngA })
		const b = stratB.choose({ history: historyB, hpMe: hpB, hpOpp: hpA, dist, rng: rngB })
		usageA[a]++
		const o = resolveSpace(a, b, dist, rules)
		dist = o.dist
		distSum += dist
		hpA = clamp(hpA + o.dA, 0, maxHp)
		hpB = clamp(hpB + o.dB, 0, maxHp)
		historyA.push({ me: SPACE_ACTIONS[a], opp: SPACE_ACTIONS[b] })
		historyB.push({ me: SPACE_ACTIONS[b], opp: SPACE_ACTIONS[a] })
		if (hpA <= 0 || hpB <= 0) {
			break
		}
	}

	let winner: SpaceMatch['winner'] = 'draw'
	if (hpA > hpB) {
		winner = 'A'
	} else if (hpB > hpA) {
		winner = 'B'
	}
	const turns = historyA.length
	return { winner, turns, ko: hpA <= 0 || hpB <= 0, usageA, avgDist: turns ? distSum / turns : dist }
}

export type SpaceSeries = {
	fairA: number
	avgTurns: number
	koRate: number
	avgDist: number
	usageA: number[]
}

export function runSpace(
	a: SpaceStrategy,
	b: SpaceStrategy,
	rules: SpaceRules,
	games = 500,
	seed = 1,
): SpaceSeries {
	let wins = 0
	let draws = 0
	let turns = 0
	let kos = 0
	let dist = 0
	const usageA = [0, 0, 0, 0, 0, 0]
	for (let i = 0; i < games; i++) {
		const r = playSpace(a, b, rules, seed + i * 19)
		if (r.winner === 'A') {
			wins++
		} else if (r.winner === 'draw') {
			draws++
		}
		turns += r.turns
		if (r.ko) {
			kos++
		}
		dist += r.avgDist
		for (let k = 0; k < 6; k++) {
			usageA[k] += r.usageA[k]
		}
	}
	return {
		fairA: (wins + 0.5 * draws) / games,
		avgTurns: turns / games,
		koRate: kos / games,
		avgDist: dist / games,
		usageA,
	}
}

const dmg = () => defaults({ name: 'space-dmg', strike: 18, push: 18, counter: 18, heal: 20, chip: 4 })

function pack(
	name: string,
	close: SpaceRules['close'],
	extra: Partial<SpaceRules> = {},
): SpaceRules {
	return {
		name,
		damage: dmg(),
		startDist: 1,
		minDist: 1,
		maxDist: 4,
		close,
		strikeRange: 1,
		pushRange: 1,
		healMaxDist: 99,
		ram: 0,
		...extra,
	}
}

/** Many movement geometries. close = Strike, Push, Block, Heal, Back, Forward. */
export const spacePacks: SpaceRules[] = [
	pack('no-lunge', [0, 0, 0, 0, -1, 1]),
	pack('lunge-strike', [1, 0, 0, 0, -1, 1]),
	pack('lunge-both', [1, 1, 0, 0, -1, 1]),
	pack('lunge-push', [0, 1, 0, 0, -1, 1]),
	pack('strike-range2', [0, 0, 0, 0, -1, 1], { strikeRange: 2 }),
	pack('range2-lunge-strike', [1, 0, 0, 0, -1, 1], { strikeRange: 2 }),
	pack('lunge-strike-max2', [1, 0, 0, 0, -1, 1], { maxDist: 2 }),
	pack('lunge-strike-max3', [1, 0, 0, 0, -1, 1], { maxDist: 3 }),
	pack('lunge-strike-start2', [1, 0, 0, 0, -1, 1], { startDist: 2 }),
	pack('lunge-strike-heal-melee', [1, 0, 0, 0, -1, 1], { healMaxDist: 1 }),
	pack('lunge-2', [2, 0, 0, 0, -1, 1]),
	pack('back-2', [1, 0, 0, 0, -2, 1]),
	pack('forward-2', [0, 0, 0, 0, -1, 2]),
	pack('lunge-strike-ram8', [1, 0, 0, 0, -1, 1], { ram: 8 }),
	pack('no-lunge-ram8', [0, 0, 0, 0, -1, 1], { ram: 8 }),
	pack('lunge-both-ram8', [1, 1, 0, 0, -1, 1], { ram: 8 }),
	pack('lunge-strike-min0', [1, 0, 0, 0, -1, 1], { minDist: 0 }),
	pack('lunge-strike-min0-ram', [1, 0, 0, 0, -1, 1], { minDist: 0, ram: 8 }),
	pack('lunge-both-max2', [1, 1, 0, 0, -1, 1], { maxDist: 2 }),
	pack('range2-push1-max3', [0, 0, 0, 0, -1, 1], { strikeRange: 2, pushRange: 1, maxDist: 3 }),
	pack('lunge-strike-heal-d2', [1, 0, 0, 0, -1, 1], { healMaxDist: 2 }),
	pack('lunge-strike-max2-heal1', [1, 0, 0, 0, -1, 1], { maxDist: 2, healMaxDist: 1 }),
	pack('lunge-strike-max3-heal1', [1, 0, 0, 0, -1, 1], { maxDist: 3, healMaxDist: 1 }),
	pack('range2-max2', [0, 0, 0, 0, -1, 1], { strikeRange: 2, maxDist: 2 }),
]

const space = {
	SPACE_ACTIONS,
	spacePacks,
	resolveSpace,
	playSpace,
	runSpace,
	duelist,
	runner,
	snipeHeal,
	turtleFar,
	rushdown,
	spacePure,
}

export default space
