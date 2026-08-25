import Phaser from 'phaser'
import { Atlases } from '../assets'
import { Loader } from '../utils/asset'

export default class Preloader extends Phaser.Scene {
	private preloadBar: Phaser.GameObjects.Image
	private barWidth = 0

	constructor() {
		super({ key: 'Preloader' })
	}

	preload() {
		const cx = this.scale.width / 2
		const cy = this.scale.height / 2
		this.add.image(cx, cy, Atlases.PreloadSprites.getName(), Atlases.PreloadSprites.Frames.PreloadFrame)
		this.preloadBar = this.add.image(cx, cy, Atlases.PreloadSprites.getName(), Atlases.PreloadSprites.Frames.PreloadBar)
		this.preloadBar.setOrigin(0, 0.5)
		this.barWidth = this.preloadBar.width
		this.preloadBar.x -= this.barWidth * 0.5
		this.preloadBar.setScale(0, 1)

		this.load.on('progress', (value: number) => {
			this.preloadBar.setScale(value, 1)
		})

		Loader.loadAllAssets(this, () => {
			if (this.load.totalToLoad === 0) {
				Loader.waitForSoundDecoding(this, () => this.fadeToSelect())
			}
		})
	}

	create() {
		Loader.waitForSoundDecoding(this, () => this.fadeToSelect())
	}

	private fadeToSelect() {
		this.cameras.main.fadeOut(1000, 0, 0, 0, () => {
			this.scene.start('Select')
		})
	}
}
