import { TILES } from '../config'
import { DISPLAY, beginNextTurn, bothPicked, createMatch, resolveTurn, submitPick, type Action, type DuelMatch, type Ruleset } from '../engine'
import { type FightLayout, fightLayout, hudBarX, safeBottomY, tileX } from './layout'
import { type CharPose, posesAfterReveal } from './poses'

export type FightFlow = 'countdown' | 'pick' | 'reveal' | 'over'
export type FighterSide = 'A' | 'B'
export type CountdownStep = 3 | 2 | 1 | 'fight' | 'done'

export type FighterView = {
	side: FighterSide;
	sprite: string;
	tile: number;
	x: number;
	y: number;
	facing: 1 | -1;
	pose: CharPose;
	hp: number;
	maxHp: number
}

export type HudBarView = {
	side: FighterSide;
	x: number;
	y: number;
	w: number;
	h: number;
	ratio: number
}

export type FightHudView = {
	banner: { text: string; visible: boolean };
	turnLabel: string;
	pickA: string;
	pickB: string;
	hpBars: HudBarView[]
}

export type FightView = {
	flow: FightFlow;
	fighters: { A: FighterView; B: FighterView };
	hud: FightHudView
}

export type FightSession = {
	match: DuelMatch;
	flow: FightFlow;
	countdown: CountdownStep;
	fighters: { A: Omit<FighterView, 'x' | 'y' | 'facing'>; B: Omit<FighterView, 'x' | 'y' | 'facing'> }
}

export const DEFAULT_TILE_A = 2
export const DEFAULT_TILE_B = TILES - 3
const FLOOR_INSET = 30

export function createFightSession(
	rules: Ruleset,
	roster: { spriteA: string; spriteB: string; tileA?: number; tileB?: number },
): FightSession {
	const match = createMatch(rules)
	return {
		match,
		flow: 'countdown',
		countdown: 3,
		fighters: {
			A: fighterBase('A', roster.spriteA, roster.tileA ?? DEFAULT_TILE_A, match.rules.hp),
			B: fighterBase('B', roster.spriteB, roster.tileB ?? DEFAULT_TILE_B, match.rules.hp),
		},
	}
}

function fighterBase(side: FighterSide, sprite: string, tile: number, maxHp: number) {
	return { side, sprite, tile, pose: 'idle' as CharPose, hp: maxHp, maxHp }
}

export function advanceCountdown(session: FightSession): FightSession {
	if (session.flow !== 'countdown') {
		return session
	}
	switch (session.countdown) {
		case 3:
			return { ...session, countdown: 2 }
		case 2:
			return { ...session, countdown: 1 }
		case 1:
			return { ...session, countdown: 'fight' }
		case 'fight':
			return { ...session, countdown: 'done', flow: 'pick' }
		default:
			return session
	}
}

export function applyPick(session: FightSession, player: FighterSide, action: Action): FightSession {
	if (session.flow !== 'pick') {
		return session
	}
	return { ...session, match: submitPick(session.match, player, action) }
}

export function shouldReveal(session: FightSession): boolean {
	return session.flow === 'pick' && bothPicked(session.match)
}

export function revealTurn(session: FightSession): FightSession {
	if (session.flow !== 'pick' || !bothPicked(session.match)) {
		return session
	}
	const match = resolveTurn(session.match)
	const poses = match.lastPicks && match.lastOutcome
		? posesAfterReveal(match.lastPicks, match.lastOutcome)
		: null
	const fighters = {
		A: {
			...session.fighters.A,
			hp: match.hpA,
			pose: poses?.A ?? session.fighters.A.pose,
		},
		B: {
			...session.fighters.B,
			hp: match.hpB,
			pose: poses?.B ?? session.fighters.B.pose,
		},
	}
	return {
		...session,
		match,
		fighters,
		flow: match.winner ? 'over' : 'reveal',
	}
}

export function finishReveal(session: FightSession): FightSession {
	if (session.flow === 'over' && session.match.winner && session.match.winner !== 'draw') {
		const w = session.match.winner
		if (session.fighters[w].pose === 'win') {
			return session
		}
		return {
			...session,
			fighters: {
				...session.fighters,
				[w]: { ...session.fighters[w], pose: 'win' },
			},
		}
	}
	if (session.flow !== 'reveal') {
		return session
	}
	const match = beginNextTurn(session.match)
	return {
		...session,
		match,
		flow: 'pick',
		fighters: {
			A: { ...session.fighters.A, pose: 'idle', hp: match.hpA },
			B: { ...session.fighters.B, pose: 'idle', hp: match.hpB },
		},
	}
}

export function setFighterTile(session: FightSession, side: FighterSide, tile: number): FightSession {
	const clamped = Math.max(0, Math.min(TILES - 1, tile))
	if (side === 'A') {
		return { ...session, fighters: { ...session.fighters, A: { ...session.fighters.A, tile: clamped } } }
	}
	return { ...session, fighters: { ...session.fighters, B: { ...session.fighters.B, tile: clamped } } }
}

function facingFor(myX: number, otherX: number): 1 | -1 {
	return myX < otherX ? 1 : -1
}

function projectFighter(
	base: FightSession['fighters']['A'],
	layout: FightLayout,
	otherX: number,
): FighterView {
	const x = tileX(base.tile, layout)
	const y = safeBottomY(layout, FLOOR_INSET)
	return {
		...base,
		x,
		y,
		facing: facingFor(x, otherX),
	}
}

function deriveBanner(session: FightSession): { text: string; visible: boolean } {
	if (session.flow === 'countdown') {
		if (session.countdown === 'fight') {
			return { text: 'FIGHT!', visible: true }
		}
		if (session.countdown !== 'done') {
			return { text: String(session.countdown), visible: true }
		}
	}
	const { match } = session
	if (session.flow === 'pick') {
		if (match.pickA && !match.pickB) {
			return { text: 'Waiting for P2…', visible: true }
		}
		if (!match.pickA && match.pickB) {
			return { text: 'Waiting for P1…', visible: true }
		}
	}
	if (session.flow === 'over' && match.winner) {
		const name = match.winner === 'A' ? 'Player 1' : match.winner === 'B' ? 'Player 2' : null
		if (!name) {
			return { text: "Time! It's a draw. Press R to rematch", visible: true }
		}
		const ko = match.hpA <= 0 || match.hpB <= 0
		return {
			text: ko ? `${name} wins! Press R to rematch` : `Time! ${name} wins on health. Press R to rematch`,
			visible: true,
		}
	}
	if (session.flow === 'over') {
		return { text: "Time! It's a draw. Press R to rematch", visible: true }
	}
	return { text: '', visible: false }
}

function derivePickLabels(session: FightSession): { pickA: string; pickB: string } {
	const { match, flow } = session
	if (flow === 'reveal' && match.lastPicks) {
		return {
			pickA: `P1: ${DISPLAY[match.lastPicks.a]}`,
			pickB: `P2: ${DISPLAY[match.lastPicks.b]}`,
		}
	}
	if (flow === 'pick') {
		return {
			pickA: match.pickA ? `P1: ${DISPLAY[match.pickA]} ✓` : 'P1: pick…',
			pickB: match.pickB ? `P2: ${DISPLAY[match.pickB]} ✓` : 'P2: pick…',
		}
	}
	return { pickA: '', pickB: '' }
}

export function projectFightView(session: FightSession, layout: FightLayout = fightLayout()): FightView {
	const aBase = { ...session.fighters.A, hp: session.match.hpA, maxHp: session.match.rules.hp }
	const bBase = { ...session.fighters.B, hp: session.match.hpB, maxHp: session.match.rules.hp }
	const bProjected = projectFighter(bBase, layout, tileX(aBase.tile, layout))
	const aProjected = projectFighter(aBase, layout, bProjected.x)
	const { pickA, pickB } = derivePickLabels(session)
	const { safeY, margin, hudBarWidth, hudBarHeight } = layout
	return {
		flow: session.flow,
		fighters: { A: aProjected, B: bProjected },
		hud: {
			banner: deriveBanner(session),
			turnLabel: `Turn ${session.match.turn} / ${session.match.rules.maxTurns}`,
			pickA,
			pickB,
			hpBars: [
				{
					side: 'A',
					x: hudBarX(layout, 1),
					y: safeY + margin,
					w: hudBarWidth,
					h: hudBarHeight,
					ratio: Math.max(0, aProjected.hp / aProjected.maxHp),
				},
				{
					side: 'B',
					x: hudBarX(layout, 2),
					y: safeY + margin,
					w: hudBarWidth,
					h: hudBarHeight,
					ratio: Math.max(0, bProjected.hp / bProjected.maxHp),
				},
			],
		},
	}
}

export function outcomeFxKind(session: FightSession): 'hit' | 'power' | 'block' | null {
	const o = session.match.lastOutcome
	if (!o) {
		return null
	}
	if (o.hitA || o.hitB) {
		return 'hit'
	}
	if (o.dA > 0 || o.dB > 0) {
		return 'power'
	}
	return 'block'
}
