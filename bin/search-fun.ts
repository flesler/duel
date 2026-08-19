/**
 * Feel-knob search on the even triangle. Fun = scrappy, readable, not stam/stun.
 * Run: npx tsx bin/search-fun.ts
 */
import sim, { defaults, type Ruleset } from './sim/engine.ts'

const MATCH_GAMES = 500

type Row = {
	rules: Ruleset
	mix: number[]
	fairVsPure: number
	awareHeal: number
	avgTurns: number
	koRate: number
	vsAggro: number
	vsTurtle: number
	knobs: number
	score: number
}

function fair(s: { winsA: number; draws: number; games: number }): number {
	return (s.winsA + 0.5 * s.draws) / s.games
}

function healUse(s: { usageA: number[] }): number {
	const t = s.usageA.reduce((a, b) => a + b, 0)
	return t ? s.usageA[3] / t : 0
}

function knobsOf(r: Ruleset): number {
	return (r.chip ? 1 : 0) + (r.clashChip ? 1 : 0) + (r.nextHitBonus ? 1 : 0) + (r.push !== r.strike ? 1 : 0) + (r.counter !== r.strike ? 1 : 0)
}

function scoreOf(c: Omit<Row, 'score'>): number {
	const triMin = Math.min(c.mix[0], c.mix[1], c.mix[2])
	if (triMin < 0.22 || c.fairVsPure < 0.46) {
		return -20
	}
	const turns = c.avgTurns >= 10 && c.avgTurns <= 15 ? 16 : Math.max(0, 16 - Math.abs(c.avgTurns - 12.5) * 3)
	const heal = c.awareHeal >= 0.07 && c.awareHeal <= 0.16 ? 14 : Math.max(0, 10 - Math.abs(c.awareHeal - 0.1) * 40)
	const ko = c.koRate >= 0.75 && c.koRate <= 0.95 ? 12 : c.koRate * 8
	const styles = Math.min(c.vsAggro, c.vsTurtle)
	const complexity = c.knobs <= 2 ? 10 : c.knobs === 3 ? 2 : -8
	const identity = c.rules.push > c.rules.strike ? 3 : 0
	const scrappy = (c.rules.chip ? 4 : 0) + (c.rules.clashChip ? 3 : 0) + (c.rules.nextHitBonus ? 3 : 0)
	return triMin * 50 + c.fairVsPure * 55 + styles * 35 + turns + heal + ko + complexity + identity + scrappy
}

const packs: Partial<Ruleset>[] = []
for (const strike of [16, 18]) {
	for (const pushExtra of [0, 2]) {
		for (const heal of [18, 20, 22]) {
			for (const chip of [0, 3, 4]) {
				for (const clash of [0, 2, 4]) {
					for (const bonus of [0, 4, 6]) {
						const push = strike + pushExtra
						const counter = strike
						if (heal <= push) {
							continue
						}
						packs.push({ strike, push, counter, heal, chip, clashChip: clash, nextHitBonus: bonus })
					}
				}
			}
		}
	}
}

const viable: { rules: Ruleset; mix: number[] }[] = []
for (const p of packs) {
	const rules = defaults({
		name: `S${p.strike} P${p.push} H${p.heal}` +
			(p.chip ? ` chip${p.chip}` : '') +
			(p.clashChip ? ` clash${p.clashChip}` : '') +
			(p.nextHitBonus ? ` bonus${p.nextHitBonus}` : ''),
		...p,
	} as Partial<Ruleset> & { name: string })
	const matrix = sim.payoffMatrix(rules)
	if (sim.dominated(matrix).some((d) => !d.startsWith('Heal '))) {
		continue
	}
	if (sim.dominated(matrix).some((d) => d.startsWith('Heal '))) {
		continue
	}
	const mix = sim.nash(matrix).mix
	if (Math.min(mix[0], mix[1], mix[2]) < 0.22) {
		continue
	}
	viable.push({ rules, mix })
}

const ranked: Row[] = viable.map(({ rules, mix }) => {
	const tri = sim.mixed('Tri', mix)
	const aware = sim.hpAware(mix)
	const vsPures = sim.ACTIONS.map((a) => sim.runSeries(tri, sim.pure(a), rules, MATCH_GAMES))
	const vsSelf = sim.runSeries(aware, sim.hpAware(mix), rules, MATCH_GAMES, 9)
	const vsAggro = sim.runSeries(tri, sim.mixed('Aggro', [0.55, 0.25, 0.15, 0.05]), rules, MATCH_GAMES, 11)
	const vsTurtle = sim.runSeries(tri, sim.mixed('Turtle', [0.2, 0.1, 0.55, 0.15]), rules, MATCH_GAMES, 13)
	const base = {
		rules,
		mix,
		fairVsPure: Math.min(...vsPures.map(fair)),
		awareHeal: healUse(vsSelf),
		avgTurns: vsSelf.avgTurns,
		koRate: vsSelf.koRate,
		vsAggro: fair(vsAggro),
		vsTurtle: fair(vsTurtle),
		knobs: knobsOf(rules),
	}
	return { ...base, score: scoreOf(base) }
})
ranked.sort((a, b) => b.score - a.score)

console.log(`Feel packs tried: ${packs.length}. Heal-not-dominated + even triangle: ${viable.length}.\n`)
console.log(
	'rules'.padEnd(34) +
	'k'.padStart(3) +
	'vsP'.padStart(6) +
	'agg'.padStart(6) +
	'ttl'.padStart(6) +
	'Huse'.padStart(6) +
	'turns'.padStart(7) +
	'KO'.padStart(5) +
	'score'.padStart(8),
)
for (const c of ranked.slice(0, 22)) {
	console.log(
		c.rules.name.padEnd(34) +
		String(c.knobs).padStart(3) +
		(c.fairVsPure * 100).toFixed(0).padStart(5) + '%' +
		(c.vsAggro * 100).toFixed(0).padStart(5) + '%' +
		(c.vsTurtle * 100).toFixed(0).padStart(5) + '%' +
		(c.awareHeal * 100).toFixed(0).padStart(5) + '%' +
		c.avgTurns.toFixed(1).padStart(7) +
		(c.koRate * 100).toFixed(0).padStart(4) + '%' +
		c.score.toFixed(1).padStart(8),
	)
}

const best = ranked[0]
const simple = ranked.filter((c) => c.knobs <= 2)[0]
if (best) {
	console.log('\nHighest fun score:', best.rules.name, `(${best.knobs} extra knobs)`)
	console.log(`  S${best.rules.strike} P${best.rules.push} C${best.rules.counter} H${best.rules.heal} chip=${best.rules.chip} clash=${best.rules.clashChip} bonus=${best.rules.nextHitBonus}`)
}
if (simple && simple !== best) {
	console.log('Best with ≤2 extra knobs:', simple.rules.name)
	console.log(`  S${simple.rules.strike} P${simple.rules.push} C${simple.rules.counter} H${simple.rules.heal} chip=${simple.rules.chip} clash=${simple.rules.clashChip} bonus=${simple.rules.nextHitBonus}`)
}
