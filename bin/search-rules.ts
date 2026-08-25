/**
 * Search Strike / Push / Counter / Heal for a playable duel.
 *
 * Static Nash on relative HP cannot keep all four actions in an open region
 * (Push and Heal both punish Block). Heal is the comeback verb: unused at
 * full HP, mixed in when behind. We score the Strike-Push-Block triangle
 * for match robustness, then check that HP-aware play actually uses Heal
 * and that turtling / all-in Strike don't break it.
 *
 * Run: npx tsx bin/search-rules.ts
 */
import sim, { defaults, type Ruleset } from './sim/engine.ts'

const STRIKES = [14, 16, 18, 20]
const PUSH_DELTA = [0, 2, 4]
const COUNTER_DELTA = [-4, -2, 0, 2]
const HEALS = [14, 16, 18, 20, 22, 24, 26]
const CHIPS = [0, 4]
const MATCH_GAMES = 600

type Candidate = {
	rules: Ruleset;
	mix: number[];
	fairVsPure: number;
	fairAwareVsPure: number;
	awareHeal: number;
	awareVsBlock: number;
	awareVsStrike: number;
	avgTurns: number;
	koRate: number;
	score: number
}

function fair(s: { winsA: number; draws: number; games: number }): number {
	return (s.winsA + 0.5 * s.draws) / s.games
}

function usageHeal(s: { usageA: number[] }): number {
	const t = s.usageA.reduce((a, b) => a + b, 0)
	return t ? s.usageA[3] / t : 0
}

function scoreOf(c: Omit<Candidate, 'score'>): number {
	const triMin = Math.min(c.mix[0], c.mix[1], c.mix[2])
	if (triMin < 0.18) {
		return -50
	}
	const turnFit = c.avgTurns >= 8 && c.avgTurns <= 16 ? 14 : Math.max(0, 14 - Math.abs(c.avgTurns - 12))
	const healUse = c.awareHeal >= 0.05 && c.awareHeal <= 0.22 ? 18 : c.awareHeal * 20
	const vsPures = Math.min(c.fairVsPure, c.fairAwareVsPure)
	const callouts = Math.min(c.awareVsBlock, c.awareVsStrike)
	const identity = c.rules.push >= c.rules.strike ? 4 : 0
	return triMin * 80 + vsPures * 70 + callouts * 40 + healUse + turnFit + c.koRate * 8 + identity - Math.abs(c.rules.heal - c.rules.strike) * 0.3
}

const nashOk: { rules: Ruleset; mix: number[] }[] = []

for (const chip of CHIPS) {
	for (const strike of STRIKES) {
		for (const pd of PUSH_DELTA) {
			const push = strike + pd
			for (const cd of COUNTER_DELTA) {
				const counter = strike + cd
				if (counter - chip <= 0) {
					continue
				}
				for (const heal of HEALS) {
					const rules = defaults({
						name: `S${strike}/P${push}/C${counter}/H${heal}` + (chip ? `/chip${chip}` : ''),
						strike,
						push,
						counter,
						heal,
						chip,
					})
					const matrix = sim.payoffMatrix(rules)
					const hard = sim.dominated(matrix).filter((d) => !d.startsWith('Heal '))
					if (hard.length) {
						continue
					}
					const mix = sim.nash(matrix).mix
					if (Math.min(mix[0], mix[1], mix[2]) < 0.18) {
						continue
					}
					nashOk.push({ rules, mix })
				}
			}
		}
	}
}

nashOk.sort((a, b) => Math.min(b.mix[0], b.mix[1], b.mix[2]) - Math.min(a.mix[0], a.mix[1], a.mix[2]))

const byKey = new Map<string, { rules: Ruleset; mix: number[] }>()
for (const x of nashOk) {
	const r = x.rules
	const key = `${r.strike}/${r.push}/${r.counter}/${r.chip}`
	const err = Math.abs(r.heal - r.strike * 1.1)
	const prev = byKey.get(key)
	if (!prev || err < Math.abs(prev.rules.heal - prev.rules.strike * 1.1)) {
		byKey.set(key, x)
	}
}
const shortlist = [...byKey.values()]

const ranked: Candidate[] = shortlist.map(({ rules, mix }) => {
	const tri = sim.mixed('Tri', mix)
	const aware = sim.hpAware(mix)
	const vsPures = sim.ACTIONS.map((a) => sim.runSeries(tri, sim.pure(a), rules, MATCH_GAMES))
	const awarePures = sim.ACTIONS.map((a) => sim.runSeries(aware, sim.pure(a), rules, MATCH_GAMES, 3))
	const vsSelf = sim.runSeries(aware, sim.hpAware(mix), rules, MATCH_GAMES, 9)
	const vsBlock = awarePures[2]
	const vsStrike = awarePures[0]
	const base = {
		rules,
		mix,
		fairVsPure: Math.min(...vsPures.map(fair)),
		fairAwareVsPure: Math.min(...awarePures.map(fair)),
		awareHeal: usageHeal(vsSelf),
		awareVsBlock: fair(vsBlock),
		awareVsStrike: fair(vsStrike),
		avgTurns: vsSelf.avgTurns,
		koRate: vsSelf.koRate,
	}
	return { ...base, score: scoreOf(base) }
})
ranked.sort((a, b) => b.score - a.score)

console.log('Heal is a comeback (HP-capped), not a round-1 Nash action.')
console.log(`Triangle-viable sets: ${nashOk.length}. Match-tested ${shortlist.length} with HP-aware Heal.\n`)
console.log(
	'rules'.padEnd(26) +
	'triMin'.padStart(7) +
	'HealN'.padStart(7) +
	'vsPure'.padStart(8) +
	'aware'.padStart(8) +
	'Huse'.padStart(7) +
	'vsBlk'.padStart(7) +
	'vsStr'.padStart(7) +
	'turns'.padStart(7) +
	'score'.padStart(8),
)

for (const c of ranked.slice(0, 20)) {
	console.log(
		c.rules.name.padEnd(26) +
		(Math.min(c.mix[0], c.mix[1], c.mix[2]) * 100).toFixed(0).padStart(6) + '%' +
		(c.mix[3] * 100).toFixed(0).padStart(6) + '%' +
		(c.fairVsPure * 100).toFixed(0).padStart(7) + '%' +
		(c.fairAwareVsPure * 100).toFixed(0).padStart(7) + '%' +
		(c.awareHeal * 100).toFixed(0).padStart(6) + '%' +
		(c.awareVsBlock * 100).toFixed(0).padStart(6) + '%' +
		(c.awareVsStrike * 100).toFixed(0).padStart(6) + '%' +
		c.avgTurns.toFixed(1).padStart(7) +
		c.score.toFixed(1).padStart(8),
	)
}

const best = ranked[0]
if (best) {
	console.log('\nRecommended v1:')
	console.log(`  Strike ${best.rules.strike}  Push ${best.rules.push}  Block-counter ${best.rules.counter}  Heal ${best.rules.heal}` + (best.rules.chip ? `  chip ${best.rules.chip}` : '  no chip') + '  no stun')
	console.log(`  Triangle Nash  ${sim.formatMix(best.mix)}`)
	console.log(`  HP-aware Heal usage ${(best.awareHeal * 100).toFixed(1)}%  vs Pure Block ${(best.awareVsBlock * 100).toFixed(1)}%  vs Pure Strike ${(best.awareVsStrike * 100).toFixed(1)}%`)
	console.log(`  Avg turns ${best.avgTurns.toFixed(1)}  KO ${(best.koRate * 100).toFixed(0)}%`)
}
