import { Spritesheets } from '../assets'
import * as config from '../config'
import KeyboardController from '../input/KeyboardController'
import Controller from '../input/Controller'
import * as utils from '../utils'
import { Char, CharStates, CharDirection } from '../entities/Char'
import Scene from '../entities/Scene'

export default class extends Phaser.State {
	private player1: Char
	private player2: Char
	private controller1: Controller
	private controller2: Controller

	public create() {
		this.world.addChild(new Scene())

		const chars = utils.shuffle(utils.values(Spritesheets).map(s => s.getName()))
		this.player1 = this.createPlayer(1, chars[0])
		this.controller1 = KeyboardController.createPlayer1()
		this.player2 = this.createPlayer(-1, chars[1])
		this.controller2 = KeyboardController.createPlayer2()
	}

	private createPlayer(direction: CharDirection, asset: string): Char {
		const player: Char = new Char(asset, direction)
		player.tile = direction === 1 ? 1 : config.TILES - 2
		player.y = this.world.height - 30
		this.world.addChild(player)
		return player
	}

	public update() {
		this.check(this.player1, this.controller1)
		this.check(this.player2, this.controller2)
	}

	private check(player: Char, controller: Controller) {
		if (this.tweens.isTweening(player)) {
			return
		}

		const enemy: Char = player === this.player1 ? this.player2 : this.player1
		let state = controller.decide(player, enemy)
		let target: number
		switch (state) {
			case CharStates.back:
				target = player.tile - player.direction
				if (target > 0 && target < config.TILES) {
					player.tile = target
				} else {
					state = CharStates.idle
					this.shake(true)
				}
				break
			case CharStates.charge:
				target = player.tile + player.direction
				if (target === enemy.tile) {
					state = CharStates.attack
					this.shake(false)
				} else {
					player.tile = target
				}
				break
			case CharStates.attack:
				// this.audio('attack', 5)
				this.shake(false)
				break
			case CharStates.dead:
				// this.audio('die', 3)
				break
			case CharStates.heal:
				// this.audio('power', 2)
				break
		}
		player.state = state
	}

	private audio(key, max) {
		this.sound.stopAll()
		this.sound.play(key + utils.randint(1, max))
	}

	private shake(horizontal: boolean) {
		const dir = horizontal ? Phaser.Camera.SHAKE_HORIZONTAL : Phaser.Camera.SHAKE_BOTH
		this.camera.shake(0.01, 500, false, dir, true)
	}
}
