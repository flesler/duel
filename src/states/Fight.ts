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
	private cooldowns: number[] = [0, 0]
	private over = false
	private banner: Phaser.Text
	private timer: Phaser.TimerEvent | null = null

	public create() {
		this.world.addChild(new Scene())

		const chars = utils.shuffle(utils.values(Spritesheets).map(s => s.getName()))
		this.player1 = this.createPlayer(1, chars[0])
		this.controller1 = KeyboardController.createPlayer1()
		this.player2 = this.createPlayer(-1, chars[1])
		this.controller2 = KeyboardController.createPlayer2()
		this.cooldowns = [0, 0]
		this.over = false

		this.banner = this.add.text(this.world.width / 2, 50, '', { font: '28px monospace', fill: '#fff' })
		this.banner.anchor.set(0.5)
		this.banner.visible = false

		this.timer = this.game.time.events.add(config.ROUND_TIME, this.timeOut, this)
	}

	private createPlayer(direction: CharDirection, asset: string): Char {
		const player: Char = new Char(asset, direction)
		player.tile = direction === 1 ? 1 : config.TILES - 2
		player.y = this.world.height - 30
		this.world.addChild(player)
		return player
	}

	public update() {
		if (this.over) {
			if (this.game.input.keyboard.isDown(Phaser.KeyCode.R)) {
				this.state.start('Fight')
			}
			return
		}
		this.check(0)
		this.check(1)
	}

	private check(index: number) {
		const player: Char = index === 0 ? this.player1 : this.player2
		const controller: Controller = index === 0 ? this.controller1 : this.controller2
		const enemy: Char = index === 0 ? this.player2 : this.player1

		if (player.isDead || player.state === CharStates.dead) {
			return
		}

		player.face(enemy.x)

		if (this.tweens.isTweening(player) || this.game.time.now < this.cooldowns[index]) {
			return
		}

		const enemyBlocking = enemy.state === CharStates.block
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
					this.dealDamage(player, enemy, config.CHARGE_DAMAGE, enemyBlocking)
				} else if (target > 0 && target < config.TILES) {
					player.tile = target
				} else {
					state = CharStates.idle
					this.shake(true)
				}
				break
			case CharStates.attack:
				this.play('attack')
				if (Math.abs(enemy.tile - player.tile) <= 1) {
					this.dealDamage(player, enemy, config.ATTACK_DAMAGE, enemyBlocking)
				}
				break
			case CharStates.heal:
				player.restore(-config.HEAL_DAMAGE)
				this.play('power')
				break
			case CharStates.block:
				break
		}

		player.state = state
		if (state !== CharStates.idle && state !== CharStates.block) {
			this.cooldowns[index] = this.game.time.now + config.ACTION_COOLDOWN
			this.unlock(player, state)
		}
	}

	private unlock(player: Char, state: typeof CharStates[keyof typeof CharStates]) {
		this.game.time.events.add(900, () => {
			if (!this.over && player.state === state) {
				player.state = CharStates.idle
			}
		})
	}

	private dealDamage(from: Char, to: Char, dmg: number, blocking: boolean) {
		const actual = blocking ? dmg * config.BLOCK_MITIGATION : dmg
		this.shake(false)
		to.hit(actual)
		if (to.isDead) {
			to.state = CharStates.dead
			this.play('die')
			this.end(from)
		} else {
			to.state = CharStates.hit
		}
	}

	private end(winner: Char) {
		this.over = true
		;(this.timer as any)?.remove(false)
		winner.state = CharStates.win
		const name = winner === this.player1 ? 'Player 1' : 'Player 2'
		this.banner.text = `${name} wins! Press R to rematch`
		this.banner.visible = true
	}

	private timeOut = () => {
		if (this.over) {
			return
		}
		let winner: Char
		if (this.player1.health > this.player2.health) {
			winner = this.player1
		} else if (this.player2.health > this.player1.health) {
			winner = this.player2
		}
		this.over = true
		;(this.timer as any)?.remove(false)
		if (winner) {
			winner.state = CharStates.win
			const name = winner === this.player1 ? 'Player 1' : 'Player 2'
			this.banner.text = `Time! ${name} wins on health. Press R to rematch`
		} else {
			this.banner.text = "Time! It's a draw. Press R to rematch"
		}
		this.banner.visible = true
	}

	private shake(horizontal: boolean) {
		const dir = horizontal ? Phaser.Camera.SHAKE_HORIZONTAL : Phaser.Camera.SHAKE_BOTH
		this.camera.shake(0.01, 500, false, dir, true)
	}

	private play(name: string) {
		if (this.game.cache.getSound(name)) {
			this.game.sound.play(name)
		}
	}
}
