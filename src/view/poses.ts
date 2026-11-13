import type { Action, Outcome } from '../engine'

export type CharPose =
	| 'idle'
	| 'back'
	| 'charge'
	| 'attack'
	| 'dead'
	| 'heal'
	| 'block'
	| 'hit'
	| 'win'
	| 'power'

export function poseForAction(action: Action): CharPose {
	switch (action) {
		case 'Strike':
			return 'attack'
		case 'Push':
			return 'charge'
		case 'Block':
			return 'block'
		case 'Heal':
			return 'heal'
	}
}

export function posesAfterReveal(
	picks: { a: Action; b: Action },
	outcome: Outcome,
): { A: CharPose; B: CharPose } {
	let A = poseForAction(picks.a)
	let B = poseForAction(picks.b)
	if (outcome.hitB) {
		B = 'hit'
	}
	if (outcome.hitA) {
		A = 'hit'
	}
	return { A, B }
}
