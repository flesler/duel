import { describe, expect, it } from 'vitest'
import { customFonts } from './boot/fonts'

describe('boot/fonts', () => {
	it('should ignore placeholder Empty custom font class', () => {
		expect(customFonts()).toEqual([])
	})
})
