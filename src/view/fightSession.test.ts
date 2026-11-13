import { describe, expect, it } from 'vitest'
import { funChip4 } from '../engine'
import { BgHeight, BgWidth, GameHeight, GameWidth, SafeOffsetX, SafeOffsetY } from '../config'
import { DEFAULT_TILE_A, DEFAULT_TILE_B, advanceCountdown, applyPick, createFightSession, finishReveal, fightLayout, hudBarX, projectFightView, revealTurn, setFighterTile, safeBottomY, shouldReveal, tileX } from './index'

describe('fightLayout', () => {
	it('uses background art dimensions and centers the safe zone', () => {
		const layout = fightLayout()
		expect(layout.bgWidth).toBe(BgWidth)
		expect(layout.bgHeight).toBe(BgHeight)
		expect(layout.safeX).toBe(SafeOffsetX)
		expect(layout.safeY).toBe(SafeOffsetY)
		expect(layout.safeWidth).toBe(GameWidth)
		expect(layout.safeHeight).toBe(GameHeight)
	})
})

describe('fightSession view', () => {
	const roster = { spriteA: 'fighter', spriteB: 'robot' }

	it('places fighters on default tiles inside the safe zone', () => {
		const layout = fightLayout()
		const view = projectFightView(createFightSession(funChip4, roster), layout)
		expect(view.fighters.A.tile).toBe(DEFAULT_TILE_A)
		expect(view.fighters.B.tile).toBe(DEFAULT_TILE_B)
		expect(view.fighters.A.x).toBe(tileX(DEFAULT_TILE_A, layout))
		expect(view.fighters.B.x).toBe(tileX(DEFAULT_TILE_B, layout))
		expect(view.fighters.A.y).toBe(safeBottomY(layout, 30))
		expect(view.fighters.A.facing).toBe(1)
		expect(view.fighters.B.facing).toBe(-1)
	})

	it('moves fighter x when tile changes', () => {
		const layout = fightLayout()
		let session = createFightSession(funChip4, roster)
		session = setFighterTile(session, 'A', 4)
		const view = projectFightView(session, layout)
		expect(view.fighters.A.x).toBe(tileX(4, layout))
	})

	it('runs pick → reveal → next turn headlessly', () => {
		let session = createFightSession(funChip4, roster)
		session = advanceCountdown(session)
		session = advanceCountdown(session)
		session = advanceCountdown(session)
		session = advanceCountdown(session)
		expect(session.flow).toBe('pick')

		session = applyPick(session, 'A', 'Strike')
		session = applyPick(session, 'B', 'Heal')
		expect(shouldReveal(session)).toBe(true)

		session = revealTurn(session)
		expect(session.match.hpB).toBeLessThan(funChip4.hp)
		expect(session.flow).toBe('reveal')

		session = finishReveal(session)
		expect(session.flow).toBe('pick')
		expect(session.fighters.A.pose).toBe('idle')
	})

	it('aligns HUD bars with layout margins', () => {
		const layout = fightLayout()
		const view = projectFightView(createFightSession(funChip4, roster), layout)
		expect(view.hud.hpBars[0].x).toBe(hudBarX(layout, 1))
		expect(view.hud.hpBars[1].x).toBe(hudBarX(layout, 2))
	})
})
