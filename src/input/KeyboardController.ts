import { Char, State, CharStates } from '../entities/Char'
import * as config from '../config'
import game from '../game'
import Controller from './Controller'

const { KeyCode } = Phaser

export default class KeyboardController implements Controller {
	private keys: any

	public static createPlayer1(): KeyboardController {
		return new KeyboardController(KeyCode.A, KeyCode.D, KeyCode.W, KeyCode.S, KeyCode.SPACEBAR)
	}

	public static createPlayer2(): KeyboardController {
		return new KeyboardController(KeyCode.RIGHT, KeyCode.LEFT, KeyCode.UP, KeyCode.DOWN, KeyCode.ENTER)
	}

	constructor(back: number, charge: number, block: number, heal: number, attack: number) {
		this.keys = game.input.keyboard.addKeys({ back, charge, block, heal, attack })
	}

	public decide(player: Char, enemy: Char): State {
		for (const action of Object.keys(CharStates)) {
			if (this.keys[action] && this.keys[action].isDown) {
				return CharStates[action]
			}
		}
		const { input: { keyboard } } = game
		const { animations } = player
		const { KeyCode } = Phaser

		if (keyboard.isDown(KeyCode.ONE)) {
			return CharStates.heal
		}
		if (keyboard.isDown(KeyCode.TWO)) {
			return CharStates.attack
		}
		if (keyboard.isDown(KeyCode.THREE)) {
			return CharStates.win
		}
		if (keyboard.isDown(KeyCode.FOUR)) {
			return CharStates.hit
		}
		if (keyboard.isDown(KeyCode.FIVE)) {
			return CharStates.dead
		}
		if (!animations.paused) {
			return CharStates.idle
		}
		return player.state
	}
}
