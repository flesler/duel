import { Spritesheets } from '../assets'
import game from '../game'
import { Char, CharStates } from '../entities/Char'
import * as selection from './selection'

const names = Object.keys(Spritesheets)
const { KeyCode } = Phaser

export default class extends Phaser.State {
	private title: Phaser.Text
	private hint: Phaser.Text
	private preview1: Char
	private preview2: Char
	private label1: Phaser.Text
	private label2: Phaser.Text
	private keys: any

	public create() {
		selection.reset()

		this.title = this.add.text(game.world.centerX, 80, 'DUEL', { font: '48px monospace', fill: '#fff' })
		this.title.anchor.set(0.5)

		this.preview1 = new Char(names[selection[1]], 1)
		this.preview1.x = game.world.centerX - 120
		this.preview1.y = game.world.height / 2 + 60
		this.world.addChild(this.preview1)

		this.preview2 = new Char(names[selection[2]], -1)
		this.preview2.x = game.world.centerX + 120
		this.preview2.y = game.world.height / 2 + 60
		this.world.addChild(this.preview2)

		this.label1 = this.add.text(this.preview1.x, this.preview1.y + 20, names[selection[1]], { font: '16px monospace', fill: '#fff' })
		this.label1.anchor.set(0.5)
		this.label2 = this.add.text(this.preview2.x, this.preview2.y + 20, names[selection[2]], { font: '16px monospace', fill: '#fff' })
		this.label2.anchor.set(0.5)

		this.hint = this.add.text(game.world.centerX, game.world.height - 50,
			'P1: A/D choose    P2: ←/→ choose    SPACE or ENTER: fight', { font: '16px monospace', fill: '#ccc' })
		this.hint.anchor.set(0.5)

		this.keys = game.input.keyboard.addKeys({
			back1: KeyCode.A, charge1: KeyCode.D, back2: KeyCode.LEFT, charge2: KeyCode.RIGHT, go1: KeyCode.SPACEBAR, go2: KeyCode.ENTER,
		})
	}

	public update() {
		if (this.keys.back1.justDown) selection.cycle(1, -1)
		if (this.keys.charge1.justDown) selection.cycle(1, 1)
		if (this.keys.back2.justDown) selection.cycle(2, -1)
		if (this.keys.charge2.justDown) selection.cycle(2, 1)

		this.preview1.state = CharStates.charge
		this.preview2.state = CharStates.charge
		this.label1.text = names[selection[1]]
		this.label2.text = names[selection[2]]

		if (this.keys.go1.justDown || this.keys.go2.justDown) {
			this.game.state.start('Fight')
		}
	}
}
