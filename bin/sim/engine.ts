/** Shared duel resolution, Nash, and match simulation. */

export const ACTIONS = ['Strike', 'Push', 'Block', 'Heal'] as const
export type Action = typeof ACTIONS[number]
export const IDX = { Strike: 0, Push: 1, Block: 2, Heal: 3 } as const

export type Ruleset = {
	name: string
	strike: number
	push: number
	/** Damage dealt when Block counters Strike. 0 = nullify (needs stun to punish). */
	counter: number
	heal: number
	/** Winner of a connecting hit also loses this much HP (messy trade, not a separate resource). */
	chip: number
	/** Both players lose this much HP when they pick the same attack/block. */
	clashChip: number
	stun: boolean
	/** Extra damage on the next Strike/Push after winning an exchange. */
	nextHitBonus: number
	/** 0 = stamina off. Strike/Push spend stam; Heal can restore it. */
	staminaMax: number
	stamCost: [number, number, number, number]
	healStamina: number
	hp: number
	maxTurns: number
}

export type Outcome = {
	dA: number
	dB: number
	stunA: boolean
	stunB: boolean
	hitA: boolean
	hitB: boolean
}

type Rng = () => number

export function defaults(partial: Partial<Ruleset> & { name: string }): Ruleset {
	return {
		strike: 18,
		push: 18,
		counter: 18,
		heal: 18,
		chip: 0,
		clashChip: 0,
		stun: false,
		nextHitBonus: 0,
		staminaMax: 0,
		stamCost: [2, 3, 0, 0],
		healStamina: 3,
		hp: 100,
		maxTurns: 20,
		...partial,
	}
}

/** Heal amount where Push and Heal are both best responses (4-mix exists as a blend). */
export function healKnifeEdge(rules: Pick<Ruleset, 'strike' | 'push' | 'counter' | 'chip'>): number {
	const S = rules.strike - rules.chip
	const P = rules.push - rules.chip
	const C = rules.counter - rules.chip
	if (S <= 0) {
		return Infinity
	}
	return P * (1 + C / S)
}

function trade(dmg: number, chip: number): [number, number] {
	return [-chip, -dmg]
}

/** Absolute HP deltas for (A, B). Stun flags are only set when rules.stun is true. */
export function resolve(a: number, b: number, rules: Ruleset): Outcome {
	const S = rules.strike
	const P = rules.push
	const C = rules.counter
	const H = rules.heal
	const chip = rules.chip
	const clash = -rules.clashChip
	const none: Outcome = { dA: 0, dB: 0, stunA: false, stunB: false, hitA: false, hitB: false }

	const hit = (attackerIsA: boolean, dmg: number, doStun = true): Outcome => {
		const [w, l] = trade(dmg, chip)
		if (attackerIsA) {
			return { dA: w, dB: l, stunA: false, stunB: doStun && rules.stun, hitA: true, hitB: false }
		}
		return { dA: l, dB: w, stunA: doStun && rules.stun, stunB: false, hitA: false, hitB: true }
	}

	const blockStrike = (blockerIsA: boolean): Outcome => {
		if (C > 0) {
			return hit(blockerIsA, C)
		}
		if (rules.stun) {
			return blockerIsA
				? { dA: 0, dB: 0, stunA: false, stunB: true, hitA: false, hitB: false }
				: { dA: 0, dB: 0, stunA: true, stunB: false, hitA: false, hitB: false }
		}
		return none
	}

	if (a === 0 && b === 0) {
		return { dA: clash, dB: clash, stunA: false, stunB: false, hitA: false, hitB: false }
	}
	if (a === 0 && b === 1) {
		return hit(true, S)
	}
	if (a === 0 && b === 2) {
		return blockStrike(false)
	}
	if (a === 0 && b === 3) {
		return hit(true, S, false)
	}

	if (a === 1 && b === 0) {
		return hit(false, S)
	}
	if (a === 1 && b === 1) {
		return { dA: clash, dB: clash, stunA: false, stunB: false, hitA: false, hitB: false }
	}
	if (a === 1 && b === 2) {
		return hit(true, P)
	}
	if (a === 1 && b === 3) {
		return hit(true, P, false)
	}

	if (a === 2 && b === 0) {
		return blockStrike(true)
	}
	if (a === 2 && b === 1) {
		return hit(false, P)
	}
	if (a === 2 && b === 2) {
		return { dA: clash, dB: clash, stunA: false, stunB: false, hitA: false, hitB: false }
	}
	if (a === 2 && b === 3) {
		return { dA: 0, dB: H, stunA: false, stunB: false, hitA: false, hitB: false }
	}

	if (a === 3 && b === 0) {
		return hit(false, S, false)
	}
	if (a === 3 && b === 1) {
		return hit(false, P, false)
	}
	if (a === 3 && b === 2) {
		return { dA: H, dB: 0, stunA: false, stunB: false, hitA: false, hitB: false }
	}
	return { dA: H, dB: H, stunA: false, stunB: false, hitA: false, hitB: false }
}

export function payoffMatrix(rules: Ruleset): number[][] {
	return ACTIONS.map((_, i) =>
		ACTIONS.map((__, j) => {
			const o = resolve(i, j, rules)
			return o.dA - o.dB
		}),
	)
}

function solveLinear(matrix: number[][], vec: number[]): number[] | null {
	const n = vec.length
	const a = matrix.map((row, i) => [...row, vec[i]])
	for (let col = 0; col < n; col++) {
		let piv = col
		for (let r = col + 1; r < n; r++) {
			if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) {
				piv = r
			}
		}
		if (Math.abs(a[piv][col]) < 1e-10) {
			return null
		}
		const tmp = a[col]
		a[col] = a[piv]
		a[piv] = tmp
		const div = a[col][col]
		for (let j = col; j <= n; j++) {
			a[col][j] /= div
		}
		for (let r = 0; r < n; r++) {
			if (r === col) {
				continue
			}
			const f = a[r][col]
			for (let j = col; j <= n; j++) {
				a[r][j] -= f * a[col][j]
			}
		}
	}
	return a.map((row) => row[n])
}

function expected(row: number[], mix: number[]): number {
	let s = 0
	for (let j = 0; j < mix.length; j++) {
		s += row[j] * mix[j]
	}
	return s
}

export type Nash = {
	mix: number[]
	value: number
	support: number[]
	exploitability: number
}

/** Symmetric Nash via support enumeration. Falls back to fictitious play. */
export function nash(matrix: number[][]): Nash {
	const n = matrix.length
	const found: Nash[] = []
	const eps = 1e-6

	for (let mask = 1; mask < 1 << n; mask++) {
		const S: number[] = []
		for (let i = 0; i < n; i++) {
			if (mask & (1 << i)) {
				S.push(i)
			}
		}
		const k = S.length
		const M = Array.from({ length: k }, () => Array(k).fill(0))
		const b = Array(k).fill(0)
		for (let t = 1; t < k; t++) {
			const r = S[t]
			const r0 = S[0]
			for (let u = 0; u < k; u++) {
				M[t - 1][u] = matrix[r][S[u]] - matrix[r0][S[u]]
			}
		}
		for (let u = 0; u < k; u++) {
			M[k - 1][u] = 1
		}
		b[k - 1] = 1
		const pS = solveLinear(M, b)
		if (!pS || pS.some((p) => p < -eps)) {
			continue
		}
		if (pS.some((p) => p < eps)) {
			continue
		}
		const mix = Array(n).fill(0)
		for (let u = 0; u < k; u++) {
			mix[S[u]] = pS[u]
		}
		const value = expected(matrix[S[0]], mix)
		let ok = true
		for (let j = 0; j < n; j++) {
			if (S.includes(j)) {
				continue
			}
			if (expected(matrix[j], mix) > value + 1e-5) {
				ok = false
				break
			}
		}
		if (ok) {
			found.push({ mix, value, support: S, exploitability: 0 })
		}
	}

	const result = found.length
		? maxMinBlend(found)
		: fictitiousPlay(matrix)
	result.exploitability = exploitability(matrix, result.mix)
	result.support = result.mix.map((p, i) => (p > 0.02 ? i : -1)).filter((i) => i >= 0)
	return result
}

/** Zero-sum Nash set is convex: blend equilibria to keep every action in the mix. */
function maxMinBlend(found: Nash[]): Nash {
	let best = found[0]
	let bestMin = Math.min(...best.mix)
	const consider = (mix: number[], value: number) => {
		const m = Math.min(...mix)
		if (m > bestMin + 1e-12) {
			bestMin = m
			best = { mix, value, support: [], exploitability: 0 }
		}
	}
	for (const a of found) {
		consider(a.mix, a.value)
		for (const b of found) {
			for (let t = 0; t <= 40; t++) {
				const l = t / 40
				consider(
					a.mix.map((p, i) => l * p + (1 - l) * b.mix[i]),
					a.value,
				)
			}
		}
	}
	return best
}

function fictitiousPlay(matrix: number[][], iterations = 30_000): Nash {
	const n = matrix.length
	const counts = Array(n).fill(0)
	let last = 0
	for (let t = 0; t < iterations; t++) {
		counts[last]++
		const emp = counts.map((c) => c / (t + 1))
		let best = 0
		let bestVal = -Infinity
		for (let i = 0; i < n; i++) {
			const exp = expected(matrix[i], emp)
			if (exp > bestVal) {
				bestVal = exp
				best = i
			}
		}
		last = best
	}
	const mix = counts.map((c) => c / iterations)
	let value = 0
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			value += mix[i] * matrix[i][j] * mix[j]
		}
	}
	const support = mix.map((p, i) => (p > 0.02 ? i : -1)).filter((i) => i >= 0)
	return { mix, value, support, exploitability: 0 }
}

export function exploitability(matrix: number[][], mix: number[]): number {
	let best = -Infinity
	for (const row of matrix) {
		best = Math.max(best, expected(row, mix))
	}
	let v = 0
	for (let i = 0; i < mix.length; i++) {
		v += mix[i] * expected(matrix[i], mix)
	}
	return best - v
}

export function dominated(matrix: number[][]): string[] {
	const n = matrix.length
	const out: string[] = []
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			if (i === j) {
				continue
			}
			let weakly = true
			let strictly = false
			for (let k = 0; k < n; k++) {
				if (matrix[j][k] < matrix[i][k] - 1e-9) {
					weakly = false
					break
				}
				if (matrix[j][k] > matrix[i][k] + 1e-9) {
					strictly = true
				}
			}
			if (weakly && strictly) {
				out.push(`${ACTIONS[i]} dominated by ${ACTIONS[j]}`)
			}
		}
	}
	return out
}

export function entropy(mix: number[]): number {
	let h = 0
	for (const p of mix) {
		if (p > 1e-12) {
			h -= p * Math.log2(p)
		}
	}
	return h
}

export function createRng(seed: number): Rng {
	let s = seed | 0
	return () => {
		s = (Math.imul(s, 1664525) + 1013904223) | 0
		return (s >>> 0) / 4294967296
	}
}

export type StratCtx = {
	history: { me: Action; opp: Action }[]
	hpMe: number
	hpOpp: number
	stam: number
	stamCost: [number, number, number, number]
	rng: Rng
}

export type Strategy = {
	name: string
	choose: (ctx: StratCtx) => number
}

export function mixed(name: string, probs: number[]): Strategy {
	return {
		name,
		choose({ rng, stam, stamCost }) {
			let weights = probs
			if (stamCost) {
				const aff = probs.map((p, i) => (stamCost[i] <= stam ? p : 0))
				const sum = aff.reduce((a, b) => a + b, 0)
				if (sum > 0) {
					weights = aff
				}
			}
			const r = rng() * weights.reduce((a, b) => a + b, 0)
			let acc = 0
			for (let i = 0; i < weights.length; i++) {
				acc += weights[i]
				if (r < acc) {
					return i
				}
			}
			return weights.length - 1
		},
	}
}

function lerpMix(a: number[], b: number[], t: number): number[] {
	const out = a.map((p, i) => p * (1 - t) + b[i] * t)
	const s = out.reduce((x, y) => x + y, 0)
	return out.map((p) => p / s)
}

/** Last-move counter. Heal only vs turtles, and only when not already full. */
export function hpAware(triangle: number[], stick = 0.55): Strategy {
	const sum = triangle[0] + triangle[1] + triangle[2]
	const tri = [triangle[0] / sum, triangle[1] / sum, triangle[2] / sum, 0]
	return {
		name: 'HP-aware',
		choose(ctx) {
			const last = ctx.history[ctx.history.length - 1]
			let mix = tri
			if (last) {
				if (last.opp === 'Strike') {
					mix = lerpMix(tri, [0, 0, 1, 0], stick)
				} else if (last.opp === 'Push') {
					mix = lerpMix(tri, [1, 0, 0, 0], stick)
				} else if (last.opp === 'Block') {
					const heal = ctx.hpMe < 92 && (ctx.hpMe <= ctx.hpOpp + 4)
					mix = lerpMix(tri, heal ? [0, 0, 0, 1] : [0, 1, 0, 0], stick)
				} else {
					mix = lerpMix(tri, [0.55, 0.45, 0, 0], stick)
				}
			}
			return mixed('tmp', mix).choose(ctx)
		},
	}
}

export function pure(action: Action): Strategy {
	const idx = IDX[action]
	return { name: `Pure ${action}`, choose: () => idx }
}

export function noisy(base: Strategy, noise = 0.15): Strategy {
	return {
		name: `${base.name} ~${Math.round(noise * 100)}%`,
		choose(ctx) {
			if (ctx.rng() < noise) {
				return Math.floor(ctx.rng() * 4)
			}
			return base.choose(ctx)
		},
	}
}

function clampHp(hp: number, maxHp: number): number {
	return Math.min(maxHp, Math.max(0, hp))
}

export type MatchResult = {
	winner: 'A' | 'B' | 'draw'
	turns: number
	finalHpA: number
	finalHpB: number
	usageA: number[]
	usageB: number[]
	ko: boolean
	/** Turns where both players' HP was unchanged. */
	deadRounds: number
}

function stunPunish(actor: number, rules: Ruleset, bonus: number): number {
	if (actor === 0) {
		return rules.strike + bonus
	}
	if (actor === 1) {
		return rules.push + bonus
	}
	return 0
}

function afford(action: number, stam: number, rules: Ruleset): number {
	if (!rules.staminaMax) {
		return action
	}
	if (rules.stamCost[action] <= stam) {
		return action
	}
	if (rules.stamCost[2] <= stam) {
		return 2
	}
	return 3
}

function spendStam(stam: number, action: number, healed: boolean, rules: Ruleset): number {
	if (!rules.staminaMax) {
		return stam
	}
	let next = stam - rules.stamCost[action]
	if (healed) {
		next += rules.healStamina
	}
	return Math.min(rules.staminaMax, Math.max(0, next))
}

export function playMatch(
	stratA: Strategy,
	stratB: Strategy,
	rules: Ruleset,
	seed: number,
): MatchResult {
	const maxHp = rules.hp
	let hpA = maxHp
	let hpB = maxHp
	let stamA = rules.staminaMax
	let stamB = rules.staminaMax
	const stamCost: [number, number, number, number] = rules.staminaMax ? rules.stamCost : [0, 0, 0, 0]
	let stunA = false
	let stunB = false
	let bonusA = 0
	let bonusB = 0
	const historyA: { me: Action; opp: Action }[] = []
	const historyB: { me: Action; opp: Action }[] = []
	const usageA = [0, 0, 0, 0]
	const usageB = [0, 0, 0, 0]
	let deadRounds = 0
	const rngA = createRng(seed)
	const rngB = createRng(seed ^ 0x9e3779b9)

	for (let turn = 1; turn <= rules.maxTurns; turn++) {
		const rawA = stunA ? -1 : stratA.choose({ history: historyA, hpMe: hpA, hpOpp: hpB, stam: stamA, stamCost, rng: rngA })
		const rawB = stunB ? -1 : stratB.choose({ history: historyB, hpMe: hpB, hpOpp: hpA, stam: stamB, stamCost, rng: rngB })
		const a = rawA < 0 ? -1 : afford(rawA, stamA, rules)
		const b = rawB < 0 ? -1 : afford(rawB, stamB, rules)
		stunA = false
		stunB = false

		let dA = 0
		let dB = 0
		let hitA = false
		let hitB = false
		let shownA: Action = a >= 0 ? ACTIONS[a] : 'Block'
		let shownB: Action = b >= 0 ? ACTIONS[b] : 'Block'

		if (a < 0 && b < 0) {
			// both stunned — should not happen
		} else if (a < 0) {
			usageB[b]++
			shownB = ACTIONS[b]
			if (b === 3) {
				dB = rules.heal
			} else {
				dA = -stunPunish(b, rules, bonusB)
				if (dA < 0) {
					hitB = true
					bonusB = 0
				}
			}
		} else if (b < 0) {
			usageA[a]++
			shownA = ACTIONS[a]
			if (a === 3) {
				dA = rules.heal
			} else {
				dB = -stunPunish(a, rules, bonusA)
				if (dB < 0) {
					hitA = true
					bonusA = 0
				}
			}
		} else {
			usageA[a]++
			usageB[b]++
			shownA = ACTIONS[a]
			shownB = ACTIONS[b]
			const o = resolve(a, b, rules)
			dA = o.dA
			dB = o.dB
			hitA = o.hitA
			hitB = o.hitB
			stunA = o.stunA
			stunB = o.stunB
			if (hitA && rules.nextHitBonus) {
				dB -= bonusA
				bonusA = rules.nextHitBonus
			} else if (hitA) {
				bonusA = rules.nextHitBonus
			}
			if (hitB && rules.nextHitBonus) {
				dA -= bonusB
				bonusB = rules.nextHitBonus
			} else if (hitB) {
				bonusB = rules.nextHitBonus
			}
			if (!hitA) {
				bonusA = 0
			}
			if (!hitB) {
				bonusB = 0
			}
		}

		if (dA === 0 && dB === 0) {
			deadRounds++
		}
		hpA = clampHp(hpA + dA, maxHp)
		hpB = clampHp(hpB + dB, maxHp)
		if (a >= 0) {
			stamA = spendStam(stamA, a, a === 3 && dA > 0, rules)
		}
		if (b >= 0) {
			stamB = spendStam(stamB, b, b === 3 && dB > 0, rules)
		}
		historyA.push({ me: shownA, opp: shownB })
		historyB.push({ me: shownB, opp: shownA })
		if (hpA <= 0 || hpB <= 0) {
			break
		}
	}

	let winner: MatchResult['winner'] = 'draw'
	if (hpA > hpB) {
		winner = 'A'
	} else if (hpB > hpA) {
		winner = 'B'
	}
	return {
		winner,
		turns: historyA.length,
		finalHpA: hpA,
		finalHpB: hpB,
		usageA,
		usageB,
		ko: hpA <= 0 || hpB <= 0,
		deadRounds,
	}
}

export type Series = {
	winsA: number
	winsB: number
	draws: number
	games: number
	avgTurns: number
	koRate: number
	/** Share of turns where neither HP changed. */
	deadRoundRate: number
	usageA: number[]
}

export function runSeries(
	stratA: Strategy,
	stratB: Strategy,
	rules: Ruleset,
	games = 2000,
	seed = 1,
): Series {
	let winsA = 0
	let winsB = 0
	let draws = 0
	let totalTurns = 0
	let kos = 0
	let deadRounds = 0
	const usageA = [0, 0, 0, 0]
	for (let i = 0; i < games; i++) {
		const r = playMatch(stratA, stratB, rules, seed + i * 17)
		if (r.winner === 'A') {
			winsA++
		} else if (r.winner === 'B') {
			winsB++
		} else {
			draws++
		}
		totalTurns += r.turns
		deadRounds += r.deadRounds
		if (r.ko) {
			kos++
		}
		for (let k = 0; k < 4; k++) {
			usageA[k] += r.usageA[k]
		}
	}
	return {
		winsA,
		winsB,
		draws,
		games,
		avgTurns: totalTurns / games,
		koRate: kos / games,
		deadRoundRate: totalTurns ? deadRounds / totalTurns : 0,
		usageA,
	}
}

export function formatMix(mix: number[]): string {
	return ACTIONS.map((a, i) => `${a} ${(mix[i] * 100).toFixed(1)}%`).join('  ')
}

export function minMix(mix: number[]): number {
	return Math.min(...mix)
}

const sim = {
	ACTIONS,
	IDX,
	defaults,
	resolve,
	payoffMatrix,
	nash,
	exploitability,
	dominated,
	entropy,
	mixed,
	hpAware,
	pure,
	noisy,
	playMatch,
	runSeries,
	formatMix,
	minMix,
	healKnifeEdge,
}

export default sim
