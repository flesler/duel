/**
 * Compare move lists (Parry vs Block, drop Push, Back vs Parry, …).
 * Run: npx tsx bin/search-catalog.ts
 */
import { catalogs, beatsSummary, deadMoves, evenMix, series } from './sim/catalog.ts'
import { nash } from './sim/engine.ts'
import { relativeMatrix } from './sim/catalog.ts'

const GAMES = 500

function pct(n: number): string {
	return `${(n * 100).toFixed(0)}%`
}

function fmtMix(moves: string[], mix: number[]): string {
	return moves.map((m, i) => `${m} ${pct(mix[i])}`).join('  ')
}

console.log('Each catalog is a different set of moves. Dead move = never the right answer.\n')

for (const c of catalogs) {
	const mix = evenMix(c)
	const eq = nash(relativeMatrix(c))
	const dead = deadMoves(c)
	const vsPures = c.moves.map((_, j) => {
		const pure = c.moves.map((__, k) => (k === j ? 1 : 0))
		return series(mix, pure, c, GAMES, 2 + j)
	})
	const vsSelf = series(mix, mix, c, GAMES, 99)
	const worstPure = Math.min(...vsPures.map((s) => s.fair))
	console.log(`=== ${c.name} ===`)
	console.log(c.note)
	for (const line of beatsSummary(c)) {
		console.log('  ' + line)
	}
	console.log('  even mix:', fmtMix(c.moves, mix), eq.exploitability > 0.05 ? `(uneven ${eq.exploitability.toFixed(2)})` : '')
	console.log(
		'  vs self', pct(vsSelf.fair),
		'turns', vsSelf.avgTurns.toFixed(1),
		'KO', pct(vsSelf.koRate),
		'vs one-button', vsPures.map((s, i) => `${c.moves[i]} ${pct(s.fair)}`).join(', '),
	)
	if (dead.length) {
		console.log('  PROBLEMS:', dead.join('; '))
	} else if (worstPure < 0.45) {
		console.log('  PROBLEM: even mix loses to a one-button player (' + pct(worstPure) + ')')
	} else {
		console.log('  OK: every move wins and loses something; mix holds vs one-button.')
	}
	console.log()
}
