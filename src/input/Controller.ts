import type { Action } from '../engine/engine'

export default interface TurnController {
	pollPick(): Action | null
}
