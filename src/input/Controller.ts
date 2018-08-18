import { Char, State } from '../entities/Char'

export default interface Controller {
	decide(player: Char, enemy: Char): State
}
