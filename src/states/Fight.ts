import Phaser from 'phaser'
import KeyboardController from '../input/KeyboardController'
import type TurnController from '../input/Controller'
import { Char, Anim } from '../entities/Char'
import SceneBg from '../entities/Scene'
import * as config from '../config'
import * as selection from './selection'
import { createMatch, submitPick, bothPicked, resolveTurn, beginNextTurn, DISPLAY, funChip4, type DuelMatch } from '../engine'

type Flow = 'countdown' | 'pick' | 'reveal' | 'over'

export default class Fight extends Phaser.Scene {
	private player1: Char
	private player2: Char
	private controller1: TurnController
	private controller2: TurnController
	private match: DuelMatch
	private flow: Flow = 'countdown'
	private banner: Phaser.GameObjects.Text
	private turnLabel: Phaser.GameObjects.Text
	private pickLabel1: Phaser.GameObjects.Text
	private pickLabel2: Phaser.GameObjects.Text
	private bars: { g: Phaser.GameObjects.Graphics; x: number; y: number; w: number; h: number; owner: Char }[] = []

	constructor() {
		super({ key: 'Fight' })
	}

	create() {
		this.add.existing(new SceneBg(this))

		this.match = createMatch(funChip4)
		this.player1 = this.createPlayer(1, selection.characterOf(1))
		this.player2 = this.createPlayer(-1, selection.characterOf(2))
		this.controller1 = KeyboardController.createPlayer1(this)
		this.controller2 = KeyboardController.createPlayer2(this)

		this.banner = this.add.text(this.scale.width / 2, 50, '', { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff' }).setOrigin(0.5).setVisible(false)
		this.turnLabel = this.add.text(this.scale.width / 2, 82, '', { fontFamily: 'monospace', fontSize: '14px', color: '#cccccc' }).setOrigin(0.5)
		this.pickLabel1 = this.add.text(20, 64, '', { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' })
		this.pickLabel2 = this.add.text(this.scale.width - 20, 64, '', { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' }).setOrigin(1, 0)

		this.add.text(20, this.scale.height - 70, 'P1: SPACE Strike  D Push  W Parry  S Heal', { fontFamily: 'monospace', fontSize: '12px', color: '#aaaaaa' })
		this.add.text(this.scale.width - 20, this.scale.height - 70, 'P2: ENTER Strike  → Push  ↑ Parry  ↓ Heal', { fontFamily: 'monospace', fontSize: '12px', color: '#aaaaaa' }).setOrigin(1, 0)

		this.createHUD()
		this.syncHp()
		this.updateTurnHud()
		this.startCountdown()
	}

	update() {
		if (this.flow === 'over') {
			if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R))) {
				selection.reset()
				this.scene.start('Select')
			}
			return
		}
		if (this.flow === 'pick') {
			this.pollPicks()
		}
		this.drawBars()
	}

	private createHUD() {
		const w = 250
		const barH = 16
		this.bars = [this.player1, this.player2].map((p, i) => {
			const g = this.add.graphics()
			return { g, x: i === 0 ? 20 : this.scale.width - 20 - w, y: 20, w, h: barH, owner: p }
		})
		this.add.text(20, 42, 'P1', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' })
		this.add.text(this.scale.width - 20, 42, 'P2', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(1, 0)
	}

	private createPlayer(direction: 1 | -1, asset: string): Char {
		const player = new Char(this, asset, direction)
		player.setTile(direction === 1 ? 2 : config.TILES - 3)
		player.y = this.scale.height - 30
		return player
	}

	private startCountdown() {
		this.flow = 'countdown'
		let step = 3
		const tick = () => {
			if (step > 1) {
				this.banner.setText(String(step)).setVisible(true)
				step--
				this.time.delayedCall(800, tick)
			} else {
				this.banner.setText('FIGHT!').setVisible(true)
				this.time.delayedCall(500, () => {
					this.banner.setVisible(false)
					this.flow = 'pick'
					this.updateTurnHud()
				})
			}
		}
		this.time.delayedCall(300, tick)
	}

	private pollPicks() {
		const p1 = this.controller1.pollPick()
		const p2 = this.controller2.pollPick()
		if (p1) {
			this.match = submitPick(this.match, 'A', p1)
		}
		if (p2) {
			this.match = submitPick(this.match, 'B', p2)
		}
		this.updatePickHud()
		if (bothPicked(this.match)) {
			this.revealTurn()
		}
	}

	private updatePickHud() {
		this.pickLabel1.setText(this.match.pickA ? `P1: ${DISPLAY[this.match.pickA]} ✓` : 'P1: pick…')
		this.pickLabel2.setText(this.match.pickB ? `P2: ${DISPLAY[this.match.pickB]} ✓` : 'P2: pick…')
		if (this.match.pickA && !this.match.pickB) {
			this.banner.setText('Waiting for P2…').setVisible(true)
		} else if (!this.match.pickA && this.match.pickB) {
			this.banner.setText('Waiting for P1…').setVisible(true)
		} else if (!this.match.pickA && !this.match.pickB) {
			this.banner.setVisible(false)
		}
	}

	private revealTurn() {
		this.flow = 'reveal'
		this.banner.setVisible(false)
		this.match = resolveTurn(this.match)
		this.syncHp()

		const { a, b } = this.match.lastPicks!
		this.pickLabel1.setText(`P1: ${DISPLAY[a]}`)
		this.pickLabel2.setText(`P2: ${DISPLAY[b]}`)

		this.player1.face(this.player2.x)
		this.player2.face(this.player1.x)
		this.player1.setCharState(this.player1.animStateFor(a), true)
		this.player2.setCharState(this.player2.animStateFor(b), true)

		this.playOutcomeFx()
		this.time.delayedCall(1200, () => this.afterReveal())
	}

	private playOutcomeFx() {
		const o = this.match.lastOutcome!
		if (o.hitA || o.hitB) {
			this.cameras.main.shake(200, 0.01)
			this.playSound('hit')
		} else if (o.dA > 0 || o.dB > 0) {
			this.playSound('power')
		} else {
			this.playSound('block')
		}
		if (o.hitB) {
			this.player2.setCharState(Anim.hit, true)
		}
		if (o.hitA) {
			this.player1.setCharState(Anim.hit, true)
		}
	}

	private afterReveal() {
		if (this.match.winner) {
			this.endMatch()
			return
		}
		this.match = beginNextTurn(this.match)
		this.flow = 'pick'
		this.pickLabel1.setText('')
		this.pickLabel2.setText('')
		this.player1.setCharState(Anim.idle)
		this.player2.setCharState(Anim.idle)
		this.updateTurnHud()
	}

	private endMatch() {
		this.flow = 'over'
		let winner: Char | null = null
		if (this.match.winner === 'A') {
			winner = this.player1
		} else if (this.match.winner === 'B') {
			winner = this.player2
		}
		if (winner) {
			winner.setCharState(Anim.win)
			const name = winner === this.player1 ? 'Player 1' : 'Player 2'
			const ko = this.match.hpA <= 0 || this.match.hpB <= 0
			this.banner.setText(ko ? `${name} wins! Press R to rematch` : `Time! ${name} wins on health. Press R to rematch`).setVisible(true)
		} else {
			this.banner.setText("Time! It's a draw. Press R to rematch").setVisible(true)
		}
	}

	private syncHp() {
		const max = this.match.rules.hp
		this.player1.setHp(this.match.hpA, max)
		this.player2.setHp(this.match.hpB, max)
	}

	private updateTurnHud() {
		this.turnLabel.setText(`Turn ${this.match.turn} / ${this.match.rules.maxTurns}`)
	}

	private drawBars() {
		for (const { g, x, y, w, h, owner } of this.bars) {
			const ratio = Math.max(0, owner.health / owner.maxHealth)
			g.clear()
			g.lineStyle(2, 0xffffff)
			g.strokeRect(x, y, w, h)
			if (ratio > 0) {
				g.fillStyle(0x33cc33)
				g.fillRect(x + 2, y + 2, (w - 4) * ratio, h - 4)
			}
		}
	}

	private playSound(name: string) {
		if (this.cache.audio.exists(name)) {
			this.sound.play(name)
		}
	}
}
