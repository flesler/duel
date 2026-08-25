import Phaser from 'phaser'
import { Char, Anim } from '../entities/Char'
import * as selection from './selection'
const { KeyCodes } = Phaser.Input.Keyboard

export default class Select extends Phaser.Scene {
	private preview1: Char
	private preview2: Char
	private label1: Phaser.GameObjects.Text
	private label2: Phaser.GameObjects.Text
	private keys: Record<string, Phaser.Input.Keyboard.Key>

	constructor() {
		super({ key: 'Select' })
	}

	create() {
		selection.reset()

		this.add.text(this.scale.width / 2, 80, 'DUEL', { fontFamily: 'monospace', fontSize: '48px', color: '#ffffff' }).setOrigin(0.5)

		this.preview1 = new Char(this, selection.characterOf(1), 1)
		this.preview1.setPosition(this.scale.width / 2 - 120, this.scale.height / 2 + 60)

		this.preview2 = new Char(this, selection.characterOf(2), -1)
		this.preview2.setPosition(this.scale.width / 2 + 120, this.scale.height / 2 + 60)

		this.label1 = this.add.text(this.preview1.x, this.preview1.y + 20, selection.characterOf(1), { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5)
		this.label2 = this.add.text(this.preview2.x, this.preview2.y + 20, selection.characterOf(2), { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5)

		this.add.text(this.scale.width / 2, this.scale.height - 50,
			'P1: A/D choose    P2: ←/→ choose    SPACE or ENTER: fight',
			{ fontFamily: 'monospace', fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)

		this.keys = this.input.keyboard.addKeys({
			back1: KeyCodes.A,
			charge1: KeyCodes.D,
			back2: KeyCodes.LEFT,
			charge2: KeyCodes.RIGHT,
			go1: KeyCodes.SPACE,
			go2: KeyCodes.ENTER,
		}) as Record<string, Phaser.Input.Keyboard.Key>
	}

	update() {
		if (Phaser.Input.Keyboard.JustDown(this.keys.back1)) {
			selection.cycle(1, -1)
		}
		if (Phaser.Input.Keyboard.JustDown(this.keys.charge1)) {
			selection.cycle(1, 1)
		}
		if (Phaser.Input.Keyboard.JustDown(this.keys.back2)) {
			selection.cycle(2, -1)
		}
		if (Phaser.Input.Keyboard.JustDown(this.keys.charge2)) {
			selection.cycle(2, 1)
		}

		this.preview1.setCharState(Anim.charge, true)
		this.preview2.setCharState(Anim.charge, true)
		this.label1.setText(selection.characterOf(1))
		this.label2.setText(selection.characterOf(2))

		if (Phaser.Input.Keyboard.JustDown(this.keys.go1) || Phaser.Input.Keyboard.JustDown(this.keys.go2)) {
			this.scene.start('Fight')
		}
	}
}
