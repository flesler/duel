import { runTestCases, toModule } from 'src/test/utils.test'
import { describe } from 'vitest'
import { IDX, resolve } from './engine'
import { funChip4 } from './rulesets'

describe(toModule(__filename), () => {
	describe('resolve', () => {
		runTestCases(resolve, [
			{
				desc: 'Strike beats Heal',
				input: [IDX.Strike, IDX.Heal, funChip4],
				expected: { dA: -4, dB: -18, stunA: false, stunB: false, hitA: true, hitB: false },
			},
			{
				desc: 'Block counters Strike',
				input: [IDX.Strike, IDX.Block, funChip4],
				expected: { dA: -18, dB: -4, stunA: false, stunB: false, hitA: false, hitB: true },
			},
			{
				desc: 'same Strike is a neutral clash',
				input: [IDX.Strike, IDX.Strike, funChip4],
				expected: { dA: 0, dB: 0, stunA: false, stunB: false, hitA: false, hitB: false },
			},
		])
	})
})
