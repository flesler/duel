import { describe, expect, it } from 'vitest'
import { BgHeight, BgWidth, GameHeight, GameWidth, SafeOffsetX, SafeOffsetY } from '../config'
import { fightLayout, hudBarX, safeBottomY, safeCenterX } from './fightLayout'

describe('fightLayout', () => {
	it('uses background art dimensions and centers the safe zone', () => {
		const layout = fightLayout()
		expect(layout.bgWidth).toBe(BgWidth)
		expect(layout.bgHeight).toBe(BgHeight)
		expect(layout.safeX).toBe(SafeOffsetX)
		expect(layout.safeY).toBe(SafeOffsetY)
		expect(layout.safeWidth).toBe(GameWidth)
		expect(layout.safeHeight).toBe(GameHeight)
		expect(safeCenterX(layout)).toBe(BgWidth / 2)
	})

	it('anchors HUD and fighters inside the safe zone', () => {
		const layout = fightLayout()
		expect(hudBarX(layout, 1)).toBe(SafeOffsetX + layout.margin)
		expect(hudBarX(layout, 2)).toBe(SafeOffsetX + GameWidth - layout.margin - layout.hudBarWidth)
		expect(safeBottomY(layout, 30)).toBe(SafeOffsetY + GameHeight - 30)
	})
})
