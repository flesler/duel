import { BgWidth, BgHeight, GameWidth, GameHeight, SafeOffsetX, SafeOffsetY, TILE_WIDTH } from '../config'

export type FightLayout = {
	bgWidth: number
	bgHeight: number
	safeX: number
	safeY: number
	safeWidth: number
	safeHeight: number
	tileWidth: number
	margin: number
	hudBarWidth: number
	hudBarHeight: number
}

const MARGIN = 20
const HUD_BAR_W = 250
const HUD_BAR_H = 16

export function fightLayout(): FightLayout {
	return {
		bgWidth: BgWidth,
		bgHeight: BgHeight,
		safeX: SafeOffsetX,
		safeY: SafeOffsetY,
		safeWidth: GameWidth,
		safeHeight: GameHeight,
		tileWidth: TILE_WIDTH,
		margin: MARGIN,
		hudBarWidth: HUD_BAR_W,
		hudBarHeight: HUD_BAR_H,
	}
}

export function safeCenterX(layout: FightLayout): number {
	return layout.safeX + layout.safeWidth / 2
}

export function safeBottomY(layout: FightLayout, inset: number): number {
	return layout.safeY + layout.safeHeight - inset
}

export function hudBarX(layout: FightLayout, player: 1 | 2): number {
	if (player === 1) {
		return layout.safeX + layout.margin
	}
	return layout.safeX + layout.safeWidth - layout.margin - layout.hudBarWidth
}
