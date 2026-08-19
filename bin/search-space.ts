/**
 * Try movement packs: Back / Forward plus optional Strike/Push lunge.
 * Run: npx tsx bin/search-space.ts
 */
import space, { type SpaceRules } from './sim/space.ts'

const GAMES = 400

function pct(n: number): string {
	return `${(n * 100).toFixed(0)}%`
}

function usageMove(u: number[]): string {
	const t = u.reduce((a, b) => a + b, 0)
	if (!t) {
		return '-'
	}
	return `Bk ${(u[4] / t * 100).toFixed(0)} Fw ${(u[5] / t * 100).toFixed(0)}`
}

function evalPack(rules: SpaceRules) {
	const d = space.duelist(rules)
	const vsSelf = space.runSpace(d, space.duelist(rules), rules, GAMES, 1)
	const vsRunner = space.runSpace(d, space.runner(), rules, GAMES, 3)
	const vsSnipe = space.runSpace(d, space.snipeHeal(rules), rules, GAMES, 5)
	const vsTurtle = space.runSpace(d, space.turtleFar(rules), rules, GAMES, 7)
	const vsRush = space.runSpace(d, space.rushdown(rules), rules, GAMES, 9)
	const vsStrike = space.runSpace(d, space.spacePure('Strike'), rules, GAMES, 11)
	const vsPush = space.runSpace(d, space.spacePure('Push'), rules, GAMES, 13)
	const vsBlock = space.runSpace(d, space.spacePure('Block'), rules, GAMES, 15)
	const vsFwd = space.runSpace(d, space.spacePure('Forward'), rules, GAMES, 17)
	const worstLoop = Math.min(vsRunner.fairA, vsSnipe.fairA, vsTurtle.fairA)
	const fairMelee = Math.min(vsStrike.fairA, vsPush.fairA, vsBlock.fairA)
	const even = 1 - Math.abs(vsSelf.fairA - 0.5) * 2
	const move = (vsSelf.usageA[4] + vsSelf.usageA[5]) / (vsSelf.usageA.reduce((a, b) => a + b, 0) || 1)
	const score =
		(vsSelf.koRate < 0.35 ? -30 : vsSelf.koRate * 12) +
		(vsSelf.avgTurns >= 8 && vsSelf.avgTurns <= 16 ? 10 : 0) +
		worstLoop * 40 +
		fairMelee * 25 +
		even * 15 +
		(move >= 0.04 && move <= 0.45 ? 8 : move * 5) +
		vsRush.fairA * 10

	return { rules, vsSelf, vsRunner, vsSnipe, vsTurtle, vsRush, vsStrike, vsPush, vsBlock, vsFwd, worstLoop, score }
}

const rows = space.spacePacks.map(evalPack)
rows.sort((a, b) => b.score - a.score)

console.log('Movement packs. Duelist should beat Runner / snipe-heal / turtle-far (no free escape).')
console.log('close[] = Strike, Push, Block, Heal, Back, Forward (positive = closer).\n')
console.log(
	'pack'.padEnd(26) +
	'self'.padStart(6) +
	'KO'.padStart(5) +
	'trn'.padStart(6) +
	'dst'.padStart(5) +
	'run'.padStart(6) +
	'snp'.padStart(6) +
	'tur'.padStart(6) +
	'rsh'.padStart(6) +
	'S/P/B'.padStart(10) +
	'move'.padStart(14) +
	'score'.padStart(7),
)

for (const r of rows) {
	console.log(
		r.rules.name.padEnd(26) +
		pct(r.vsSelf.fairA).padStart(6) +
		pct(r.vsSelf.koRate).padStart(5) +
		r.vsSelf.avgTurns.toFixed(1).padStart(6) +
		r.vsSelf.avgDist.toFixed(1).padStart(5) +
		pct(r.vsRunner.fairA).padStart(6) +
		pct(r.vsSnipe.fairA).padStart(6) +
		pct(r.vsTurtle.fairA).padStart(6) +
		pct(r.vsRush.fairA).padStart(6) +
		`${pct(r.vsStrike.fairA)}/${pct(r.vsPush.fairA)}/${pct(r.vsBlock.fairA)}`.padStart(10) +
		usageMove(r.vsSelf.usageA).padStart(14) +
		r.score.toFixed(0).padStart(7),
	)
}

const best = rows[0]
console.log('\nBest vs run-away loops:', best.rules.name)
console.log('  close', best.rules.close.join(','), 'Srange', best.rules.strikeRange, 'Prange', best.rules.pushRange, 'max', best.rules.maxDist, 'ram', best.rules.ram, 'healMax', best.rules.healMaxDist)
console.log('  Columns run/snp/tur = Duelist fair win vs Runner / Snipe-heal / Turtle-far (want high).')
