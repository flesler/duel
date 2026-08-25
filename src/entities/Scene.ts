import Phaser from 'phaser'
import { Images } from '../assets'
import * as utils from '../utils'

const TINTS = [0xffffff, 0xffffff, 0xff9999, 0xff99ff]

export default class SceneBg extends Phaser.GameObjects.Sprite {
	constructor(scene: Phaser.Scene) {
		super(scene, 0, 0, Images.Background.getName())
		scene.add.existing(this)
		this.setOrigin(0, 0)
		this.setTint(utils.pick(TINTS))
		this.scheduleThunder()
	}

	private scheduleThunder() {
		this.scene.time.delayedCall(utils.randint(8000, 15000), this.thunder, [], this)
	}

	private thunder() {
		this.scene.cameras.main.flash(700, 255, 255, 255)
		if (this.scene.cache.audio.exists('thunder1')) {
			this.scene.sound.play(`thunder${utils.randint(1, 3)}`)
		}
		this.scheduleThunder()
	}
}
