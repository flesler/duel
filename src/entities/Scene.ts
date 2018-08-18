import { Images } from '../assets'
import game from '../game'
import * as utils from '../utils'

const { Color } = Phaser
const TINTS: number[] = [Color.WHITE, Color.WHITE, 0xFF9999, 0xFF99FF]

export default class extends Phaser.Sprite {
	constructor() {
		super(game, 0, 0, Images.Background.getName())

		this.init()
	}

	private init() {
		this.inputEnabled = false
		this.tint = utils.pick(TINTS)
		this.cacheAsBitmap = true
		this.scheduleThunder()
	}

	private scheduleThunder() {
		setTimeout(this.thunder, utils.randint(8000, 15000))
	}

	private thunder = () => {
		game.camera.flash(0xFFFFFF, utils.randint(700, 1300), true, 0.8)
		game.sound.play('thunder' + utils.randint(1, 3))
		this.scheduleThunder()
	}
}
