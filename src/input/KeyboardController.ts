import Phaser from 'phaser'
import type { Action } from '../engine/engine'
import TurnController from './Controller'

const { KeyCodes } = Phaser.Input.Keyboard

const P1: Record<string, Action> = {
	strike: 'Strike',
	push: 'Push',
	parry: 'Block',
	heal: 'Heal',
}

const P2: Record<string, Action> = {
	strike: 'Strike',
	push: 'Push',
	parry: 'Block',
	heal: 'Heal',
}

export default class KeyboardController implements TurnController {
	private keys: Record<string, Phaser.Input.Keyboard.Key>

	public static createPlayer1(scene: Phaser.Scene): KeyboardController {
		return new KeyboardController(scene, {
			strike: KeyCodes.SPACE,
			push: KeyCodes.D,
			parry: KeyCodes.W,
			heal: KeyCodes.S,
		}, P1)
	}

	public static createPlayer2(scene: Phaser.Scene): KeyboardController {
		return new KeyboardController(scene, {
			strike: KeyCodes.ENTER,
			push: KeyCodes.RIGHT,
			parry: KeyCodes.UP,
			heal: KeyCodes.DOWN,
		}, P2)
	}

	constructor(
		scene: Phaser.Scene,
		bindings: Record<string, number>,
		private readonly map: Record<string, Action>,
	) {
		this.keys = scene.input.keyboard.addKeys(bindings) as Record<string, Phaser.Input.Keyboard.Key>
	}

	public pollPick(): Action | null {
		for (const name of Object.keys(this.map)) {
			const key = this.keys[name]
			if (key && Phaser.Input.Keyboard.JustDown(key)) {
				return this.map[name]
			}
		}
		return null
	}
}
