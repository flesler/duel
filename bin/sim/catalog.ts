/**
 * Swap-in move lists. Each catalog is a table of HP changes (me, them).
 * `chip` in other files = winner also loses 4 HP — here that is already baked into the table.
 */
import { createRng, nash } from './engine.ts'

export type Hp = { me: number; them: number }

export type Catalog = {
	name: string;
	moves: string[];
	/** hp[myMove][theirMove] */
	hp: Hp[][];
	note: string
}

const HIT = 18
const SELF = 4
const HEAL = 20
const HALF = 10

function hit(): Hp {
	return { me: -SELF, them: -HIT }
}
function gotHit(): Hp {
	return { me: -HIT, them: -SELF }
}
function punish(): Hp {
	return { me: -SELF, them: -HIT }
}
function none(): Hp {
	return { me: 0, them: 0 }
}
function iHeal(n = HEAL): Hp {
	return { me: n, them: 0 }
}
function theyHeal(n = HEAL): Hp {
	return { me: 0, them: n }
}
function bothHeal(n = HEAL): Hp {
	return { me: n, them: n }
}

function table(moves: string[], cell: (a: string, b: string) => Hp): Hp[][] {
	return moves.map((a) => moves.map((b) => cell(a, b)))
}

function rel(h: Hp): number {
	return h.me - h.them
}

/** Classic four: Strike / Push / Block / Heal. Block punishes Strike; Push hits Block. */
const classic4: Catalog = {
	name: 'classic-push-block',
	moves: ['Strike', 'Push', 'Block', 'Heal'],
	note: 'Current set. Push is the anti-Block. Block is really a parry.',
	hp: table(['Strike', 'Push', 'Block', 'Heal'], (a, b) => {
		if (a === 'Strike' && b === 'Strike') return none()
		if (a === 'Strike' && b === 'Push') return hit()
		if (a === 'Strike' && b === 'Block') return gotHit()
		if (a === 'Strike' && b === 'Heal') return hit()
		if (a === 'Push' && b === 'Strike') return gotHit()
		if (a === 'Push' && b === 'Push') return none()
		if (a === 'Push' && b === 'Block') return hit()
		if (a === 'Push' && b === 'Heal') return hit()
		if (a === 'Block' && b === 'Strike') return punish()
		if (a === 'Block' && b === 'Push') return gotHit()
		if (a === 'Block' && b === 'Block') return none()
		if (a === 'Block' && b === 'Heal') return theyHeal()
		if (a === 'Heal' && b === 'Strike') return gotHit()
		if (a === 'Heal' && b === 'Push') return gotHit()
		if (a === 'Heal' && b === 'Block') return iHeal()
		return bothHeal()
	}),
}

/** Same numbers, Block renamed Parry. */
const parryName: Catalog = {
	name: 'parry-for-block',
	moves: ['Strike', 'Push', 'Parry', 'Heal'],
	note: 'Same as classic. Parry is just a clearer name for “I beat your Strike.” Push still exists to beat Parry.',
	hp: classic4.hp,
}

/** Three-move cycle, no Push. Strike > Heal > Parry > Strike. */
const rps: Catalog = {
	name: 'strike-parry-heal',
	moves: ['Strike', 'Parry', 'Heal'],
	note: 'Drop Push. Heal is the only answer to Parry. Simpler; no grab.',
	hp: table(['Strike', 'Parry', 'Heal'], (a, b) => {
		if (a === 'Strike' && b === 'Strike') return none()
		if (a === 'Strike' && b === 'Parry') return gotHit()
		if (a === 'Strike' && b === 'Heal') return hit()
		if (a === 'Parry' && b === 'Strike') return punish()
		if (a === 'Parry' && b === 'Parry') return none()
		if (a === 'Parry' && b === 'Heal') return theyHeal()
		if (a === 'Heal' && b === 'Strike') return gotHit()
		if (a === 'Heal' && b === 'Parry') return iHeal()
		return bothHeal()
	}),
}

function withBack(
	name: string,
	note: string,
	backVsParry: Hp,
	backVsHeal: Hp = theyHeal(),
): Catalog {
	const moves = ['Strike', 'Parry', 'Heal', 'Back']
	return {
		name,
		moves,
		note,
		hp: table(moves, (a, b) => {
			if (a !== 'Back' && b !== 'Back') {
				const i = rps.moves.indexOf(a)
				const j = rps.moves.indexOf(b)
				return rps.hp[i][j]
			}
			if (a === 'Back' && b === 'Back') return none()
			if (a === 'Back' && b === 'Strike') return none()
			if (a === 'Strike' && b === 'Back') return none()
			if (a === 'Back' && b === 'Parry') return backVsParry
			if (a === 'Parry' && b === 'Back') return { me: backVsParry.them, them: backVsParry.me }
			if (a === 'Back' && b === 'Heal') return backVsHeal
			if (a === 'Heal' && b === 'Back') return { me: backVsHeal.them, them: backVsHeal.me }
			return none()
		}),
	}
}

const catalogs: Catalog[] = [
	classic4,
	{ ...parryName, hp: parryName.hp },
	rps,
	withBack(
		'rps+back-noop',
		'Back ties Strike, nothing vs Parry. Back has no unique win — likely a dead move.',
		none(),
	),
	withBack(
		'rps+back-halfheal-on-parry',
		'Back ties Strike, gains 10 vs Parry. Heal still gains 20 vs Parry so Heal is greedier.',
		iHeal(HALF),
	),
	withBack(
		'rps+back-fullheal-on-parry',
		'Back ties Strike and gains 20 vs Parry — same profit as Heal, but Strike is a tie not a hit. Heal may never be correct.',
		iHeal(HEAL),
	),
	withBack(
		'rps+back-they-whiff-damage',
		'Back ties Strike; vs Parry they take 18 (whiff punish) and you take 4. Back becomes “punish Parry.”',
		hit(),
	),
	{
		name: 'parry-beats-push',
		moves: ['Strike', 'Push', 'Parry', 'Heal'],
		note: 'Parry also beats Push. Then Push has no unique win.',
		hp: table(['Strike', 'Push', 'Parry', 'Heal'], (a, b) => {
			if (a === 'Parry' && b === 'Push') return punish()
			if (a === 'Push' && b === 'Parry') return gotHit()
			const i = classic4.moves.indexOf(a === 'Parry' ? 'Block' : a)
			const j = classic4.moves.indexOf(b === 'Parry' ? 'Block' : b)
			return classic4.hp[i][j]
		}),
	},
	{
		name: 'no-self-damage',
		moves: ['Strike', 'Parry', 'Heal'],
		note: 'RPS but winner takes 0 (clean hits). Heal 20, hit 18.',
		hp: table(['Strike', 'Parry', 'Heal'], (a, b) => {
			if (a === 'Strike' && b === 'Strike') return none()
			if (a === 'Strike' && b === 'Parry') return { me: -HIT, them: 0 }
			if (a === 'Strike' && b === 'Heal') return { me: 0, them: -HIT }
			if (a === 'Parry' && b === 'Strike') return { me: 0, them: -HIT }
			if (a === 'Parry' && b === 'Parry') return none()
			if (a === 'Parry' && b === 'Heal') return theyHeal()
			if (a === 'Heal' && b === 'Strike') return { me: -HIT, them: 0 }
			if (a === 'Heal' && b === 'Parry') return iHeal()
			return bothHeal()
		}),
	},
	{
		name: 'parry-shield',
		moves: ['Strike', 'Push', 'Parry', 'Heal'],
		note: 'Parry vs Strike is 0/0 (no punish), Push still beats Parry. Strike never loses HP to Parry — Strike likely takes over.',
		hp: table(['Strike', 'Push', 'Parry', 'Heal'], (a, b) => {
			if (a === 'Strike' && b === 'Parry') return none()
			if (a === 'Parry' && b === 'Strike') return none()
			const i = classic4.moves.indexOf(a === 'Parry' ? 'Block' : a)
			const j = classic4.moves.indexOf(b === 'Parry' ? 'Block' : b)
			return classic4.hp[i][j]
		}),
	},
]

export function relativeMatrix(c: Catalog): number[][] {
	return c.hp.map((row) => row.map(rel))
}

export function beatsSummary(c: Catalog): string[] {
	return c.moves.map((a, i) => {
		const wins: string[] = []
		const ties: string[] = []
		const loses: string[] = []
		for (let j = 0; j < c.moves.length; j++) {
			if (i === j) {
				continue
			}
			const r = rel(c.hp[i][j])
			if (r > 2) {
				wins.push(c.moves[j])
			} else if (r < -2) {
				loses.push(c.moves[j])
			} else {
				ties.push(c.moves[j])
			}
		}
		const bits = [
			wins.length ? `beats ${wins.join(', ')}` : '',
			ties.length ? `ties ${ties.join(', ')}` : '',
			loses.length ? `loses to ${loses.join(', ')}` : '',
		].filter(Boolean)
		return `${a}: ${bits.join('; ') || 'does nothing'}`
	})
}

function mixFromRel(c: Catalog) {
	return nash(relativeMatrix(c))
}

export function deadMoves(c: Catalog): string[] {
	const m = relativeMatrix(c)
	const n = c.moves.length
	const out: string[] = []
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			if (i === j) {
				continue
			}
			let weakly = true
			let strictly = false
			for (let k = 0; k < n; k++) {
				if (m[j][k] < m[i][k] - 1e-9) {
					weakly = false
					break
				}
				if (m[j][k] > m[i][k] + 1e-9) {
					strictly = true
				}
			}
			if (weakly && strictly) {
				out.push(`${c.moves[i]} is never better than ${c.moves[j]}`)
			}
		}
	}
	const mix = mixFromRel(c).mix
	for (let i = 0; i < n; i++) {
		if (mix[i] < 0.04) {
			out.push(`${c.moves[i]} almost unused in the even mix (${(mix[i] * 100).toFixed(0)}%)`)
		}
	}
	return out
}

type Rng = () => number

function pick(probs: number[], rng: Rng): number {
	const r = rng() * probs.reduce((a, b) => a + b, 0)
	let acc = 0
	for (let i = 0; i < probs.length; i++) {
		acc += probs[i]
		if (r < acc) {
			return i
		}
	}
	return probs.length - 1
}

function play(
	mixA: number[],
	mixB: number[],
	c: Catalog,
	seed: number,
	hp = 100,
	maxTurns = 20,
): { winner: 'A' | 'B' | 'draw'; ko: boolean; turns: number; usageA: number[] } {
	const rngA = createRng(seed)
	const rngB = createRng(seed ^ 0x51ed)
	let a = hp
	let b = hp
	const usageA = c.moves.map(() => 0)
	let turns = 0
	for (let t = 0; t < maxTurns; t++) {
		turns++
		const i = pick(mixA, rngA)
		const j = pick(mixB, rngB)
		usageA[i]++
		a = Math.min(hp, Math.max(0, a + c.hp[i][j].me))
		b = Math.min(hp, Math.max(0, b + c.hp[i][j].them))
		if (a <= 0 || b <= 0) {
			break
		}
	}
	let winner: 'A' | 'B' | 'draw' = 'draw'
	if (a > b) {
		winner = 'A'
	} else if (b > a) {
		winner = 'B'
	}
	return { winner, ko: a <= 0 || b <= 0, turns, usageA }
}

export function series(
	mixA: number[],
	mixB: number[],
	c: Catalog,
	games = 600,
	seed = 1,
) {
	let wins = 0
	let draws = 0
	let turns = 0
	let kos = 0
	for (let g = 0; g < games; g++) {
		const r = play(mixA, mixB, c, seed + g * 13)
		if (r.winner === 'A') {
			wins++
		} else if (r.winner === 'draw') {
			draws++
		}
		turns += r.turns
		if (r.ko) {
			kos++
		}
	}
	return { fair: (wins + 0.5 * draws) / games, avgTurns: turns / games, koRate: kos / games }
}

export function evenMix(c: Catalog): number[] {
	return mixFromRel(c).mix
}

const catalog = { catalogs, relativeMatrix, beatsSummary, deadMoves, series, evenMix }

export default catalog
export { catalogs }
