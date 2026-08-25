import Phaser from 'phaser'
import * as utils from '../utils'
import { Atlases, Images, Spritesheets, Audio } from '../assets'
import { MultiTouchSupport } from '../config'

const { PreloadSprites } = Atlases

export default class Boot extends Phaser.Scene {
	constructor() {
		super({ key: 'Boot' })
	}

	preload() {
		this.load.atlas(PreloadSprites.getName(), PreloadSprites.getPNG(), PreloadSprites.getJSONHash())
		for (const img of utils.values(Images)) {
			this.load.image(img.getName(), img.getPNG())
		}
		for (const sheet of utils.values(Spritesheets)) {
			this.load.spritesheet(sheet.getName(), sheet.getPNG(), {
				frameWidth: sheet.getFrameWidth(),
				frameHeight: sheet.getFrameHeight(),
				endFrame: sheet.getFrameMax() - 1,
				margin: sheet.getMargin(),
				spacing: sheet.getSpacing(),
			})
		}
		for (const audio of utils.values(Audio)) {
			this.load.audio(audio.getName(), audio.getMP3())
		}
	}

	create() {
		if (!MultiTouchSupport) {
			this.input.setTopOnly(true)
		}
		this.scene.start('Preloader')
	}
}
