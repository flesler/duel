import { resolve, IDX, type Action, type Outcome, type Ruleset } from './engine'

export type MatchPhase = 'pick' | 'reveal' | 'over'

export type DuelMatch = {
	rules: Ruleset;
	hpA: number;
	hpB: number;
	turn: number;
	pickA: Action | null;
	pickB: Action | null;
	phase: MatchPhase;
	winner: 'A' | 'B' | 'draw' | null;
	lastOutcome: Outcome | null;
	lastPicks: { a: Action; b: Action } | null
}

export function createMatch(rules: Ruleset): DuelMatch {
	return {
		rules,
		hpA: rules.hp,
		hpB: rules.hp,
		turn: 1,
		pickA: null,
		pickB: null,
		phase: 'pick',
		winner: null,
		lastOutcome: null,
		lastPicks: null,
	}
}

export function submitPick(match: DuelMatch, player: 'A' | 'B', action: Action): DuelMatch {
	if (match.phase !== 'pick' || match.winner) {
		return match
	}
	if (player === 'A') {
		return { ...match, pickA: action }
	}
	return { ...match, pickB: action }
}

export function bothPicked(match: DuelMatch): boolean {
	return match.pickA !== null && match.pickB !== null
}

function clampHp(hp: number, maxHp: number): number {
	return Math.min(maxHp, Math.max(0, hp))
}

function winnerAfterHp(hpA: number, hpB: number): DuelMatch['winner'] {
	if (hpA <= 0 && hpB <= 0) {
		return 'draw'
	}
	if (hpA <= 0) {
		return 'B'
	}
	if (hpB <= 0) {
		return 'A'
	}
	return null
}

function winnerOnTimeout(hpA: number, hpB: number): DuelMatch['winner'] {
	if (hpA > hpB) {
		return 'A'
	}
	if (hpB > hpA) {
		return 'B'
	}
	return 'draw'
}

export function resolveTurn(match: DuelMatch): DuelMatch {
	if (!bothPicked(match)) {
		return match
	}
	const a = IDX[match.pickA!]
	const b = IDX[match.pickB!]
	const outcome = resolve(a, b, match.rules)
	const hpA = clampHp(match.hpA + outcome.dA, match.rules.hp)
	const hpB = clampHp(match.hpB + outcome.dB, match.rules.hp)
	const lastPicks = { a: match.pickA!, b: match.pickB! }
	let winner = winnerAfterHp(hpA, hpB)
	let phase: MatchPhase = 'reveal'
	if (!winner && match.turn >= match.rules.maxTurns) {
		winner = winnerOnTimeout(hpA, hpB)
		phase = 'over'
	}
	return {
		...match,
		hpA,
		hpB,
		pickA: null,
		pickB: null,
		lastOutcome: outcome,
		lastPicks,
		winner,
		phase: winner ? 'over' : phase,
	}
}

export function beginNextTurn(match: DuelMatch): DuelMatch {
	if (match.phase !== 'reveal' || match.winner) {
		return match
	}
	return {
		...match,
		turn: match.turn + 1,
		phase: 'pick',
		lastOutcome: null,
		lastPicks: null,
	}
}

export const DISPLAY: Record<Action, string> = {
	Strike: 'Strike',
	Push: 'Push',
	Block: 'Parry',
	Heal: 'Heal',
}
