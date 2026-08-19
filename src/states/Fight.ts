import * as config from '../config'
import KeyboardController from '../input/KeyboardController'
import Controller from '../input/Controller'
import { Char, CharStates, CharDirection } from '../entities/Char'
import Scene from '../entities/Scene'
import * as selection from './selection'

export default class extends Phaser.State {
	private player1: Char
	private player2: Char
	private controller1: Controller
	private controller2: Controller
	private cooldowns: number[] = [0, 0]
	private over = false
	private locked = true
	private banner: Phaser.Text
	private timer: Phaser.TimerEvent | null = null
	private bars: { g: Phaser.Graphics; x: number; y: number; w: number; h: number; owner: Char }[] = []

	public create() {
		this.world.addChild(new Scene())

		this.player1 = this.createPlayer(1, selection.characterOf(1))
		this.controller1 = KeyboardController.createPlayer1()
		this.player2 = this.createPlayer(-1, selection.characterOf(2))
		this.controller2 = KeyboardController.createPlayer2()
		this.cooldowns = [0, 0]
		this.over = false

		this.banner = this.add.text(this.world.width / 2, 50, '', { font: '28px monospace', fill: '#fff' })
		this.banner.anchor.set(0.5)
		this.banner.visible = false
		this.createHUD()
		this.timer = this.game.time.events.add(config.ROUND_TIME, this.timeOut, this)
		this.locked = true
		let step = 3
		const count = () => {
			if (step > 1) {
				this.banner.text = String(step)
				this.banner.visible = true
				step--
				this.game.time.events.add(800, count, this)
			} else {
				this.banner.text = 'FIGHT!'
				this.banner.visible = true
				this.game.time.events.add(500, () => {
					this.banner.visible = false
					this.locked = false
				}, this)
			}
		}
		this.game.time.events.add(300, count, this)
	}

	private createHUD() {
		const w = 250
		const barH = 16
		this.bars = [this.player1, this.player2].map((p, i) => {
			const g = this.add.graphics()
			return { g, x: i === 0 ? 20 : this.world.width - 20 - w, y: 20, w, h: barH, owner: p }
		})
		this.add.text(20, 42, 'P1', { font: '14px monospace', fill: '#fff' })
		this.add.text(this.world.width - 20, 42, 'P2', { font: '14px monospace', fill: '#fff' }).anchor.set(1, 0)
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
				selection.reset()
				this.state.start('Select')
			}
			return
		}
		if (this.locked) {
			return
		}
		this.check(0)
		this.check(1)
		for (const { g, x, y, w, h, owner } of this.bars) {
			const ratio = Math.max(0, owner.health / owner.maxHealth)
			g.clear()
			g.lineStyle(2, 0xFFFFFF)
			g.drawRect(x, y, w, h)
			if (ratio > 0) {
				g.beginFill(0x33CC33)
				g.drawRect(x + 2, y + 2, (w - 4) * ratio, h - 4)
				g.endFill()
			}
		}
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
		this.play(blocking ? 'block' : 'hit')
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
