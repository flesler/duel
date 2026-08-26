import { matchTestCases, runTestCases, toModule } from 'src/test/utils.test'
import { describe, expect, it } from 'vitest'
import { defaults } from './engine'
import { beginNextTurn, bothPicked, createMatch, resolveTurn, submitPick, type DuelMatch } from './match'
import { funChip4 } from './rulesets'

const fragile = defaults({
	name: 'fragile',
	strike: 50,
	push: 50,
	counter: 50,
	heal: 10,
	chip: 0,
	maxTurns: 5,
	hp: 50,
})

function picked(match: DuelMatch, a: DuelMatch['pickA'], b: DuelMatch['pickB']): DuelMatch {
	return { ...match, pickA: a, pickB: b }
}

describe(toModule(__filename), () => {
	matchTestCases(createMatch, [
		{
			desc: 'initial state from ruleset',
			input: funChip4,
			expected: { hpA: 100, hpB: 100, turn: 1, phase: 'pick', winner: null, pickA: null, pickB: null },
		},
	])

	runTestCases(bothPicked, [
		{ desc: 'false with no picks', input: createMatch(funChip4), expected: false },
		{ desc: 'false with one pick', input: submitPick(createMatch(funChip4), 'A', 'Strike'), expected: false },
		{ desc: 'true with both picks', input: picked(createMatch(funChip4), 'Strike', 'Heal'), expected: true },
	])

	matchTestCases(resolveTurn, [
		{
			desc: 'Strike vs Heal on fun-chip4',
			input: picked(createMatch(funChip4), 'Strike', 'Heal'),
			expected: { hpA: 96, hpB: 82, phase: 'reveal', winner: null, lastPicks: { a: 'Strike', b: 'Heal' } },
		},
		{
			desc: 'KO ends match',
			input: picked(createMatch(fragile), 'Strike', 'Heal'),
			expected: { hpB: 0, winner: 'A', phase: 'over' },
		},
		{
			desc: 'turn cap picks higher HP',
			input: picked({ ...createMatch(funChip4), turn: 20, hpA: 90, hpB: 80 }, 'Heal', 'Heal'),
			expected: { hpA: 100, hpB: 100, winner: 'draw', phase: 'over' },
		},
	])

	matchTestCases(submitPick, [
		{
			desc: 'records player A pick',
			input: [createMatch(funChip4), 'A', 'Push'],
			expected: { pickA: 'Push', pickB: null },
		},
		{
			desc: 'records player B pick',
			input: [createMatch(funChip4), 'B', 'Block'],
			expected: { pickA: null, pickB: 'Block' },
		},
	])

	it('should ignore picks outside pick phase', () => {
		const after = resolveTurn(picked(createMatch(funChip4), 'Strike', 'Strike'))
		expect(submitPick(after, 'A', 'Heal')).toEqual(after)
	})

	matchTestCases(beginNextTurn, [
		{
			desc: 'starts next turn after reveal',
			input: resolveTurn(picked(createMatch(funChip4), 'Strike', 'Strike')),
			expected: { turn: 2, phase: 'pick', lastOutcome: null, lastPicks: null },
		},
	])

	it('should not advance when match is over', () => {
		const over = resolveTurn(picked(createMatch(fragile), 'Strike', 'Heal'))
		expect(beginNextTurn(over)).toEqual(over)
	})
})
