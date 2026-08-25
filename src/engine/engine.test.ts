import { describe, expect, it } from 'vitest'
import { toModule, type TestCase } from 'src/util/tests'
import { IDX, resolve, type Outcome, type Ruleset } from './engine'
import { funChip4 } from './rulesets'

type ResolveInput = { a: number; b: number; rules: Ruleset }

describe(toModule(__filename), () => {
	describe('resolve', () => {
		const cases: TestCase<ResolveInput, Outcome>[] = [
			{
				desc: 'Strike beats Heal',
				input: { a: IDX.Strike, b: IDX.Heal, rules: funChip4 },
				expected: { dA: -4, dB: -18, stunA: false, stunB: false, hitA: true, hitB: false },
			},
			{
				desc: 'Block counters Strike',
				input: { a: IDX.Strike, b: IDX.Block, rules: funChip4 },
				expected: { dA: -18, dB: -4, stunA: false, stunB: false, hitA: false, hitB: true },
			},
			{
				desc: 'same Strike is a neutral clash',
				input: { a: IDX.Strike, b: IDX.Strike, rules: funChip4 },
				expected: { dA: 0, dB: 0, stunA: false, stunB: false, hitA: false, hitB: false },
			},
		]

		cases.forEach(({ desc, input, expected }) => {
			it(`should handle ${desc}`, () => {
				expect(resolve(input.a, input.b, input.rules)).toEqual(expected)
			})
		})
	})
})
