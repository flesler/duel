import Phaser from 'phaser'
import KeyboardController from '../input/KeyboardController'
import type TurnController from '../input/Controller'
import { Char } from '../entities/Char'
import SceneBg from '../entities/Scene'
import * as selection from './selection'
import { funChip4 } from '../engine'
import { advanceCountdown, applyPick, createFightSession, fightLayout, finishReveal, outcomeFxKind, projectFightView, revealTurn, shouldReveal, safeBottomY, safeCenterX, type FightSession } from '../view'

export default class Fight extends Phaser.Scene {
	private player1: Char
	private player2: Char
	private controller1: TurnController
	private controller2: TurnController
	private session: FightSession
	private banner: Phaser.GameObjects.Text
	private turnLabel: Phaser.GameObjects.Text
	private pickLabel1: Phaser.GameObjects.Text
	private pickLabel2: Phaser.GameObjects.Text
	private bars: { g: Phaser.GameObjects.Graphics; side: 'A' | 'B' }[] = []
	private layout = fightLayout()

	constructor() {
		super({ key: 'Fight' })
	}

	create() {
		this.add.existing(new SceneBg(this))

		this.session = createFightSession(funChip4, {
			spriteA: selection.characterOf(1),
			spriteB: selection.characterOf(2),
		})
		this.player1 = new Char(this, this.session.fighters.A.sprite, 1)
		this.player2 = new Char(this, this.session.fighters.B.sprite, -1)
		this.controller1 = KeyboardController.createPlayer1(this)
		this.controller2 = KeyboardController.createPlayer2(this)

		const { safeX, safeY, margin, safeWidth } = this.layout
		const cx = safeCenterX(this.layout)

		this.banner = this.add.text(cx, safeY + 50, '', { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff' }).setOrigin(0.5).setVisible(false)
		this.turnLabel = this.add.text(cx, safeY + 82, '', { fontFamily: 'monospace', fontSize: '14px', color: '#cccccc' }).setOrigin(0.5)
		this.pickLabel1 = this.add.text(safeX + margin, safeY + 64, '', { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' })
		this.pickLabel2 = this.add.text(safeX + safeWidth - margin, safeY + 64, '', { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' }).setOrigin(1, 0)

		this.add.text(safeX + margin, safeBottomY(this.layout, 70), 'P1: SPACE Strike  D Push  W Parry  S Heal', { fontFamily: 'monospace', fontSize: '12px', color: '#aaaaaa' })
		this.add.text(safeX + safeWidth - margin, safeBottomY(this.layout, 70), 'P2: ENTER Strike  → Push  ↑ Parry  ↓ Heal', { fontFamily: 'monospace', fontSize: '12px', color: '#aaaaaa' }).setOrigin(1, 0)

		this.bars = [
			{ g: this.add.graphics(), side: 'A' },
			{ g: this.add.graphics(), side: 'B' },
		]
		this.add.text(safeX + margin, safeY + 42, 'P1', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' })
		this.add.text(safeX + safeWidth - margin, safeY + 42, 'P2', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(1, 0)

		this.applyView()
		this.startCountdown()
	}

	update() {
		if (this.session.flow === 'over') {
			if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R))) {
				selection.reset()
				this.scene.start('Select')
			}
			this.applyView()
			return
		}
		if (this.session.flow === 'pick') {
			this.pollPicks()
		}
		this.applyView()
	}

	private startCountdown() {
		const tick = () => {
			this.session = advanceCountdown(this.session)
			this.applyView()
			if (this.session.flow === 'countdown') {
				const delay = this.session.countdown === 'fight' ? 500 : 800
				this.time.delayedCall(delay, tick)
			}
		}
		this.time.delayedCall(300, tick)
	}

	private pollPicks() {
		const p1 = this.controller1.pollPick()
		const p2 = this.controller2.pollPick()
		if (p1) {
			this.session = applyPick(this.session, 'A', p1)
		}
		if (p2) {
			this.session = applyPick(this.session, 'B', p2)
		}
		if (shouldReveal(this.session)) {
			this.revealTurn()
		}
	}

	private revealTurn() {
		this.session = revealTurn(this.session)
		this.applyView()
		this.playOutcomeFx()
		this.time.delayedCall(1200, () => {
			this.session = finishReveal(this.session)
			this.applyView()
		})
	}

	private playOutcomeFx() {
		const kind = outcomeFxKind(this.session)
		if (kind === 'hit') {
			this.cameras.main.shake(200, 0.01)
		}
		if (kind) {
			this.playSound(kind === 'power' ? 'power' : kind)
		}
	}

	private applyView() {
		const view = projectFightView(this.session, this.layout)
		this.player1.applyFighterView(view.fighters.A)
		this.player2.applyFighterView(view.fighters.B)

		this.banner.setText(view.hud.banner.text).setVisible(view.hud.banner.visible)
		this.turnLabel.setText(view.hud.turnLabel)
		this.pickLabel1.setText(view.hud.pickA)
		this.pickLabel2.setText(view.hud.pickB)

		for (const bar of view.hud.hpBars) {
			const slot = this.bars.find(b => b.side === bar.side)!
			const { g } = slot
			g.clear()
			g.lineStyle(2, 0xffffff)
			g.strokeRect(bar.x, bar.y, bar.w, bar.h)
			if (bar.ratio > 0) {
				g.fillStyle(0x33cc33)
				g.fillRect(bar.x + 2, bar.y + 2, (bar.w - 4) * bar.ratio, bar.h - 4)
			}
		}
	}

	private playSound(name: string) {
		if (this.cache.audio.exists(name)) {
			this.sound.play(name)
		}
	}
}
