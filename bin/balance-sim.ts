/**
 * Evaluate named duel rulesets: Nash mix, domination, match series.
 * Run: npx tsx bin/balance-sim.ts
 */
import sim from './sim/engine.ts'
import rulesets from './sim/rulesets.ts'
import type { Ruleset } from './sim/engine.ts'

const GAMES = 900

function pct(n: number): string {
	return `${(n * 100).toFixed(1)}%`
}

function fairWin(s: { winsA: number; draws: number; games: number }): number {
	return (s.winsA + 0.5 * s.draws) / s.games
}

function evaluate(rules: Ruleset) {
	const matrix = sim.payoffMatrix(rules)
	const eq = sim.nash(matrix)
	const dom = sim.dominated(matrix)
	const eqStrat = sim.mixed('Eq', eq.mix)
	const vsPures = sim.ACTIONS.map((action) => {
		const series = sim.runSeries(eqStrat, sim.pure(action), rules, GAMES)
		return { action, win: fairWin(series), raw: series.winsA / series.games, avgTurns: series.avgTurns, koRate: series.koRate }
	})
	const vsSelf = sim.runSeries(eqStrat, sim.mixed('EqB', eq.mix), rules, GAMES, 99)
	const aware = sim.hpAware(eq.mix)
	const vsStyles = [
		{ name: 'Aggressive', series: sim.runSeries(eqStrat, sim.mixed('Aggro', [0.55, 0.25, 0.15, 0.05]), rules, GAMES, 7) },
		{ name: 'Defensive', series: sim.runSeries(eqStrat, sim.mixed('Turtle', [0.2, 0.1, 0.55, 0.15]), rules, GAMES, 11) },
		{ name: 'Heal-heavy', series: sim.runSeries(eqStrat, sim.mixed('Greedy', [0.25, 0.1, 0.25, 0.4]), rules, GAMES, 13) },
		{ name: 'Noisy eq', series: sim.runSeries(eqStrat, sim.noisy(eqStrat, 0.2), rules, GAMES, 17) },
		{ name: 'HP-aware', series: sim.runSeries(eqStrat, aware, rules, GAMES, 19) },
	]
	const awareSelf = sim.runSeries(aware, sim.hpAware(eq.mix), rules, GAMES, 23)
	const awareTotal = awareSelf.usageA.reduce((a, b) => a + b, 0)
	const awareHeal = awareTotal ? awareSelf.usageA[3] / awareTotal : 0
	const worstFair = Math.min(...vsPures.map((v) => v.win))
	const minTri = Math.min(eq.mix[0], eq.mix[1], eq.mix[2])
	const turnScore = vsSelf.avgTurns >= 8 && vsSelf.avgTurns <= 16 ? 1 : Math.max(0, 1 - Math.abs(vsSelf.avgTurns - 12) / 12)
	const score =
		(dom.length ? (dom.every((d) => d.startsWith('Heal ')) ? -4 : -80) : 0) +
		minTri * 80 +
		eq.mix[3] * 12 +
		sim.entropy(eq.mix) * 4 -
		eq.exploitability * 8 +
		worstFair * 50 +
		awareHeal * 40 +
		turnScore * 10

	return { rules, matrix, eq, dom, vsPures, vsSelf, vsStyles, awareSelf, awareHeal, worstFair, score }
}

function printEval(e: ReturnType<typeof evaluate>) {
	const { rules: r } = e
	console.log(`\n======== ${r.name} ========`)
	console.log(`S=${r.strike}  P=${r.push}  Counter=${r.counter}  Heal=${r.heal}  chip=${r.chip}  stun=${r.stun}  bonus=${r.nextHitBonus}  stam=${r.staminaMax}`)
	console.log(`Nash: ${sim.formatMix(e.eq.mix)}`)
	console.log(`value=${e.eq.value.toFixed(3)}  exploit=${e.eq.exploitability.toFixed(3)}  triMin=${pct(Math.min(e.eq.mix[0], e.eq.mix[1], e.eq.mix[2]))}`)
	if (e.dom.length) {
		console.log(`DOMINATED: ${e.dom.join('; ')}`)
	}
	console.log('Payoff (row ΔHP − col ΔHP):')
	console.log(['     ', ...sim.ACTIONS.map((a) => a.padStart(8))].join(''))
	for (let i = 0; i < 4; i++) {
		console.log(sim.ACTIONS[i].padEnd(6) + e.matrix[i].map((v) => String(v).padStart(8)).join(''))
	}
	console.log(
		`Eq vs Eq: A ${pct(fairWin(e.vsSelf))}  draws ${pct(e.vsSelf.draws / e.vsSelf.games)}  turns ${e.vsSelf.avgTurns.toFixed(1)}  KO ${pct(e.vsSelf.koRate)}  dead ${pct(e.vsSelf.deadRoundRate)}`,
	)
	console.log('Eq vs pure (fair): ' + e.vsPures.map((v) => `${v.action} ${pct(v.win)}`).join('  '))
	console.log('Eq vs styles: ' + e.vsStyles.map((v) => `${v.name} ${pct(fairWin(v.series))}`).join('  '))
	console.log(
		`HP-aware vs self: turns ${e.awareSelf.avgTurns.toFixed(1)}  KO ${pct(e.awareSelf.koRate)}  dead ${pct(e.awareSelf.deadRoundRate)}  Heal use ${pct(e.awareHeal)}`,
	)
	console.log(`score ${e.score.toFixed(1)}`)
}

const results = rulesets.candidates.map(evaluate)
results.sort((a, b) => b.score - a.score)

console.log('Duel ruleset comparison')
console.log('Opponents: Nash mix vs one-button; styles are fixed mixes; HP-aware counters last move.')
console.log('Heal often has 0% static Nash — that is expected. Score favors a even Strike/Push/Block triangle, match fairness, and HP-aware Heal usage.\n')
console.log(
	'name'.padEnd(24) +
	'Strike'.padStart(8) +
	'Push'.padStart(8) +
	'Block'.padStart(8) +
	'Heal'.padStart(8) +
	'vsPure'.padStart(8) +
	'Huse'.padStart(7) +
	'turns'.padStart(7) +
	'dead'.padStart(7) +
	'score'.padStart(8),
)
for (const e of results) {
	const m = e.eq.mix
	console.log(
		e.rules.name.padEnd(24) +
		pct(m[0]).padStart(8) +
		pct(m[1]).padStart(8) +
		pct(m[2]).padStart(8) +
		pct(m[3]).padStart(8) +
		pct(e.worstFair).padStart(8) +
		pct(e.awareHeal).padStart(7) +
		e.vsSelf.avgTurns.toFixed(1).padStart(7) +
		pct(e.vsSelf.deadRoundRate).padStart(7) +
		e.score.toFixed(1).padStart(8),
	)
}

console.log(`\nBest named set: ${results[0].rules.name}`)
for (const e of results) {
	printEval(e)
}
